import { FaStar, FaHeart, FaFire } from "react-icons/fa";
import VariantSelector from "./VariantSelector";
import ShareProduct from "./ShareProduct";

export default function ProductInfo({
  product,
  category,
  isOutOfStock,
  currentStock,
  soldCount,
  currentPrice,
  currentOldPrice,
  hasOldPrice,
  discountPct,
  isInWishlist,
  toggleWishlist,
  selectedColor,
  setSelectedColor,
}) {
  return (
    <div>
      {/* Title */}
      <div className="flex justify-between items-start">
        <h1 className="text-[17px] md:text-3xl font-bold text-gray-800 leading-snug md:leading-tight">
          {product.name}
        </h1>
      </div>

      {/* Category */}
      <p className="text-[8px] md:text-sm font-medium text-gray-400 uppercase tracking-wide md:tracking-wider mt-1 md:mt-0 md:mb-2">
        Category:{" "}
        <span className="text-gray-800">{category?.name || "N/A"}</span>
      </p>

      {/* Stock + Sold */}
      <div className="flex items-center gap-3 md:gap-4 md:mt-1 md:mb-3">
        <p
          className={`font-bold flex items-center gap-1 text-[11px] md:text-sm ${
            isOutOfStock ? "text-red-500" : "text-green-600"
          }`}
        >
          {isOutOfStock ? "✕ Out of Stock" : "✓ In Stock"}
          <span className="font-normal text-gray-400 md:ml-1">
            ({currentStock} left)
          </span>
        </p>

        <div className="h-4 w-[1px] bg-gray-200" />

        <div className="flex items-center gap-1 md:gap-1.5 bg-orange-50 text-orange-600 px-2 md:px-3 py-0.5 md:py-1 rounded-full border border-orange-100">
          <FaFire className="text-[8px] md:text-[10px] md:animate-bounce" />
          <span className="text-[10px] md:text-xs font-bold">
            {soldCount} Sold
          </span>
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2 md:gap-3 md:mt-1 md:mb-3">
        <div className="flex items-center gap-1">
          <div className="flex text-yellow-400 text-[10px] md:text-sm">
            {[...Array(5)].map((_, i) => (
              <FaStar
                key={i}
                className={i < (product.rating || 0) ? "" : "text-gray-200"}
              />
            ))}
          </div>

          <span className="text-[11px] md:text-xs font-bold text-gray-500 ml-1">
            ({product.rating || 0}/5)
          </span>
        </div>
      </div>

      {/* Price + Wishlist */}
      <div className="md:mt-2 md:my-8">
        <div className="flex items-start md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-end gap-x-2 md:gap-x-3 gap-y-1">
            <p className="text-indigo-600 md:text-blue-600 font-extrabold text-xl md:text-4xl tracking-tight">
              ৳{currentPrice}
            </p>

            {hasOldPrice && (
              <p className="text-gray-400 text-[12px] md:text-sm font-medium">
                <span className="line-through decoration-gray-400 decoration-2">
                  ৳{currentOldPrice}
                </span>
              </p>
            )}

            {discountPct && (
              <span className="bg-pink-600/90 text-white px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-[8px] md:text-xs font-bold uppercase md:shadow-sm">
                {discountPct}% OFF
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <ShareProduct productName={product.name} />

            <button
              type="button"
              onClick={() => toggleWishlist(product._id)}
              aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
              className={`rounded-full transition-all shadow-sm md:shadow-md p-1 md:p-3 ${
                isInWishlist
                  ? "bg-red-500 text-white"
                  : "bg-white text-gray-400 hover:text-red-500"
              }`}
            >
              <FaHeart className="text-sm md:text-base" />
            </button>
          </div>
        </div>

        {hasOldPrice && discountPct && (
          <p className="text-[10px] md:mt-1 md:text-sm text-emerald-600 font-semibold">
            You save ৳{currentOldPrice - currentPrice}
          </p>
        )}
      </div>

      {/* Variant */}
      <div className="pt-2 md:pt-0">
        <VariantSelector
          colors={product.colors}
          selectedColor={selectedColor}
          onSelect={setSelectedColor}
        />
      </div>
    </div>
  );
}
