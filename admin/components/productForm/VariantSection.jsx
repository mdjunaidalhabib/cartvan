"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  FaPlus,
  FaTrash,
  FaImages,
  FaTimes,
  FaGripVertical,
} from "react-icons/fa";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { convertToWebpUnderLimit } from "../../utils/imageConvert";

/* ---------------- RULES ---------------- */
const IMAGE_RULE = {
  type: "image/webp",
  maxBytes: 100 * 1024, // ✅ backend এর PRODUCT_IMAGE_RULE.maxBytes (100KB) এর সাথে মিলিয়ে আপডেট করা হলো
  width: 1200,
  height: 1200,
  startQuality: 0.92,
  minQuality: 0.55,
  qualityStep: 0.05,
};

// ✅ প্রতিটি variant (বা default/base) এ সর্বোচ্চ কতটি image রাখা যাবে
// ⚠️ এই সংখ্যা backend/controllers/product/product.controller.js এর
// MAX_VARIANT_IMAGES এর সাথে মিলিয়ে রাখতে হবে, নাহলে frontend এ pass হলেও
// backend আপলোড কেটে দেবে।
const MAX_VARIANT_IMAGES = 8;

/* ---------------- Helpers ---------------- */
const safeUrlId = (url) => {
  try {
    return btoa(url).replace(/=/g, "");
  } catch {
    return encodeURIComponent(url);
  }
};

const createFileId = (f) => `file_${f.name}_${f.size}_${f.lastModified}`;
const createUrlId = (u) => `url_${safeUrlId(u)}`;

const normalizeOne = (f) => {
  if (!f) return null;
  if (f && typeof f === "object" && "id" in f && "src" in f) {
    return { id: String(f.id), src: f.src };
  }
  if (typeof f === "string") {
    return { id: createUrlId(f), src: f };
  }
  if (f instanceof File) {
    return { id: createFileId(f), src: f };
  }
  return null;
};

const normalizeList = (files) => {
  const used = new Set();
  return (files || [])
    .map(normalizeOne)
    .filter(Boolean)
    .map((it, idx) => {
      let id = it.id;
      if (used.has(id)) id = `${id}_${idx}`;
      used.add(id);
      return { ...it, id };
    });
};

/* ---------------- Sortable Image Item ---------------- */
function SortableImage({ item, vIdx, removeFile }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    const src = item?.src;
    if (typeof src === "string") {
      setImageUrl(src);
      return;
    }
    if (src instanceof File) {
      const url = URL.createObjectURL(src);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setImageUrl("");
  }, [item?.src]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative w-24 h-24 rounded-xl overflow-hidden border group shadow-sm bg-white"
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          className="w-full h-full object-cover"
          alt="preview"
        />
      ) : (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
          No Preview
        </div>
      )}

      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 bg-black/50 text-white p-1 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <FaGripVertical size={10} />
      </div>

      <button
        type="button"
        onClick={() => removeFile(vIdx, item.id)}
        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none z-10"
      >
        <FaTimes size={10} />
      </button>
    </div>
  );
}

