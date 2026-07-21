const SITE_URL = "https://cartvan.com";
const API_BASE = process.env.BACKEND_API_URL?.replace(/\/$/, "");

export const revalidate = 3600;

async function fetchCollection(path) {
  if (!API_BASE) return [];

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      next: { revalidate },
      headers: { Accept: "application/json" },
    });

    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Sitemap fetch failed for ${path}:`, error);
    return [];
  }
}

function safeDate(value, fallback) {
  const date = value ? new Date(value) : fallback;
  return Number.isNaN(date.getTime()) ? fallback : date;
}

export default async function sitemap() {
  const now = new Date();
  const [products, categories] = await Promise.all([
    fetchCollection("/products"),
    fetchCollection("/categories"),
  ]);

  const staticPages = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/products`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/categories`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const productPages = products
    .filter((product) => product?._id && product?.isActive !== false)
    .map((product) => ({
      url: `${SITE_URL}/products/${product._id}`,
      lastModified: safeDate(product.updatedAt || product.createdAt, now),
      changeFrequency: "weekly",
      priority: 0.8,
      images: [
        product.image,
        ...(Array.isArray(product.images) ? product.images : []),
      ].filter((image, index, list) => image && list.indexOf(image) === index),
    }));

  const categoryPages = categories
    .filter((category) => category?._id && category?.isActive !== false)
    .map((category) => ({
      url: `${SITE_URL}/categories/${category._id}`,
      lastModified: safeDate(category.updatedAt || category.createdAt, now),
      changeFrequency: "weekly",
      priority: 0.7,
      images: category.image ? [category.image] : undefined,
    }));

  return [...staticPages, ...productPages, ...categoryPages];
}
