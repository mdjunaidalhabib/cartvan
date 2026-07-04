"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProductCard from "../../../../components/home/ProductCard";
import ProductCardSkeleton from "../../../../components/skeletons/ProductCardSkeleton";
import { apiFetch } from "../../../../utils/api";

export default function CategoryPage() {
  const { id } = useParams(); // 🔥 URL থেকে categoryId আসবে
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch category info + products
  // ⚠️ ফিক্স: apiFetch() নিজে থেকেই "/api" prefix জুড়ে দেয় (দেখুন utils/api.js
  // -এর baseUrl = "/api")। আগে এখানে apiFetch("/api/categories") এবং
  // apiFetch("/api/products/category/...") কল করা হচ্ছিল, যেটা আসলে
  // "/api/api/categories" ও "/api/api/products/category/..." তে গিয়ে হিট
  // করছিল — ব্যাকএন্ডে এই রুট নেই বলে request fail হয়ে "Category not found ❌"
  // দেখাচ্ছিল। এখন সঠিক path ব্যবহার করা হয়েছে (অন্য সব জায়গায় যেমন
  // HomeAllProduct.jsx-এ apiFetch("/categories") ব্যবহার হয়, একই কনভেনশন)।
  // ব্যাকএন্ডে /categories/:id এবং /products/category/:categoryId রুট
  // আগে থেকেই আছে, তাই সরাসরি id দিয়ে single category fetch করা যাচ্ছে।
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          apiFetch(`/categories/${id}`).catch(() => null),
          apiFetch(`/products/category/${id}`).catch(() => []),
        ]);

        setCategory(catRes || null);
        setProducts(Array.isArray(prodRes) ? prodRes : []);
      } catch (err) {
        console.error("❌ Failed to fetch category page data:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-10">
        {/* ✅ Breadcrumb skeleton */}
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-3" />

        {/* ✅ Heading skeleton: ছোট ইমেজ + নাম */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-gray-200 animate-pulse" />
          <div className="h-6 w-56 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* ✅ Product cards skeleton (একই grid, mobile ২ / desktop ৫) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

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