/* ---------------- Main Component ---------------- */
export default function VariantSection({
  variants,
  setVariants,
  mode,
  errors,
  setErrors,
  onFilesReadyChange,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const baseInput =
    "mt-1 w-full border p-2.5 rounded-lg focus:outline-none transition-all text-sm";
  const okClass = "border-gray-300 focus:ring-2 focus:ring-indigo-100";
  const disabledStyle =
    "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200";
  const errClass = "border-red-500 bg-red-50 focus:ring-red-100";

  // ✅ FIX: আগে এই normalize effect মাত্র একবার (component mount এ) চলত।
  // কিন্তু ProductForm যখন কোনো existing product edit করার জন্য খোলে, তখন
  // product এর real data (ছবির URL string গুলো) আসে একটু পরে — একটা আলাদা
  // useEffect দিয়ে, mount হওয়ার পরে। তাই প্রথমবার এই effect চলার সময়
  // variants ছিল খালি (placeholder), normalize করার কিছু ছিল না, এবং
  // normalizedOnceRef সাথে সাথে true হয়ে যেত। পরে আসল image URL গুলো
  // (string) আসলেও আর কখনো normalize হতো না — ফলে প্রতিটি item হয়ে যেত
  // raw string, যার `.id`/.src` কিছুই নেই → preview "No Preview" দেখাত,
  // এবং একটা ছবি delete করতে গেলে সব ছবির id === undefined হওয়ায়
  // filter এ সবগুলোই বাদ পড়ে যেত (সব ছবি একসাথে ডিলিট হয়ে যেত)।
  //
  // ফিক্স: "once" গার্ড সরিয়ে দিয়ে variants পরিবর্তন হলেই আবার চেক করা হচ্ছে।
  // normalizeOne ইতিমধ্যে normalize করা item কে অপরিবর্তিত রাখে (idempotent),
  // তাই এটা infinite loop তৈরি করবে না — প্রয়োজন হলেই একবার ঠিক হয়ে যাবে।
  useEffect(() => {
    const needsNormalize = (variants || []).some((v) =>
      (v.files || []).some((f) => typeof f === "string" || f instanceof File),
    );

    if (!needsNormalize) return;

    const next = (variants || []).map((v) => ({
      ...v,
      files: normalizeList(v.files),
    }));

    setVariants(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variants]);

  const update = (i, field, value) => {
    const next = [...variants];
    next[i] = { ...next[i], [field]: value };
    setVariants(next);

    let errKey;
    if (next[i].isBase) {
      if (field === "name") errKey = "baseName";
      if (field === "price") errKey = "basePrice";
    } else {
      const cap = field.charAt(0).toUpperCase() + field.slice(1);
      errKey = `variant${cap}_${i}`;
    }

    if (errKey && value?.toString().trim() !== "") {
      setErrors((prev) => {
        const n = { ...prev };
        delete n[errKey];
        return n;
      });
    }
  };

  // ✅ NOTE: আগে এখানে convert হওয়া ফাইলের size আবার চেক করে error দেখানো হতো।
  // এখন convertToWebpUnderLimit() নিজেই guarantee করে যে ফাইল maxBytes এর
  // মধ্যে থাকবে (দরকার হলে dimension কমিয়ে), তাই এই ডুপ্লিকেট ব্লকিং চেক
  // সরিয়ে দেওয়া হলো — যাতে কোনো অবস্থাতেই upload error না দেখায়।

  const handleFileChange = async (i, files) => {
    const raw = Array.from(files || []);
    if (raw.length === 0) return;

    onFilesReadyChange?.(false);

    const next = [...variants];
    const current = Array.isArray(next[i].files) ? next[i].files : [];
    const key = next[i].isBase ? "baseImages" : `variantImages_${i}`;

    // ✅ প্রতি variant এ সর্বোচ্চ MAX_VARIANT_IMAGES টা image রাখার limit
    const remainingSlots = MAX_VARIANT_IMAGES - current.length;
    if (remainingSlots <= 0) {
      setErrors((prev) => ({
        ...prev,
        [key]: `❌ সর্বোচ্চ ${MAX_VARIANT_IMAGES}টি image রাখা যাবে। আগে কিছু image মুছে তারপর নতুন যোগ করুন।`,
      }));
      onFilesReadyChange?.(true);
      return;
    }

    const acceptedRaw = raw.slice(0, remainingSlots);
    const rejectedCount = raw.length - acceptedRaw.length;

    try {
      setErrors((prev) => {
        const n = { ...prev };
        delete n[key];
        delete n[`${key}_processing`];
        if (rejectedCount > 0) {
          n[key] = `⚠️ সর্বোচ্চ ${MAX_VARIANT_IMAGES}টি image এর limit থাকায় শেষের ${rejectedCount}টি image বাদ দেওয়া হয়েছে।`;
        }
        return n;
      });

      const converted = [];

      for (const f of acceptedRaw) {
        setErrors((prev) => ({
          ...prev,
          [`${key}_processing`]: `⏳ "${f.name}" processing...`,
        }));

        try {
          const convertedFile = await convertToWebpUnderLimit(f, IMAGE_RULE);
          converted.push(convertedFile);
        } catch (err) {
          setErrors((prev) => ({
            ...prev,
            [key]: `❌ "${f.name}" — ${err?.message || "Image process করতে সমস্যা হয়েছে।"}`,
          }));
          onFilesReadyChange?.(true);
          return;
        }
      }

      setErrors((prev) => {
        const n = { ...prev };
        delete n[`${key}_processing`];
        return n;
      });

      const added = normalizeList(converted);
      const merged = [...current, ...added];

      next[i].files = merged;
      setVariants(next);
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [key]: `❌ ${err?.message || "Image process করতে সমস্যা হয়েছে।"}`,
      }));
    } finally {
      setErrors((prev) => {
        const n = { ...prev };
        delete n[`${key}_processing`];
        return n;
      });
      onFilesReadyChange?.(true);
    }
  };

  const removeFile = (vIdx, fileId) => {
    const next = [...variants];
    const list = Array.isArray(next[vIdx].files) ? next[vIdx].files : [];
    next[vIdx].files = list.filter((it) => it.id !== fileId);
    setVariants(next);
  };

  const handleDragEnd = (event, vIdx) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    const next = [...variants];
    const files = Array.isArray(next[vIdx].files) ? next[vIdx].files : [];

    const oldIndex = files.findIndex((x) => x.id === active.id);
    const newIndex = files.findIndex((x) => x.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    next[vIdx].files = arrayMove(files, oldIndex, newIndex);
    setVariants(next);
  };

  const visibleVariants = useMemo(() => {
    return mode === "default"
      ? (variants || [])
          .map((v, idx) => ({ v, idx }))
          .filter(({ v }) => v.isBase)
      : (variants || [])
          .map((v, idx) => ({ v, idx }))
          .filter(({ v }) => !v.isBase);
  }, [variants, mode]);

  return (
    <div className="space-y-6">
      {visibleVariants.map(({ v, idx: i }) => {
        const nameErr = v.isBase ? errors.baseName : errors[`variantName_${i}`];
        const priceErr = v.isBase
          ? errors.basePrice
          : errors[`variantPrice_${i}`];
        const imgErr = v.isBase
          ? errors.baseImages
          : errors[`variantImages_${i}`];
        const imgProcessing = v.isBase
          ? errors["baseImages_processing"]
          : errors[`variantImages_${i}_processing`];

        const fileItems = Array.isArray(v.files) ? v.files : [];

        return (
          <div
            key={i}
            className={`border rounded-2xl p-5 shadow-sm transition-all ${
              v.isBase
                ? "bg-indigo-50/20 border-indigo-100"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">
                {v.isBase
                  ? "Default Settings (Main Product)"
                  : `Variant #${i + 1}`}
              </h3>

              {!v.isBase && (
                <button
                  type="button"
                  onClick={() =>
                    setVariants(variants.filter((_, idx) => idx !== i))
                  }
                  className="text-red-500 hover:bg-red-50 p-2 rounded-full transition"
                >
                  <FaTrash size={14} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                  Variant Name {v.isBase ? "" : "*"}
                </label>
                <input
                  value={
                    v.name === "Default Variant" && v.isBase
                      ? "Default Variant"
                      : v.name || ""
                  }
                  disabled={v.isBase}
                  onChange={(e) => update(i, "name", e.target.value)}
                  className={`${baseInput} ${
                    v.isBase ? disabledStyle : nameErr ? errClass : okClass
                  }`}
                  placeholder={v.isBase ? "" : "e.g. Red / XL"}
                />
                {nameErr && (
                  <p className="text-[10px] text-red-500 mt-1 font-semibold">
                    {nameErr}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                  Price *
                </label>
                <input
                  type="number"
                  value={v.price ?? ""}
                  onChange={(e) => update(i, "price", e.target.value)}
                  className={`${baseInput} ${priceErr ? errClass : okClass}`}
                  placeholder="0.00"
                />
                {priceErr && (
                  <p className="text-[10px] text-red-500 mt-1 font-semibold">
                    {priceErr}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                  Old Price
                </label>
                <input
                  type="number"
                  value={v.oldPrice ?? ""}
                  onChange={(e) => update(i, "oldPrice", e.target.value)}
                  className={`${baseInput} ${okClass}`}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                  Stock
                </label>
                <input
                  type="number"
                  value={v.stock ?? 0}
                  onChange={(e) => update(i, "stock", e.target.value)}
                  className={`${baseInput} ${okClass}`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                  Sold
                </label>
                <input
                  type="number"
                  value={v.sold ?? 0}
                  onChange={(e) => update(i, "sold", e.target.value)}
                  className={`${baseInput} ${okClass}`}
                />
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="mt-5">
              <label
                className={`text-xs font-bold uppercase tracking-wide block mb-2 ${
                  imgErr ? "text-red-500" : "text-gray-600"
                }`}
              >
                Variant Images (Required) *
                <span className="ml-2 text-[10px] font-semibold text-gray-500 normal-case">
                  (যেকোনো image format → Auto {IMAGE_RULE.width}×
                  {IMAGE_RULE.height})
                </span>
                <span
                  className={`ml-2 text-[10px] font-bold normal-case ${
                    fileItems.length >= MAX_VARIANT_IMAGES
                      ? "text-red-500"
                      : "text-gray-500"
                  }`}
                >
                  ({fileItems.length}/{MAX_VARIANT_IMAGES})
                </span>
              </label>

              <div className="flex flex-wrap gap-3">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => handleDragEnd(e, i)}
                >
                  <SortableContext
                    items={fileItems.map((it) => it.id)}
                    strategy={horizontalListSortingStrategy}
                  >
                    {fileItems.map((item) => (
                      <SortableImage
                        key={item.id}
                        item={item}
                        vIdx={i}
                        removeFile={removeFile}
                      />
                    ))}
                  </SortableContext>
                </DndContext>

                {fileItems.length < MAX_VARIANT_IMAGES && (
                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById(`file-${i}`)?.click()
                    }
                    className={`w-24 h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${
                      imgErr
                        ? "border-red-500 bg-red-50 text-red-500 shadow-inner"
                        : imgProcessing
                          ? "border-orange-300 bg-orange-50 text-orange-400"
                          : "border-gray-300 text-gray-400 hover:border-indigo-300 hover:text-indigo-400"
                    }`}
                  >
                    {imgProcessing ? (
                      <>
                        <span className="text-lg animate-spin">⏳</span>
                        <span className="text-[10px] mt-1 font-bold">
                          Processing
                        </span>
                      </>
                    ) : (
                      <>
                        <FaImages size={20} />
                        <span className="text-[10px] mt-1 font-bold">
                          Upload
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <input
                id={`file-${i}`}
                type="file"
                multiple
                hidden
                accept="image/*,.heic,.heif"
                onChange={(e) => {
                  handleFileChange(i, e.target.files);
                  e.target.value = "";
                }}
              />

              {imgProcessing && (
                <p className="text-[10px] text-orange-500 mt-1 font-bold">
                  {imgProcessing}
                </p>
              )}

              {imgErr && (
                <p className="text-[10px] text-red-500 mt-1 font-bold italic">
                  {imgErr}
                </p>
              )}
            </div>
          </div>
        );
      })}

      {mode === "variant" && (
        <button
          type="button"
          onClick={() =>
            setVariants([
              ...variants,
              {
                name: "",
                price: "",
                oldPrice: "",
                stock: 0,
                sold: 0,
                files: [],
                isBase: false,
              },
            ])
          }
          className="bg-purple-100 text-purple-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-600 hover:text-white transition-all shadow-sm text-sm"
        >
          <FaPlus size={12} /> Add Another Variant
        </button>
      )}
    </div>
  );
}
