"use client";

import { useEffect, useState, useMemo } from "react";
import ProductForm from "../../../../components/productForm/ProductForm";
import ProductCard from "../../../../components/ProductCard";
import Toast from "../../../../components/Toast";
import ProductsSkeleton from "../../../../components/Skeleton/ProductsSkeleton";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState("all"); // all / active / hidden

  // ✅ NEW: Products সাব-মেনু — All Product / Free Delivery / Best Discount / Gift Box
  const [badgeFilter, setBadgeFilter] = useState("all");
  const [homeBadges, setHomeBadges] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const [toast, setToast] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ================== LOAD PRODUCTS ==================
  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/admin/products`,
      );
      const data = await res.json();

      const arr = Array.isArray(data) ? data : [];

      // ✅ SERIAL (order) FIRST (ASC), tie -> newer first
      arr.sort((a, b) => {
        const ao = Number(a?.order ?? 0);
        const bo = Number(b?.order ?? 0);
        if (ao !== bo) return ao - bo;
        return new Date(b?.createdAt) - new Date(a?.createdAt);
      });

      setProducts(arr);
    } catch (error) {
      console.error(error);
      setToast({ message: "⚠ Failed to load products", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();

    // ✅ Admin থেকে দেওয়া Offer Badge নাম লোড করা (dynamic tab label)
    fetch(`/api/admin/homeBadges`)
      .then((res) => res.json())
      .then((data) =>
        setHomeBadges(Array.isArray(data?.badges) ? data.badges : []),
      )
      .catch(() => setHomeBadges([]));
  }, []);

  const getBadgeName = (field, fallback) => {
    const b = homeBadges.find((x) => x.field === field);
    return b?.name || fallback;
  };

  // ================== FILTERED LIST ==================
  const statusFiltered =
    filter === "active"
      ? products.filter((p) => p.isActive)
      : filter === "hidden"
        ? products.filter((p) => !p.isActive)
        : products;

  // ✅ NEW: সাব-মেনু অনুযায়ী filter (Free Delivery / Best Discount / Gift Box)
  const filteredProducts =
    badgeFilter === "freeDelivery"
      ? statusFiltered.filter((p) => p.freeDelivery)
      : badgeFilter === "bestDiscount"
        ? statusFiltered.filter((p) => p.bestDiscount)
        : badgeFilter === "cartvanBox"
          ? statusFiltered.filter((p) => p.cartvanBox)
          : statusFiltered;

  // ✅ সাব-মেনুর প্রতিটি ট্যাবে কতগুলো প্রোডাক্ট আছে তার count
  const badgeCounts = useMemo(
    () => ({
      all: products.length,
      freeDelivery: products.filter((p) => p.freeDelivery).length,
      bestDiscount: products.filter((p) => p.bestDiscount).length,
      cartvanBox: products.filter((p) => p.cartvanBox).length,
    }),
    [products],
  );

  // check if ANY product is active → then bulk button = Hide All
  const hasAnyActive = useMemo(
    () => products.some((p) => p.isActive),
    [products],
  );

  // ================== DELETE PRODUCT ==================
  const confirmDelete = (product) => setDeleteModal(product);

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);

    try {
      const res = await fetch(
        `/api/admin/products/${deleteModal._id}`,
        { method: "DELETE" },
      );

      if (res.ok) {
        setToast({ message: "🗑 Product deleted!", type: "success" });
        loadProducts();
      } else {
        setToast({ message: "❌ Error deleting product", type: "error" });
      }

      setDeleteModal(null);
    } catch {
      setToast({ message: "🌐 Network error", type: "error" });
    }

    setDeleting(false);
  };

  // ================== BULK HIDE / SHOW ==================
  const toggleAllProducts = async () => {
    try {
      setLoading(true);
      const newStatus = !hasAnyActive;

      await Promise.all(
        products.map((p) =>
          fetch(`/api/admin/products/${p._id}`, {
            method: "PUT",
            body: (() => {
              const d = new FormData();
              d.append("isActive", newStatus ? "true" : "false");
              d.append("order", String(p?.order ?? 0)); // keep serial same
              return d;
            })(),
          }),
        ),
      );

      setToast({
        message: newStatus
          ? "✅ All products activated!"
          : "👁 All products hidden!",
        type: "success",
      });

      loadProducts();
    } catch (err) {
      console.error(err);
      setToast({ message: "❌ Bulk update failed", type: "error" });
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* ===================== HEADER ===================== */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">✨ Product Manager</h1>

        {/* Right side controls */}
        <div className="flex flex-col items-end gap-2 lg:flex-row lg:items-center lg:gap-2 lg:ml-auto">
          {/* ✅ ADD PRODUCT (FIXED) */}
          <button
            onClick={() => {
              setEditProduct(null); // ✅ IMPORTANT: must be null for Add mode
              setShowForm(true);
            }}
            className="order-1 lg:order-last bg-blue-600 text-white shadow font-semibold px-3 py-1.5 rounded-md text-sm hover:bg-blue-700 active:scale-[0.98] lg:px-4 lg:py-2 lg:text-base lg:rounded-lg"
          >
            + Add Product
          </button>

          {/* FILTER BUTTONS */}
          <div className="order-2 lg:order-first flex flex-wrap justify-end gap-1.5 lg:gap-2">
            <button
              className={`px-2.5 py-1.5 rounded-md border text-xs leading-none lg:px-4 lg:py-2.5 lg:text-base lg:rounded-lg ${
                filter === "all" ? "bg-indigo-600 text-white" : "bg-white"
              }`}
              onClick={() => setFilter("all")}
            >
              All
            </button>

            <button
              className={`px-2.5 py-1.5 rounded-md border text-xs leading-none lg:px-4 lg:py-2.5 lg:text-base lg:rounded-lg ${
                filter === "active" ? "bg-green-600 text-white" : "bg-white"
              }`}
              onClick={() => setFilter("active")}
            >
              Active
            </button>

            <button
              className={`px-2.5 py-1.5 rounded-md border text-xs leading-none lg:px-4 lg:py-2.5 lg:text-base lg:rounded-lg ${
                filter === "hidden" ? "bg-gray-600 text-white" : "bg-white"
              }`}
              onClick={() => setFilter("hidden")}
            >
              Hidden
            </button>

            {/* BULK BUTTON */}
            {products.length > 0 && (
              <button
                onClick={toggleAllProducts}
                className={`px-2.5 py-1.5 rounded-md border text-xs leading-none font-semibold text-white lg:px-4 lg:py-2.5 lg:text-base lg:rounded-lg ${
                  hasAnyActive
                    ? "bg-gray-700 hover:bg-gray-800"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {hasAnyActive ? "Hide All" : "Show All"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===================== NEW: PRODUCTS SUB-MENU ===================== */}
      <div className="flex flex-wrap gap-2 mb-5 border-b pb-3">
        {[
          { key: "all", label: "🗂️ All Product", color: "indigo" },
          {
            key: "freeDelivery",
            label: `🚚 ${getBadgeName("freeDelivery", "Free Delivery")}`,
            color: "orange",
          },
          {
            key: "bestDiscount",
            label: `🛍️ ${getBadgeName("bestDiscount", "Best Discount")}`,
            color: "blue",
          },
          {
            key: "cartvanBox",
            label: `🎁 ${getBadgeName("cartvanBox", "Gift Box")}`,
            color: "rose",
          },
        ].map((tab) => {
          const active = badgeFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setBadgeFilter(tab.key)}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold border transition-all ${
                active
                  ? "bg-indigo-600 text-white border-indigo-600 shadow"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              {tab.label}
              <span
                className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                  active ? "bg-white/20" : "bg-gray-100"
                }`}
              >
                {badgeCounts[tab.key] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* ===================== PRODUCT GRID ===================== */}
      {loading ? (
        <ProductsSkeleton />
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 2xl:grid-cols-6  gap-4">
          {filteredProducts.map((p) => (
            <ProductCard
              key={p._id}
              product={p}
              onEdit={() => {
                setEditProduct(p);
                setShowForm(true);
              }}
              onDelete={() => confirmDelete(p)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-10">
          No products found.
        </div>
      )}

      {/* ===================== FORM MODAL ===================== */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-40" />

          <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-4xl p-6 overflow-y-auto max-h-[90vh] relative animate-[zoomIn_.2s_ease-out]">
              <ProductForm
                product={editProduct}
                productsLength={products.length}
                onClose={() => {
                  setShowForm(false);
                  setEditProduct(null); // ✅ reset
                }}
                onSaved={() => {
                  setShowForm(false);
                  setEditProduct(null); // ✅ reset
                  loadProducts();
                  setToast({
                    message: editProduct?._id
                      ? "✅ Product updated!"
                      : "✅ Product added!",
                    type: "success",
                  });
                }}
              />
            </div>
          </div>
        </>
      )}

      {/* ===================== DELETE CONFIRM ===================== */}
      {deleteModal && (
        <>
          <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-40" />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl border animate-[zoomIn_.2s_ease-out]">
              <h2 className="text-xl font-bold text-red-600 mb-3">
                ⚠ Delete Product
              </h2>

              <p className="text-gray-700 mb-6">
                Are you sure you want to delete{" "}
                <span className="font-semibold">{deleteModal.name}</span>?
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteModal(null)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>

                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded shadow"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* TOAST */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <style jsx global>{`
        @keyframes zoomIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
