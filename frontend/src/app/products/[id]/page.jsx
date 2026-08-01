import { serverFetch } from "../../../../lib/serverApi";
import ProductDetailsClient from "../../../../components/product-details/ProductDetailsClient";

async function getProductData(id) {
  let product;
  try {
    product = await serverFetch(`/products/${id}`);
  } catch {
    return { product: null, categories: [], related: [] };
  }

  if (!product?._id) {
    return { product: null, categories: [], related: [] };
  }

  // ইমেজ ফলব্যাক লজিক
  if (!product.image && product.images?.length > 0) {
    product.image = product.images[0];
  }
  if (!product.image) {
    product.image = "/no-image.png";
  }

  const categories = Array.isArray(product.categories)
    ? product.categories
    : [];
  const categoryIds = categories
    .map((c) => (typeof c === "object" ? c?._id : c))
    .filter(Boolean);

  let related = [];
  if (categoryIds.length > 0) {
    try {
      const relLists = await Promise.all(
        categoryIds.map((catId) =>
          serverFetch(`/products/category/${catId}`).catch(() => []),
        ),
      );
      const merged = new Map();
      relLists.flat().forEach((p) => {
        if (p?._id && p._id !== id) merged.set(p._id, p);
      });
      related = Array.from(merged.values());
    } catch {
      related = [];
    }
  }

  return { product, categories, related };
}

export default async function ProductDetailsPage({ params }) {
  const { id } = await params;
  const { product, categories, related } = await getProductData(id);

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm inline-block">
          <h2 className="text-2xl font-bold text-gray-800">
            Oops! Product Not Found
          </h2>
          <p className="text-gray-500 mt-2">
            The product might have been removed or the link is incorrect.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ProductDetailsClient
      product={product}
      categories={categories}
      related={related}
      loading={false}
    />
  );
}
