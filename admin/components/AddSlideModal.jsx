"use client";

import { useRef, useState, useEffect } from "react";

/* ================== ✅ SLIDER IMAGE RULE ================== */
const SLIDER_IMAGE_RULE = {
  type: "image/webp",
  width: 1500,
  height: 500,
  maxBytes: 100 * 1024, // ✅ 100KB 
};

export default function AddSlideModal({
  showModal,
  closeModal,
  onSubmit,
  loading,
  editId = null,
  initialData = null,
  slidesLength = 0,

  // ✅ image processor from parent
  processSliderImage,
}) {
  const dropRef = useRef(null);

  const [title, setTitle] = useState("");
  const [href, setHref] = useState("");
  const [order, setOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  // ✅ states
  const [imageError, setImageError] = useState("");
  const [filesReady, setFilesReady] = useState(true);

  // ✅ dropdown limit
  const maxSerial = editId ? slidesLength : slidesLength + 1;

  const maxKB = Math.floor(SLIDER_IMAGE_RULE.maxBytes / 1024);

  // ✅ Edit mode / initialData load
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setHref(initialData.href || "");
      setOrder(
        initialData.order && initialData.order <= slidesLength
          ? initialData.order
          : 1
      );
      setIsActive(initialData.isActive ?? true);
      setPreview(initialData.src || "");
      setFile(null);

      setImageError("");
      setFilesReady(true);
    }
  }, [initialData, slidesLength]);

  // ✅ New slide open হলে ফর্ম ক্লিয়ার হবে
  useEffect(() => {
    if (showModal && !initialData && !editId) {
      setTitle("");
      setHref("");
      setOrder(slidesLength + 1);
      setIsActive(true);
      setFile(null);
      setPreview("");

      setImageError("");
      setFilesReady(true);
    }
  }, [showModal, initialData, editId, slidesLength]);

  // ✅ preview object URL cleanup (memory leak fix)
  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // ✅ Reset image states on close
  useEffect(() => {
    if (!showModal) {
      setImageError("");
      setFilesReady(true);
    }
  }, [showModal]);

  if (!showModal) return null;

  const handleClose = () => {
    setTitle("");
    setHref("");
    setOrder(1);
    setIsActive(true);

    setFile(null);
    setPreview("");

    setImageError("");
    setFilesReady(true);

    closeModal?.();
  };

  /* ================== ✅ MAIN FILE PROCESSOR ================== */
  const processFile = async (incomingFile) => {
    if (!incomingFile) return;

    setFilesReady(false);
    setImageError("");

    try {
      if (!processSliderImage) {
        setImageError("Image processor missing!");
        setFilesReady(true);
        return;
      }

      // ✅ Convert to WEBP (Rule applied from parent processor)
      const resized = await processSliderImage(incomingFile);

      // ✅ format must be webp
      if (resized.type !== SLIDER_IMAGE_RULE.type) {
        setImageError(
          `Only WEBP allowed (${SLIDER_IMAGE_RULE.width}×${SLIDER_IMAGE_RULE.height}, max ${maxKB}KB)`
        );
        setFile(null);
        setPreview("");
        setFilesReady(true);
        return;
      }

      // ✅ size validate
      if (resized.size > SLIDER_IMAGE_RULE.maxBytes) {
        setImageError(
          `Max ${maxKB}KB allowed (Your file: ${Math.ceil(
            resized.size / 1024
          )}KB)`
        );
        setFile(null);
        setPreview("");
        setFilesReady(true);
        return;
      }

      setFile(resized);
      setPreview(URL.createObjectURL(resized));
      setFilesReady(true);
    } catch (err) {
      console.error(err);
      setImageError("Invalid image file");
      setFile(null);
      setPreview("");
      setFilesReady(true);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    processFile(dropped);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ block submit when processing / error
    if (!filesReady || imageError) return;

    const slideObj = {
      ...(initialData || {}),
      _id: editId || undefined,
      title,
      href,
      order,
      isActive,
      imageFile: file, // ✅ processed file
    };

    await onSubmit?.(slideObj);
  };

  return (
    <>
      <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-40" />

      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold mb-4 text-center">
            {editId ? "✏️ Edit Slide" : "➕ Add New Slide"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Slide Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Slide title"
                className="border w-full p-2 rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Slide Link (Href)
              </label>
              <input
                value={href}
                onChange={(e) => setHref(e.target.value)}
                placeholder="Href (optional)"
                className="border w-full p-2 rounded"
              />
            </div>

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

            {/* ✅ Image uploader */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Slide Image{" "}
                <span className="text-[11px] text-gray-500 font-semibold">
                  (যেকোনো image format → Auto {SLIDER_IMAGE_RULE.width}×
                  {SLIDER_IMAGE_RULE.height})
                </span>
              </label>

              <div
                ref={dropRef}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className={`border-2 border-dashed rounded-lg overflow-hidden cursor-pointer bg-gray-50 aspect-[3/1] flex items-center justify-center ${
                  imageError ? "border-red-500 bg-red-50" : "border-gray-300"
                }`}
                onClick={() =>
                  dropRef.current?.querySelector("input[type=file]")?.click()
                }
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-500 text-sm">
                    Drag & drop or click to upload
                  </span>
                )}

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = ""; // ✅ same file reselect
                    if (!f) return;
                    processFile(f);
                  }}
                />
              </div>

              {imageError && (
                <p className="text-[11px] text-red-600 mt-1 font-semibold">
                  {imageError}
                </p>
              )}

              {!filesReady && (
                <p className="text-[11px] text-orange-600 mt-1 font-semibold">
                  Processing image...
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border rounded"
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className={`px-4 py-2 rounded text-white ${
                  loading || !filesReady || !!imageError
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
                disabled={loading || !filesReady || !!imageError}
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
