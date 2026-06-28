"use client";

export default function BasicInfoCategory({
  form,
  setForm,
  categories = [],
  errors,
  setErrors,
}) {
  const handleChange = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: null }));
  };

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

        {/* ক্যাটাগরি সিলেক্ট */}
        <div>
          <label className="font-semibold text-gray-700 text-sm">
            ক্যাটাগরি <span className="text-red-500">*</span>
          </label>
          <select
            value={form.category}
            onChange={(e) => handleChange("category", e.target.value)}
            className={`${inputBase} ${
              errors.category ? errClass : ok
            } cursor-pointer`}
          >
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-xs text-red-600 mt-1 font-medium">
              {errors.category}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="font-semibold text-gray-700 text-sm">
          Description
        </label>
        <textarea
          rows={6}
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
          className={`${inputBase} ${ok} resize-y min-h-[140px] leading-relaxed`}
          placeholder="বিস্তারিত বিবরণ..."
        />
      </div>

      <div>
        <label className="font-semibold text-gray-700 text-sm">
          Additional Info
        </label>
        <textarea
          rows={12}
          value={form.additionalInfo}
          onChange={(e) => handleChange("additionalInfo", e.target.value)}
          className={`${inputBase} ${ok} resize-y min-h-[260px] leading-relaxed whitespace-pre-wrap`}
          placeholder="অতিরিক্ত তথ্য (বক্স কন্টেন্ট, ওয়ারেন্টি, রিটার্ন পলিসি ইত্যাদি)..."
        />
      </div>
    </section>
  );
}
