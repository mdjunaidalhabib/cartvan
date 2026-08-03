"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ImageOff } from "lucide-react";
import RichTextEditor from "../RichTextEditor";

export default function BasicInfoCategory({
  form,
  setForm,
  categories = [],
  errors,
  setErrors,
}) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  const handleChange = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: null }));
  };

  const selectedIds = Array.isArray(form.categories) ? form.categories : [];
  const selectedCategories = categories.filter((c) =>
    selectedIds.includes(c._id),
  );

  const toggleCategory = (id) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((v) => v !== id)
      : [...selectedIds, id];
    handleChange("categories", next);
  };

  // ✅ বাইরে ক্লিক করলে dropdown বন্ধ হবে
  useEffect(() => {
    const onOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const inputBase =
    "mt-1 w-full px-4 py-2.5 rounded-xl border focus:outline-none transition-all";
  const ok =
    "border-gray-300 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400";
  const errClass = "border-red-500 bg-red-50 focus:ring-red-100";

  return (
    <section className="bg-white rounded-2xl border p-5 space-y-5 shadow-sm">
      <div className="grid sm:grid-cols-2 gap-5">
        {/* প্রোডাক্ট নাম */}
        <div>
          <label className="font-semibold text-gray-700 text-sm">
            নাম <span className="text-red-500">*</span>
          </label>
          <input
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className={`${inputBase} ${errors.name ? errClass : ok}`}
            placeholder="প্রোডাক্ট নাম"
          />
          {errors.name && (
            <p className="text-xs text-red-600 mt-1 font-medium">
              {errors.name}
            </p>
          )}
        </div>

        {/* ✅ ক্যাটাগরি মাল্টি-সিলেক্ট — কাস্টম ড্রপডাউন, checkbox + ছবি সহ */}
        <div ref={boxRef} className="relative">
          <label className="font-semibold text-gray-700 text-sm">
            ক্যাটাগরি <span className="text-red-500">*</span>
          </label>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className={`${inputBase} ${
              errors.categories ? errClass : ok
            } flex items-center justify-between gap-2 cursor-pointer bg-white text-left`}
          >
            <span className="flex flex-wrap items-center gap-1.5 min-w-0 py-0.5">
              {selectedCategories.length > 0 ? (
                selectedCategories.map((c) => (
                  <span
                    key={c._id}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-50 pl-1 pr-2 py-0.5 text-xs font-medium text-indigo-700"
                  >
                    <span className="relative h-5 w-5 rounded overflow-hidden border bg-gray-50 shrink-0">
                      {c.image ? (
                        <img
                          src={c.image}
                          alt={c.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-gray-300">
                          <ImageOff size={10} />
                        </span>
                      )}
                    </span>
                    <span className="truncate max-w-[8rem]">{c.name}</span>
                  </span>
                ))
              ) : (
                <span className="text-gray-400">Select Categories</span>
              )}
            </span>
            <ChevronDown
              size={18}
              className={`text-gray-400 shrink-0 transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>

          {errors.categories && (
            <p className="text-xs text-red-600 mt-1 font-medium">
              {errors.categories}
            </p>
          )}

          {/* ✅ Dropdown list — checkbox + প্রতিটা ক্যাটাগরির থাম্বনেইল সহ */}
          {open && (
            <div className="absolute z-30 mt-1 w-full max-h-64 overflow-y-auto rounded-xl border bg-white shadow-lg py-1">
              {categories.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-400">
                  কোনো ক্যাটাগরি পাওয়া যায়নি
                </div>
              )}

              {categories.map((c) => {
                const isSelected = selectedIds.includes(c._id);
                return (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => toggleCategory(c._id)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                      isSelected
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="accent-indigo-600 shrink-0"
                    />
                    <span className="relative h-8 w-8 rounded-lg overflow-hidden border bg-gray-50 shrink-0">
                      {c.image ? (
                        <img
                          src={c.image}
                          alt={c.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-gray-300">
                          <ImageOff size={14} />
                        </span>
                      )}
                    </span>
                    <span className="truncate">{c.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="font-semibold text-gray-700 text-sm">
          Description
        </label>
        <div className="mt-1">
          <RichTextEditor
            value={form.description}
            onChange={(html) => handleChange("description", html)}
            placeholder="বিস্তারিত বিবরণ..."
            minHeight={140}
          />
        </div>
      </div>

      <div>
        <label className="font-semibold text-gray-700 text-sm">
          Additional Info{" "}
          <span className="font-normal text-gray-400">
            (ওয়ারেন্টি, রিটার্ন পলিসি ইত্যাদি)
          </span>
        </label>
        <div className="mt-1">
          <RichTextEditor
            value={form.additionalInfo}
            onChange={(html) => handleChange("additionalInfo", html)}
            placeholder="অতিরিক্ত তথ্য (বক্স কন্টেন্ট, ওয়ারেন্টি, রিটার্ন পলিসি ইত্যাদি)..."
            minHeight={260}
          />
        </div>
      </div>
    </section>
  );
}
