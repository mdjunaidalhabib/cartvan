"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../../utils/api";
import ProductDetailsClient from "../../../../components/product-details/ProductDetailsClient";
import ProductDetailsSkeleton from "../../../../components/skeletons/ProductDetailsSkeleton";

function normalizeProduct(product) {
  if (!product) return null;

  const normalized = { ...product };
  if (!normalized.image && normalized.images?.length > 0) {
    normalized.image = normalized.images[0];
  }
  if (!normalized.image) normalized.image = "/no-image.png";

  return normalized;
}

export default function ProductDetailsLoader({
  id,
  initialProduct = null,
  initialCategory = null,
  initialRelated = [],
}) {
  const normalizedInitialProduct = normalizeProduct(initialProduct);

  const [state, setState] = useState({
    product: normalizedInitialProduct,
    category: initialCategory,
    related: Array.isArray(initialRelated) ? initialRelated : [],
    loading: !normalizedInitialProduct,
    error: null,
  });

  useEffect(() => {
    if (!id || normalizedInitialProduct?._id === id) return;

    let cancelled = false;

    const fetchAllData = async () => {
      try {
        setState((previous) => ({
          ...previous,
          loading: true,
          error: null,
        }));

        const fetchedProduct = normalizeProduct(
          await apiFetch(`/products/${id}`),
        );

        if (!fetchedProduct?._id) {
          throw new Error("Product not found");
        }

        const categoryId =
          typeof fetchedProduct.category === "object"
            ? fetchedProduct.category?._id
            : fetchedProduct.category;

        let category = null;
        let related = [];

        if (categoryId) {
          const [categoryResult, relatedResult] = await Promise.all([
            apiFetch(`/categories/${categoryId}`).catch(() => null),
            apiFetch(`/products/category/${categoryId}`).catch(() => []),
          ]);

          category = categoryResult;
          related = Array.isArray(relatedResult)
            ? relatedResult.filter((item) => item._id !== id)
            : [];
        }

        if (!cancelled) {
          setState({
            product: fetchedProduct,
            category,
            related,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error("Product data fetch error:", error);
        if (!cancelled) {
          setState((previous) => ({
            ...previous,
            loading: false,
            error: error.message || "Something went wrong",
          }));
        }
      }
    };

    fetchAllData();

    return () => {
      cancelled = true;
    };
  }, [id, normalizedInitialProduct?._id]);

  if (state.loading) return <ProductDetailsSkeleton />;

  if (state.error || !state.product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm inline-block">
          <h1 className="text-2xl font-bold text-gray-800">
            Oops! Product Not Found
          </h1>
          <p className="text-gray-500 mt-2">
            The product might have been removed or the link is incorrect.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProductDetailsClient
      product={state.product}
      category={state.category}
      related={state.related}
      loading={false}
    />
  );
}
