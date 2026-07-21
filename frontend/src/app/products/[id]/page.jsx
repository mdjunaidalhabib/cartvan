import ProductDetailsLoader from "./ProductDetailsLoader";

const SITE_URL = "https://cartvan.com";
const API_BASE = process.env.BACKEND_API_URL?.replace(/\/$/, "");

export const revalidate = 300;

async function fetchApi(path) {
  if (!API_BASE) return null;

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      next: { revalidate },
      headers: { Accept: "application/json" },
    });

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error(`Product SEO fetch failed for ${path}:`, error);
    return null;
  }
}

async function getProductData(id) {
  const product = await fetchApi(`/products/${encodeURIComponent(id)}`);
  if (!product?._id) {
    return { product: null, category: null, related: [] };
  }

  const categoryId =
    typeof product.category === "object"
      ? product.category?._id
      : product.category;

  if (!categoryId) {
    return { product, category: null, related: [] };
  }

  const [category, relatedResult] = await Promise.all([
    fetchApi(`/categories/${encodeURIComponent(categoryId)}`),
    fetchApi(`/products/category/${encodeURIComponent(categoryId)}`),
  ]);

  const related = Array.isArray(relatedResult)
    ? relatedResult.filter((item) => item?._id !== id)
    : [];

  return { product, category, related };
}

function plainText(value, fallback = "") {
  const text = String(value || fallback)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text;
}

function getProductImages(product) {
  const variantImages = Array.isArray(product?.colors)
    ? product.colors.flatMap((color) =>
        Array.isArray(color?.images) ? color.images : [],
      )
    : [];

  return [
    product?.image,
    ...(Array.isArray(product?.images) ? product.images : []),
    ...variantImages,
  ].filter((image, index, list) => image && list.indexOf(image) === index);
}

function getProductPrice(product) {
  const variantPrices = Array.isArray(product?.colors)
    ? product.colors
        .map((color) => Number(color?.price))
        .filter((price) => Number.isFinite(price) && price >= 0)
    : [];

  if (variantPrices.length > 0) return Math.min(...variantPrices);

  const price = Number(product?.price);
  return Number.isFinite(price) ? price : 0;
}

function isProductAvailable(product) {
  if (product?.isSoldOut === true || product?.isSoldOut === "true") {
    return false;
  }

  if (Array.isArray(product?.colors) && product.colors.length > 0) {
    return product.colors.some((color) => Number(color?.stock || 0) > 0);
  }

  return Number(product?.stock || 0) > 0;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { product } = await getProductData(id);
  const canonical = `/products/${id}`;

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The requested Cartvan product could not be found.",
      alternates: { canonical },
      robots: { index: false, follow: false },
    };
  }

  const description = plainText(
    product.description,
    `Buy ${product.name} online from Cartvan with delivery across Bangladesh.`,
  ).slice(0, 160);
  const images = getProductImages(product);

  return {
    title: product.name,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      title: product.name,
      description,
      images: images.length > 0 ? images : ["/logo-512.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: images.length > 0 ? images : ["/logo-512.png"],
    },
  };
}

export default async function ProductDetailsPage({ params }) {
  const { id } = await params;
  const data = await getProductData(id);
  const product = data.product;

  const structuredData = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: plainText(product.description, product.name),
        image: getProductImages(product),
        sku: String(product._id),
        category:
          typeof product.category === "object"
            ? product.category?.name
            : data.category?.name,
        offers: {
          "@type": "Offer",
          url: `${SITE_URL}/products/${product._id}`,
          priceCurrency: "BDT",
          price: getProductPrice(product),
          availability: isProductAvailable(product)
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
        },
        ...(Number(product.rating) > 0 &&
        Array.isArray(product.reviews) &&
        product.reviews.length > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: Number(product.rating),
                reviewCount: product.reviews.length,
              },
            }
          : {}),
      }
    : null;

  return (
    <>
      {structuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
      ) : null}

      <ProductDetailsLoader
        id={id}
        initialProduct={data.product}
        initialCategory={data.category}
        initialRelated={data.related}
      />
    </>
  );
}
