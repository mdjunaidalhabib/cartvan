"use client";

import { useEffect, useState, useMemo } from "react";
import Toast from "../components/Toast";
import CategoriesSkeleton from "../components/Skeleton/CategoriesSkeleton";
import CategoryModal from "./CategoryModal";


export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);

  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  const [order, setOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);

  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ================== LOAD ==================
  const loadCategories = async () => {
    try {
      setPageLoading(true);
      const res = await fetch(`/api/admin/categories`);
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      arr.sort((a, b) => (a.order || 0) - (b.order || 0));
      setCategories(arr);
    } catch {
      setToast({ message: "⚠ Failed to load categories", type: "error" });
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories =
    filter === "active"
      ? categories.filter((c) => c.isActive)
      : filter === "hidden"
        ? categories.filter((c) => !c.isActive)
        : categories;

  const hasAnyActive = useMemo(
    () => categories.some((c) => c.isActive),
    [categories],
  );

  // ================== CLOSE MODAL ==================
  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setName("");
    setFile(null);
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview("");
    setOrder(1);
    setIsActive(true);
    setLoading(false);
  };

  // ================== SUBMIT ==================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append("name", name);
    data.append("order", order);
    data.append("isActive", isActive);
    if (file) data.append("image", file);

    let url = `/api/admin/categories`;
    let method = "POST";

    if (editId) {
      url += `/${editId}`;
      method = "PUT";
    }

    const res = await fetch(url, { method, body: data });

    if (res.ok) {
      setToast({
        message: editId ? "✅ Category updated!" : "✅ Category added!",
        type: "success",
      });
      closeModal();
      loadCategories();
    } else {
      const errData = await res.json().catch(() => ({}));
      setToast({
        message: errData?.error || "❌ Error saving category",
        type: "error",
      });
    }

    setLoading(false);
  };

  // ================== EDIT ==================
  const handleEdit = (c) => {
    setEditId(c._id);
    setName(c.name);
    setOrder(c.order || 1);
    setIsActive(c.isActive ?? true);
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(c.image || "");
    setFile(null);
    setShowModal(true);
  };

  // ================== DELETE ==================
  const confirmDelete = (c) => setDeleteModal(c);

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);

    const res = await fetch(`/api/admin/categories/${deleteModal._id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setToast({ message: "🗑 Category deleted!", type: "success" });
      setDeleteModal(null);
      loadCategories();
    } else {
      const errData = await res.json().catch(() => ({}));
      setToast({
        message: errData?.error || "❌ Error deleting category",
        type: "error",
      });
    }
    setDeleting(false);
  };

  // ================== BULK TOGGLE ==================
  const toggleAllCategories = async () => {
    try {
      setPageLoading(true);
      const newStatus = !hasAnyActive;

      await Promise.all(
        categories.map((c) =>
          fetch(`/api/admin/categories/${c._id}`, {
            method: "PUT",
            body: (() => {
              const d = new FormData();
              d.append("isActive", newStatus);
              d.append("order", c.order);
              return d;
            })(),
          }),
        ),
      );

      setToast({
        message: newStatus
          ? "✅ All categories activated!"
          : "👁 All categories hidden!",
        type: "success",
      });

      loadCategories();
    } catch (err) {
      console.error(err);
      setToast({ message: "❌ Bulk update failed", type: "error" });
      setPageLoading(false);
    }
  };

  return (
    <div className="">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">✨ Categories</h1>

        <div className="flex flex-col items-end gap-2 lg:flex-row lg:items-center lg:gap-2 lg:ml-auto">
          <button
            onClick={() => {
              setEditId(null);
              setName("");
              setFile(null);
              if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
              setPreview("");
              setOrder(categories.length + 1);
              setIsActive(true);
              setShowModal(true);
            }}
            className="order-1 lg:order-last bg-indigo-600 text-white shadow font-semibold px-3 py-1.5 rounded-md text-sm hover:bg-indigo-700 active:scale-[0.98] lg:px-4 lg:py-2 lg:rounded-lg"
          >
            + Add Category
          </button>

          <div className="order-2 lg:order-first flex flex-wrap justify-end gap-1.5 lg:gap-2">
            {["all", "active", "hidden"].map((f) => (
              <button
                key={f}
                className={`px-2.5 py-1.5 rounded-md border text-xs lg:px-4 lg:py-2 lg:text-base lg:rounded-lg capitalize ${
                  filter === f
                    ? f === "all"
                      ? "bg-indigo-600 text-white"
                      : f === "active"
                        ? "bg-green-600 text-white"
                        : "bg-gray-600 text-white"
                    : "bg-white"
                }`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}

            {categories.length > 0 && (
              <button
                onClick={toggleAllCategories}
                className={`px-2.5 py-1 rounded-md border text-xs font-semibold text-white lg:px-4 lg:py-2 lg:text-base lg:rounded-lg ${
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

      {/* GRID */}
      {pageLoading ? (
        <CategoriesSkeleton />
      ) : filteredCategories.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          No categories found.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {filteredCategories.map((c) => (
            <div
              key={c._id}
              className={`border p-4 rounded-xl flex flex-col items-center shadow-sm ${
                c.isActive
                  ? "bg-white"
                  : "bg-gray-200 border-gray-400 opacity-80"
              }`}
            >
              {c.image && (
                <img
                  className="h-24 w-24 rounded-full object-cover mb-2"
                  src={c.image}
                  alt={c.name}
                />
              )}
              <h2
                className={`font-semibold ${!c.isActive ? "text-gray-600" : ""}`}
              >
                {c.name}
              </h2>
              <div className="text-sm text-gray-700 mt-1">
                Serial: <b>{c.order}</b>
              </div>
              <div className="text-sm mt-1">
                Status:{" "}
                {c.isActive ? (
                  <span className="text-green-600 font-semibold">Active</span>
                ) : (
                  <span className="text-gray-600 font-semibold">Hidden</span>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleEdit(c)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => confirmDelete(c)}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CategoryModal
        show={showModal}
        editId={editId}
        categoriesLength={categories.length}
        name={name}
        setName={setName}
        order={order}
        setOrder={setOrder}
        isActive={isActive}
        setIsActive={setIsActive}
        file={file}
        setFile={setFile}
        preview={preview}
        setPreview={setPreview}
        loading={loading}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onToast={setToast}
      />

      {/* DELETE MODAL */}
      {deleteModal && (
        <>
          <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-40" />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl shadow-xl border w-full max-w-sm">
              <h2 className="text-xl font-bold text-red-600 mb-3">
                ⚠ Delete Category
              </h2>
              <p className="mb-6">
                Delete <b>{deleteModal.name}</b>?
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
                  className="px-4 py-2 bg-red-600 text-white rounded"
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
    </div>
  );
}
