"use client";

import React, { memo, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import cloudinaryLoader from "../../lib/cloudinaryLoader";
import {
  FaStar,
  FaHeart,
  FaShoppingCart,
  FaPlus,
  FaMinus,
} from "react-icons/fa";
import { useCartUtils } from "../../hooks/useCartUtils";

const ProductCard = memo(({ product, priority = false }) => {
  const { cart, updateCart, wishlist, toggleWishlist } = useCartUtils();

  const productId = product?._id;
  if (!productId) return null;

  // ✅ SAFE colors array
  const colors = Array.isArray(product?.colors) ? product.colors : [];

  // ✅ pick default variant (first color)
  const defaultColor = colors.length > 0 ? colors[0] : null;

  // ✅ cartKey must include color to avoid stock mismatch
  const cartKey = defaultColor
    ? `${productId}|${defaultColor.name}`
    : String(productId);

  // ✅ quantity now read by cartKey
  const quantity = cart[String(cartKey)] || 0;

  const discount = product?.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  const isInWishlist = wishlist.includes(String(productId));
  const totalPrice = Number(product?.price || 0) * quantity;

  const isSoldOut =
    product?.isSoldOut === true || product?.isSoldOut === "true";

  // ✅ ✅ Total Stock (variants থাকলে যোগ করে, না থাকলে product.stock)
  const totalStock = useMemo(() => {
    if (colors.length > 0) {
      return colors.reduce((sum, v) => sum + Number(v?.stock || 0), 0);
    }
    return Number(product?.stock || 0);
  }, [colors, product]);

  // ✅ ✅ Total Sold (variants থাকলে যোগ করে, না থাকলে product.sold)
  const totalSold = useMemo(() => {
    if (colors.length > 0) {
      return colors.reduce((sum, v) => sum + Number(v?.sold || 0), 0);
    }
    return Number(product?.sold || 0);
  }, [colors, product]);

  const isOutOfStock = totalStock <= 0 || isSoldOut;

  const mainImage = useMemo(() => {
    if (defaultColor?.images?.length > 0) return defaultColor.images[0];
    if (product?.image && product.image.startsWith("http"))
      return product.image;
    if (product?.images?.length > 0) return product.images[0];
    return "/no-image.png";
  }, [product, defaultColor]);

  return (
    <div className="relative bg-pink-100 shadow-md rounded-lg hover:shadow-lg transition flex flex-col group">
      <Link
        href={`/products/${productId}`}
        className="relative w-full aspect-square mb-1 overflow-hidden rounded-lg"
      >
        <div className="absolute top-1 left-1 right-1 flex justify-between z-10">
          {product?.oldPrice && (
            <span className="bg-red-500 text-white px-1 py-0.5 rounded-full text-[10px] font-semibold">
              -{discount}%
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(productId);
            }}
            className={`p-1 rounded-full shadow transition-colors ${
              isInWishlist
                ? "bg-red-500 text-white"
                : "bg-white/80 text-gray-600 hover:bg-red-100"
            }`}
          >
            <FaHeart className="w-3 h-3" />
          </button>
        </div>

        <Image loader={cloudinaryLoader}
          src={mainImage}
          alt={product?.name || "Product"}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          className="object-cover rounded-lg transition-transform duration-500 group-hover:scale-105"
        />
      </Link>

      <div className="px-2 pb-1">
        <h4 className="font-semibold text-sm sm:text-base truncate text-gray-800">
          {product?.name}
        </h4>

        {/* ✅ Stock + Sold (NOW TOTAL) */}
        <div className="flex items-center justify-between">
          <p
            className={`text-[9px] ${
              !isOutOfStock ? "text-green-600" : "text-red-500"
            }`}
          >
            {!isOutOfStock ? `In Stock (${totalStock})` : "Out of Stock"}
          </p>

          <span className="text-[9px] text-gray-500">Sold: {totalSold}</span>
        </div>

        {/* ✅ Variant + Rating same row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <FaStar
                key={i}
                className={`w-2.5 h-2.5 ${
                  i < (product?.rating || 0)
                    ? "text-yellow-500"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        {/* ✅ Price */}
        <div className="flex items-center gap-2 mb-2">
          <p className="text-blue-600 font-bold text-sm sm:text-base">
            ৳{product?.price}
          </p>
          {product?.oldPrice && (
            <p className="text-gray-400 line-through text-[10px] sm:text-xs">
              ৳{product.oldPrice}
            </p>
          )}
        </div>

        {/* ✅ Cart Button */}
        {!quantity ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              // ✅ add with cartKey + TOTAL STOCK limit
              updateCart(cartKey, +1, totalStock);
            }}
            disabled={isOutOfStock}
            className={`w-full px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition ${
              isOutOfStock
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-pink-600 text-white hover:bg-pink-700"
            }`}
          >
            <FaShoppingCart /> Add
          </button>
        ) : (
          <div>
            <div className="flex items-center justify-center gap-2 -mt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateCart(cartKey, -1, totalStock);
                }}
                className="p-1 bg-pink-50 shadow-sm rounded text-pink-600"
              >
                <FaMinus className="text-[7px]" />
              </button>

              <span className="text-[9px] font-bold text-gray-800">
                {quantity}
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateCart(cartKey, +1, totalStock);
                }}
                className="p-1 bg-pink-50 shadow-sm rounded text-pink-600"
              >
                <FaPlus className="text-[7px]" />
              </button>
            </div>

            <p className="text-center text-[9px] font-bold text-blue-600 mt-1">
              Total: ৳{totalPrice}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;
