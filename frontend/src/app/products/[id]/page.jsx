"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../../utils/api";
import ProductDetailsClient from "../../../../components/product-details/ProductDetailsClient";

import ProductDetailsSkeleton from "../../../../components/skeletons/ProductDetailsSkeleton";

export default function ProductDetailsPage() {
  const params = useParams();
  const id = params?.id;

  const [state, setState] = useState({
    product: null,
    category: null,
    related: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!id) return;

    const fetchAllData = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        // ১. প্রোডাক্ট ডেটা লোড
        const product = await apiFetch(`/products/${id}`);

        if (!product || !product._id) {
          throw new Error("Product not found");
        }

        // ইমেজ ফলব্যাক লজিক
        if (!product.image && product.images?.length > 0) {
          product.image = product.images[0];
        }
        if (!product.image) {
          product.image = "/no-image.png";
        }

        // ২. ক্যাটাগরি আইডি নির্ধারণ
        const categoryId =
          typeof product.category === "object"
            ? product.category?._id
            : product.category;

        // ৩. ক্যাটাগরি এবং রিলেটেড প্রোডাক্ট একসাথে ফেচ করা (Parallel Fetch)
        let categoryData = null;
        let relatedData = [];

        if (categoryId) {
          const [cat, rel] = await Promise.all([
            apiFetch(`/categories/${categoryId}`).catch(() => null),
            apiFetch(`/products/category/${categoryId}`).catch(() => []),
          ]);
          categoryData = cat;
          relatedData = Array.isArray(rel)
            ? rel.filter((p) => p._id !== id)
            : [];
        }

        setState({
          product,
          category: categoryData,
          related: relatedData,
          loading: false,
          error: null,
        });
      } catch (err) {
        console.error("❌ Data fetch error:", err);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err.message || "Something went wrong",
        }));
      }
    };

    fetchAllData();
  }, [id]);

  // যদি লোড হতে থাকে তবে স্কেলিটন দেখাবে
  if (state.loading) {
    return <ProductDetailsSkeleton />;
  }

  // যদি এরর থাকে বা প্রোডাক্ট না পাওয়া যায়
  if (state.error || !state.product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm inline-block">
          <h2 className="text-2xl font-bold text-gray-800">
            Oops! Product Not Found
          </h2>
          <p className="text-gray-500 mt-2">
            The product might have been removed or the link is incorrect.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // সফলভাবে ডাটা পেলে ক্লায়েন্ট কম্পোনেন্ট রেন্ডার
  return (
    <ProductDetailsClient
      product={state.product}
      category={state.category}
      related={state.related}
      loading={false}
    />
  );
}
