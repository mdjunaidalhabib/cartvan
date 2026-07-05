"use client";

import { useRef, useState } from "react";
import { convertToWebpUnderLimit } from "../utils/imageConvert";

export const DEFAULT_IMAGE_RULE = {
  type: "image/webp",
  width: 1200,
  height: 1200,
  maxBytes: 220 * 1024,
  minQuality: 0.55,
  qualityStep: 0.05,
  strictLimit: true,
};

export default function ImageUploader({
  preview,
  onFileReady, // (file) => void
  onPreviewChange, // (url) => void
  onToast, // ({ message, type }) => void  — optional
  rule = DEFAULT_IMAGE_RULE,
  shape = "square", // "circle" | "square"
  label = "Image",
  hint,
}) {
  const dropRef = useRef(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const maxKB = Math.floor(rule.maxBytes / 1024);

  const processFile = async (file) => {
    if (!file) return;

    setProcessing(true);
    setError("");
    onToast?.({ message: "⏳ Image processing...", type: "info" });

    try {
      const converted = await convertToWebpUnderLimit(file, rule);

      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
      const blobUrl = URL.createObjectURL(converted);

      onPreviewChange?.(blobUrl);
      onFileReady?.(converted);

      const kb = Math.ceil(converted.size / 1024);
      onToast?.({
        message: `✅ Convert সফল! ${rule.width}×${rule.height} WEBP — ${kb}KB / সর্বোচ্চ ${maxKB}KB`,
        type: "success",
      });
    } catch (err) {
      const msg = err?.message || "Image process করতে সমস্যা হয়েছে।";
      setError(msg);
      onToast?.({ message: `❌ ${msg}`, type: "error" });

      onFileReady?.(null);
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
      onPreviewChange?.("");
    } finally {
      setProcessing(false);
    }
  };

  const handleInputChange = (e) => {
    const f = e.target.files?.[0];
    e.target.value = ""; // ✅ same file আবার select করা যাবে
    if (f) processFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  };

  const previewClass =
    shape === "circle"
      ? "w-full h-full object-cover rounded-full"
      : "w-full h-full object-contain";

  return (
    <div className="flex flex-col gap-1">
      {/* Label */}
      <label className="block text-sm font-medium">
        {label}
        <span className="text-[11px] text-gray-500 font-semibold ml-2">
          (যেকোনো image format → Auto {rule.width}×{rule.height})
        </span>
      </label>

      {/* Drop Zone */}
      <div
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() =>
          dropRef.current?.querySelector("input[type=file]")?.click()
        }
        className={`
          border-2 border-dashed h-32 rounded-lg overflow-hidden
          flex items-center justify-center cursor-pointer bg-gray-50
          ${error ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-indigo-400"}
          ${processing ? "opacity-60 cursor-not-allowed" : ""}
        `}
      >
        {preview ? (
          <img src={preview} alt="preview" className={previewClass} />
        ) : (
          <span className="text-gray-400 text-sm text-center px-4">
            {processing
              ? "⏳ Processing..."
              : "Drag & drop বা click করে upload করো"}
          </span>
        )}

        <input
          type="file"
          accept="image/*,.heic,.heif"
          className="hidden"
          disabled={processing}
          onChange={handleInputChange}
        />
      </div>

      {/* Processing */}
      {processing && (
        <p className="text-[11px] text-orange-600 font-semibold">
          ⏳ Image processing... অপেক্ষা করো।
        </p>
      )}

      {/* Error */}
      {error && (
        <p className="text-[11px] text-red-600 font-semibold">❌ {error}</p>
      )}

      {/* Hint */}
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}
