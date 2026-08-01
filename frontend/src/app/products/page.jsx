import Link from "next/link";
import ProductCard from "../../../components/home/ProductCard";
import { serverFetch } from "../../../lib/serverApi";

async function getAllProducts() {
  try {
    const data = await serverFetch("/products");
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("❌ Product fetch error:", err);
    return [];
  }
}

export default async function AllProductsPage() {
  const products = await getAllProducts();

  return (
    <main className="bg-pink-50 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">All Products</span>
        </nav>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-semibold mb-6">
          All Products
        </h1>

        {/* Products Section */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <p>No products available.</p>
          </div>
        )}
      </div>
    </main>
  );
}
