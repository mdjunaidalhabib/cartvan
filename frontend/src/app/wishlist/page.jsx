"use client";
import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useCart } from "../../../context/CartContext";
import { apiFetch } from "../../../utils/api";
import ProductCard from "../../../components/home/ProductCard";
import CartSkeleton from "../../../components/skeletons/CartSkeleton"; // ✅ CartSkeleton import

export default function WishlistPage() {
  const { wishlist } = useCart();
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Load all products
  useEffect(() => {
    apiFetch("/products")
      .then((data) => {
        setAllProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Failed to fetch products", err);
        setLoading(false);
      });
  }, []);

  // 🔹 Filter wishlist products
  const wishlistProducts = useMemo(() => {
    return allProducts.filter((p) => wishlist.includes(String(p._id)));
  }, [allProducts, wishlist]);

  // 🌀 Skeleton loader (✅ container-এর মধ্যে)
  if (loading) {
    return (
      <div className="bg-pink-50">
        <div className="container mx-auto p-3 sm:p-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CartSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // 🔹 Empty state
  if (wishlistProducts.length === 0) {
    return (
      <div className="bg-pink-50 py-6 ">
        <div className="bg-pink-100 rounded-xl shadow p-6 text-center mx-3 sm:mx-auto sm:w-96">
          <p className="text-gray-500 text-lg">তোমার উইশলিস্ট খালি 😢</p>
          <Link
            href="/products"
            className="text-blue-500 hover:underline mt-2 inline-block"
          >
            পণ্য দেখুন
          </Link>
        </div>
      </div>
    );
  }

  // ✅ Wishlist view
  return (
    <div className="bg-pink-50">
      <div className="container mx-auto p-3 md:p-6">
        <div className="text-xl sm:text-2xl font-semibold text-center relative inline-block w-full mb-8">
          <span className="bg-gradient-to-r p-4 from-pink-500 via-purple-500 to-blue-600 text-transparent bg-clip-text">
            ❤️ আপনার উইশলিস্ট
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {wishlistProducts.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
