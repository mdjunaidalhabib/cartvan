"use client";

export default function ProductCard({ product, onEdit, onDelete }) {
  const cat = product?.category;
  const isHidden = product?.isActive === false;

  // ✅ Total Variants Count (colors)
  const totalVariants = Array.isArray(product?.colors)
    ? product.colors.length
    : 0;

  // ✅ Total Sold
  const totalSold =
    totalVariants > 0
      ? product.colors.reduce((sum, v) => sum + Number(v?.sold || 0), 0)
      : Number(product?.sold || 0);

  // ✅ Total Stock
  const totalStock =
    product?.stock !== undefined && product?.stock !== null
      ? Number(product.stock || 0)
      : totalVariants > 0
      ? product.colors.reduce((sum, v) => sum + Number(v?.stock || 0), 0)
      : 0;

  const displayImage = product?.image || "";

  return (
    <div
      className={`relative border rounded-xl shadow-md p-4 flex flex-col transition
        ${isHidden ? "bg-gray-100 opacity-80" : "bg-white hover:shadow-lg"}
      `}
    >
      {/* 🖼️ Product Image */}
      <div className="w-full aspect-square overflow-hidden rounded-lg mb-3 relative bg-gray-50">
        {displayImage ? (
          <img
            src={displayImage}
            alt={product.name}
            className={`w-full h-full object-cover transition-opacity duration-300
              ${isHidden ? "brightness-90" : ""}
            `}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            No Image
          </div>
        )}

        {/* ✅ Hidden Overlay */}
        {isHidden && (
          <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
            <span className="text-white text-sm font-semibold tracking-wide">
              Hidden Product
            </span>
          </div>
        )}

        {/* 🎨 Variant Color Dot Preview */}
        {totalVariants > 0 && (
          <div className="absolute bottom-2 left-2 flex gap-1 bg-white/70 p-1 rounded-full backdrop-blur-sm">
            {product.colors.slice(0, 4).map((c, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full border border-gray-300"
                style={{ backgroundColor: c.name?.toLowerCase() }}
                title={c.name}
              />
            ))}
            {totalVariants > 4 && (
              <span className="text-[8px] font-bold text-gray-600">+</span>
            )}
          </div>
        )}
      </div>

      {/* 📋 Product Info */}
      <h2 className="font-semibold text-lg truncate text-gray-800">
        {product.name}
      </h2>

      {/* ✅ Price */}
      <p className="text-gray-700 font-medium">
        ৳ {product.price}{" "}
        {product.oldPrice ? (
          <span className="line-through text-sm text-gray-500 ">
            ৳ {product.oldPrice}
          </span>
        ) : null}
      </p>

      {/* ✅ Stock + Total Sold */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 ">স্টক: {totalStock}</p>

        <span className="text-[10px] sm:text-xs text-gray-500">
          Total Sold: {totalSold}
        </span>
      </div>

      {/* ✅ ✅ Variant wise Sold List (NEW) */}
      {totalVariants > 0 && (
        <div className="mt-1 bg-gray-50 border rounded-lg p-2">
          <p className="text-[11px] font-semibold text-gray-700 mb-1">
            Variant Sold:
          </p>

          <div className="flex flex-wrap gap-2">
            {product.colors.map((v, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-1 rounded-full border bg-white text-gray-700"
                title={`${v.name} sold`}
              >
                {v.name}: <b>{Number(v?.sold || 0)}</b>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ✅ Status Tags */}
      <div className="mt-2 flex items-center gap-2 text-[11px] flex-wrap">
        <span className="px-2 py-0.5 rounded bg-gray-100 border text-gray-700">
          Serial: {product.order || 0}
        </span>

        {totalVariants > 0 && (
          <span className="px-2 py-0.5 rounded bg-purple-100 border border-purple-200 text-purple-700 font-medium">
            {totalVariants} Variants
          </span>
        )}

        {product.isActive ? (
          <span className="px-2 py-0.5 rounded bg-green-100 border text-green-700 font-semibold">
            Active
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded bg-gray-200 border text-gray-700 font-semibold">
            Hidden
          </span>
        )}
      </div>

      {/* ✅ Category */}
      {cat ? (
        <div className="mt-1 space-y-1">
          <p className="text-xs text-gray-500">
            ক্যাটাগরি:{" "}
            <span className="font-medium text-gray-800">{cat.name}</span>
          </p>
        </div>
      ) : (
        <p className="text-xs text-gray-400 mt-2">ক্যাটাগরি নেই</p>
      )}

      {/* ⭐ Rating */}
      <div className="flex items-center gap-1">
        <span className="text-yellow-500">⭐</span>
        <span className="text-sm font-medium text-gray-700">
          {product.rating || 0}
        </span>
      </div>

      {/* 🎯 Buttons */}
      <div className="mt-auto pt- flex gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition"
        >
          ✏ সম্পাদনা
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition"
        >
          🗑 মুছুন
        </button>
      </div>
    </div>
  );
}
