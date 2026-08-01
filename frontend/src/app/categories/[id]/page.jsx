import Link from "next/link";
import ProductCard from "../../../../components/home/ProductCard";
import { serverFetch } from "../../../../lib/serverApi";

async function getCategoryData(id) {
  const [catRes, prodRes] = await Promise.allSettled([
    serverFetch(`/categories/${id}`),
    serverFetch(`/products/category/${id}`),
  ]);

  return {
    category: catRes.status === "fulfilled" ? catRes.value : null,
    products:
      prodRes.status === "fulfilled" && Array.isArray(prodRes.value)
        ? prodRes.value
        : [],
  };
}

export default async function CategoryPage({ params }) {
  const { id } = await params;
  const { category, products } = await getCategoryData(id);

  if (!category) {
    return (
      <div className="container mx-auto px-6 py-10">
        <h2 className="text-2xl font-semibold mb-6">Category not found ❌</h2>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-10">
      {/* ✅ Breadcrumb: হোম / Category name */}
      <nav className="text-sm text-gray-500 mb-3 flex items-center gap-1">
        <Link href="/" className="hover:text-blue-600 transition-colors">
          হোম
        </Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">{category.name}</span>
      </nav>

      {/* ✅ Heading: ছোট/স্লিম ক্যাটাগরি ইমেজ নামের ঠিক আগে (উপরে আলাদা banner না) + মোট প্রোডাক্ট সংখ্যা */}
      <div className="flex items-center gap-2 mb-6">
        {category.image && (
          <div className="relative w-6 h-6 sm:w-8 sm:h-8 rounded-lg overflow-hidden border flex-shrink-0">
            <img
              src={category.image} // ✅ Cloudinary full URL
              alt={category.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
          {category.name}
          <span className="ml-2 text-sm sm:text-base font-normal text-gray-500">
            ({products.length}টি প্রোডাক্ট)
          </span>
        </h2>
      </div>

      {/* Products */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No products found in this category.</p>
      )}
    </div>
  );
}
