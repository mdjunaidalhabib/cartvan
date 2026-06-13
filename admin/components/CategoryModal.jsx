"use client";

import { useEffect } from "react";
import ImageUploader from "./ImageUploader";

/* ================== CATEGORY IMAGE RULE ================== */
const CATEGORY_IMAGE_RULE = {
  type: "image/webp",
  width: 300,
  height: 300,
  maxBytes: 100 * 1024,
  startQuality: 0.88,
  minQuality: 0.2,
  qualityStep: 0.05,
  strictLimit: true,
};

export default function CategoryModal({
  show,
  editId,
  categoriesLength = 0,

  name,
  setName,

  order,
  setOrder,

  isActive,
  setIsActive,

  file,
  setFile,

  preview,
  setPreview,

  loading,
  onClose,
  onSubmit,
  onToast,
}) {
  const maxSerial = editId ? categoriesLength : categoriesLength + 1;

  useEffect(() => {
    if (show && !editId) {
      setOrder(categoriesLength + 1);
      setIsActive(true);
    }
  }, [show, editId, categoriesLength, setOrder, setIsActive]);

  if (!show) return null;

  return (
    <>
      <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-40" />

      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold mb-4 text-center">
            {editId ? "✏️ Edit Category" : "➕ Add Category"}
          </h2>

          <form onSubmit={onSubmit} className="space-y-3">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Category Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Category name"
                className="border w-full p-2 rounded"
                required
              />
            </div>

            {/* Serial + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Serial No
                </label>
                <select
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                  className="border w-full p-2 rounded bg-white"
                >
                  {Array.from({ length: maxSerial }, (_, i) => i + 1).map(
                    (num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={isActive ? "active" : "hidden"}
                  onChange={(e) => setIsActive(e.target.value === "active")}
                  className="border w-full p-2 rounded bg-white"
                >
                  <option value="active">Active</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
            </div>

            {/* ✅ ImageUploader reuse */}
            <ImageUploader
              preview={preview}
              onFileReady={setFile}
              onPreviewChange={setPreview}
              onToast={onToast}
              rule={CATEGORY_IMAGE_RULE}
              shape="square"
              label="Category Image"
            />

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded"
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className={`px-4 py-2 rounded text-white ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
                disabled={loading}
              >
                {loading ? "Saving..." : editId ? "Update" : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
