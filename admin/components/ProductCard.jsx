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
  const hasDiscount = !!product?.oldPrice;

  return (
    <div
      className={`group relative flex flex-col rounded-xl border overflow-hidden transition-all duration-200
        ${
          isHidden
            ? "bg-gray-50 border-gray-200 opacity-75"
            : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-md"
        }
      `}
    >
      {/* 🖼️ Image */}
      <div className="relative w-full aspect-square bg-gray-50">
        {displayImage ? (
          <img
            src={displayImage}
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-300
              ${isHidden ? "grayscale-[30%]" : "group-hover:scale-[1.03]"}
            `}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-medium">
            No Image
          </div>
        )}

        {/* Top-left: serial */}
        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/55 backdrop-blur-sm text-white text-[9px] font-medium">
          #{product.order || 0}
        </span>

        {/* Top-right: active / hidden status */}
        <span
          className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md backdrop-blur-sm text-[9px] font-semibold tracking-wide ${
            product.isActive
              ? "bg-green-600/85 text-white"
              : "bg-gray-900/80 text-white"
          }`}
        >
          {product.isActive ? "Active" : "Hidden"}
        </span>

        {/* Bottom-left: color variant dots */}
        {totalVariants > 0 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-white/85 backdrop-blur-sm px-1.5 py-1 rounded-full shadow-sm">
            {product.colors.slice(0, 4).map((c, i) => (
              <span
                key={i}
                className="w-2.5 h-2.5 rounded-full border border-white ring-1 ring-gray-300"
                style={{ backgroundColor: c.name?.toLowerCase() }}
                title={c.name}
              />
            ))}
            {totalVariants > 4 && (
              <span className="text-[9px] font-bold text-gray-600 pr-0.5">
                +{totalVariants - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 📋 Content */}
      <div className="flex flex-col gap-1 p-2 flex-1">
        {/* Name + Price — same line */}
        <div className="flex items-start justify-between gap-1.5">
          <h2
            className="font-semibold text-[13px] leading-snug text-gray-900 truncate"
            title={product.name}
          >
            {product.name}
          </h2>
          <div className="flex items-baseline gap-1 shrink-0">
            <span className="text-sm font-bold text-gray-900">
              ৳{product.price}
            </span>
            {hasDiscount && (
              <span className="text-[10px] line-through text-gray-400">
                ৳{product.oldPrice}
              </span>
            )}
          </div>
        </div>

        {/* Stock + Total Sold */}
        <div className="flex items-center justify-between text-[10px] text-gray-500">
          <span>স্টক: {totalStock}</span>
          <span>Total Sold: {totalSold}</span>
        </div>

        {/* Variant wise Sold List */}
        {totalVariants > 0 && (
          <div className="bg-gray-50 border border-gray-100 rounded-md p-1">
            <div className="flex flex-wrap gap-1">
              {product.colors.map((v, idx) => (
                <span
                  key={idx}
                  className="text-[9px] px-1 py-0.5 rounded-full border border-gray-200 bg-white text-gray-700"
                  title={`${v.name} sold`}
                >
                  {v.name}: <b>{Number(v?.sold || 0)}</b>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Variants count (only, since Serial/Active moved to image) */}
        {totalVariants > 0 && (
          <span className="self-start px-1.5 py-[1px] rounded-full bg-purple-50 border border-purple-200 text-purple-600 text-[9px] font-medium">
            {totalVariants} Variants
          </span>
        )}

        {/* Category + Rating */}
        <div className="flex items-center justify-between text-[10px] text-gray-500">
          <span className="truncate">
            {cat ? (
              <span className="font-medium text-gray-700">{cat.name}</span>
            ) : (
              <span className="text-gray-400">ক্যাটাগরি নেই</span>
            )}
          </span>
          <span className="flex items-center gap-0.5 shrink-0 text-gray-600 font-medium">
            ⭐ {product.rating || 0}
          </span>
        </div>

        {/* Actions — icon only on mobile, icon+text from sm up */}
        <div className="flex gap-1.5 mt-auto pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            title="সম্পাদনা"
            className="flex-1 flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white py-1.5 rounded-md text-xs font-semibold transition"
          >
            <span>✏</span>
            <span className="hidden sm:inline">সম্পাদনা</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="মুছুন"
            className="flex-1 flex items-center justify-center gap-1 bg-red-500 hover:bg-red-600 active:scale-[0.98] text-white py-1.5 rounded-md text-xs font-semibold transition"
          >
            <span>🗑</span>
            <span className="hidden sm:inline">মুছুন</span>
          </button>
        </div>
      </div>
    </div>
  );
}
