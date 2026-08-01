import CategoryBrowserClient from "../../../components/categories/CategoryBrowserClient";
import { serverFetch } from "../../../lib/serverApi";

async function getCategoriesData() {
  let categories = [];
  try {
    const data = await serverFetch("/categories");
    categories = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("❌ Categories fetch error:", err);
    return { categories: [], selectedCategoryId: null, products: [] };
  }

  categories = categories.filter((c) => c.isActive !== false);
  categories.sort((a, b) => (a.order || 0) - (b.order || 0));

  if (categories.length === 0) {
    return { categories, selectedCategoryId: null, products: [] };
  }

  const firstCategoryId = categories[0]._id;
  let products = [];
  try {
    const data = await serverFetch(`/products/category/${firstCategoryId}`);
    products = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("❌ Category products fetch error:", err);
  }

  return { categories, selectedCategoryId: firstCategoryId, products };
}

export default async function CategoryPage() {
  const { categories, selectedCategoryId, products } =
    await getCategoriesData();

  return (
    <CategoryBrowserClient
      initialCategories={categories}
      initialSelectedCategoryId={selectedCategoryId}
      initialProducts={products}
    />
  );
}
