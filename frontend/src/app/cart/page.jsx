"use client";

import React, { useEffect, useState, useMemo, memo } from "react";
import Image from "next/image";
import cloudinaryLoader from "../../../lib/cloudinaryLoader";
import Link from "next/link";
import { useCart } from "../../../context/CartContext";
import { FaPlus, FaMinus, FaTrash, FaHeart } from "react-icons/fa";
import { apiFetch } from "../../../utils/api";
import CheckoutButton from "../../../components/home/CheckoutButton";
import CartSkeleton from "../../../components/skeletons/CartSkeleton";

// ✅ Helper: cart key parse (productId|Color)
const parseCartKey = (key) => {
  const [productId, color] = String(key).split("|");
  return { productId, color: color || null };
};

// ✅ Memoized single Cart Item component
const CartItem = memo(
  ({
    p,
    updateCart,
    removeFromCart,
    toggleWishlist,
    wishlist,
    selected,
    toggleSelect,
  }) => {
    const discount =
      p.oldPrice && (((p.oldPrice - p.price) / p.oldPrice) * 100).toFixed(1);

    const isInWishlist = wishlist.includes(String(p._id));

    // ✅ stock & soldout aware (variant > product)
    const currentStock = p.colorVariant
      ? Number(p.colorVariant.stock || 0)
      : Number(p.stock || 0);

    const isOutOfStock = currentStock <= 0 || p.isSoldOut;

    return (
      <div className="bg-pink-100 rounded-md shadow-sm p-2 flex items-center gap-2 hover:shadow transition-all duration-300">
        {/* ✅ Select Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={() => toggleSelect(p.cartKey)}
          className="w-4 h-4 accent-pink-600 cursor-pointer"
        />

        {/* ✅ Image Left */}
        <Link
          href={`/products/${p._id}`}
          className="relative w-14 h-14 flex-shrink-0"
        >
          <Image loader={cloudinaryLoader}
            src={p.image || "/no-image.png"}
            alt={p.name || "Product"}
            fill
            sizes="56px"
            loading="lazy"
            className="object-contain rounded"
          />
        </Link>

        {/* ✅ Info Right */}
        <div className="flex flex-col flex-1 justify-between">
          <div>
            <Link
              href={`/products/${p._id}`}
              className="font-semibold text-[12px] sm:text-sm text-gray-800 hover:underline leading-tight"
            >
              {p.name}
            </Link>

            {/* ✅ Show selected variant */}
            {p.selectedColor && (
              <p className="text-[10px] font-bold text-pink-600 mt-0.5">
                Variant: {p.selectedColor}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-1 mt-0.5">
              <span className="text-blue-600 font-bold text-[12px]">
                ৳{p.price}
              </span>
              {p.oldPrice && (
                <span className="line-through text-gray-400 text-[10px]">
                  ৳{p.oldPrice}
                </span>
              )}
              {discount && (
                <span className="text-red-500 text-[10px] font-medium">
                  {discount}% OFF
                </span>
              )}
            </div>

            {/* ✅ Stock badge */}
            <p
              className={`text-[10px] font-bold mt-0.5 ${
                isOutOfStock ? "text-red-500" : "text-green-600"
              }`}
            >
              {isOutOfStock ? "Out of Stock" : `In Stock (${currentStock})`}
            </p>
          </div>

          {/* ✅ Quantity + Buttons Row */}
          <div className="flex items-center justify-between mt-1">
            {/* Qty Control */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  p.qty > 1 && updateCart(p.cartKey, -1, currentStock)
                }
                className={`p-1.5 rounded text-white text-[10px] ${
                  p.qty > 1
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                <FaMinus size={10} />
              </button>

              <span className="font-bold text-[12px]">{p.qty}</span>

              <button
                type="button"
                onClick={() => updateCart(p.cartKey, +1, currentStock)}
                disabled={isOutOfStock || p.qty >= currentStock}
                className={`text-white p-1.5 rounded text-[10px] ${
                  isOutOfStock || p.qty >= currentStock
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600"
                }`}
              >
                <FaPlus size={10} />
              </button>
            </div>

            {/* Remove / Wishlist */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => removeFromCart(p.cartKey)}
                className="bg-red-600 text-white px-2 py-1 rounded text-[10px] flex items-center gap-1 hover:bg-red-700"
              >
                <FaTrash size={10} /> <span>রিমুভ</span>
              </button>

              <button
                type="button"
                onClick={() => toggleWishlist(p._id)}
                className={`p-1.5 rounded-full ${
                  isInWishlist
                    ? "bg-red-500 text-white"
                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                }`}
              >
                <FaHeart size={10} />
              </button>
            </div>
          </div>

          {/* ✅ Total */}
          <div className="text-blue-600 font-semibold text-[12px] mt-1 text-right">
            মোট: ৳{Number(p.price || 0) * Number(p.qty || 0)}
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.p.cartKey === nextProps.p.cartKey &&
      prevProps.p.qty === nextProps.p.qty &&
      prevProps.wishlist === nextProps.wishlist &&
      prevProps.selected === nextProps.selected
    );
  }
);

export default function CartPage() {
  const {
    cart,
    setCart,
    wishlist,
    updateCart,
    removeFromCart,
    toggleWishlist,
  } = useCart();

  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ selected cart keys
  const [selectedKeys, setSelectedKeys] = useState([]);

  useEffect(() => {
    apiFetch("/products")
      .then((data) => {
        setAllProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Failed to fetch products", err);
        setLoading(false);
      });
  }, []);

  const items = useMemo(() => {
    if (!allProducts.length) return [];

    return Object.keys(cart)
      .map((key) => {
        const { productId, color } = parseCartKey(key);

        const p = allProducts.find((x) => String(x._id) === String(productId));
        if (!p) return null;

        // ✅ robust variant match (case insensitive)
        const variant = color
          ? p.colors?.find(
              (c) =>
                String(c?.name || "")
                  .trim()
                  .toLowerCase() ===
                String(color || "")
                  .trim()
                  .toLowerCase()
            )
          : null;

        // ✅ use variant image first
        const image =
          variant?.images?.[0] ||
          p.image ||
          (Array.isArray(p.images) && p.images.length > 0
            ? p.images[0]
            : "/no-image.png");

        return {
          ...p,
          cartKey: key,
          selectedColor: color,
          colorVariant: variant,
          qty: cart[key],
          image,
        };
      })
      .filter(Boolean);
  }, [cart, allProducts]);

  // ✅ Auto select all when cart changes (first time)
  useEffect(() => {
    const keys = items.map((x) => x.cartKey);
    setSelectedKeys((prev) => (prev.length ? prev : keys));
  }, [items]);

  const toggleSelect = (cartKey) => {
    setSelectedKeys((prev) =>
      prev.includes(cartKey)
        ? prev.filter((k) => k !== cartKey)
        : [...prev, cartKey]
    );
  };

  const handleSelectAll = () => setSelectedKeys(items.map((x) => x.cartKey));
  const handleUnselectAll = () => setSelectedKeys([]);

  const selectedItems = useMemo(() => {
    return items.filter((p) => selectedKeys.includes(p.cartKey));
  }, [items, selectedKeys]);

  const grandTotal = selectedItems.reduce((sum, p) => sum + p.price * p.qty, 0);

  const handleClearCart = () => {
    setCart({});
    setSelectedKeys([]);
  };

  const hasOutOfStock = selectedItems.some((p) => {
    const currentStock = p.colorVariant
      ? Number(p.colorVariant.stock || 0)
      : Number(p.stock || 0);
    return currentStock <= 0 || p.isSoldOut || p.qty > currentStock;
  });

  const checkoutItems = useMemo(() => {
    return selectedItems
      .map((p) => {
        const stock = p.colorVariant
          ? Number(p.colorVariant.stock || 0)
          : Number(p.stock || 0);

        return {
          productId: String(p._id),
          qty: Number(p.qty || 0),
          color: p.selectedColor || null,
          stock: Number(stock || 0),
        };
      })
      .filter((it) => it.productId && it.qty > 0);
  }, [selectedItems]);

  return (
    <main className="bg-pink-50">
      <div className="container mx-auto px-3 sm:px-6 py-5">
        {/* ✅ Header */}
        <div className="mb-2">
          <h2 className="text-center text-lg sm:text-xl font-semibold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-600 text-transparent bg-clip-text mb-2">
            🛒 আপনার কার্ট
          </h2>

          {items.length > 0 && !loading && (
            <div className="flex justify-between items-center gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="bg-pink-500 text-white px-3 py-1 rounded text-xs hover:bg-pink-600"
                >
                  সব সিলেক্ট
                </button>
                <button
                  type="button"
                  onClick={handleUnselectAll}
                  className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-300"
                >
                  আনসিলেক্ট
                </button>
              </div>

              <button
                type="button"
                onClick={handleClearCart}
                className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 transition"
              >
                সব মুছে ফেলুন
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <CartSkeleton key={i} />
            ))}
          </div>
        ) : !items.length ? (
          <div className="bg-pink-100 rounded-xl shadow p-6 text-center">
            <p className="text-gray-500 text-lg">আপনার কার্ট খালি 😢</p>
            <Link
              href="/products"
              className="text-blue-500 hover:underline mt-2 inline-block"
            >
              পণ্য দেখুন
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((p) => (
              <CartItem
                key={p.cartKey}
                p={p}
                updateCart={updateCart}
                removeFromCart={removeFromCart}
                toggleWishlist={toggleWishlist}
                wishlist={wishlist}
                selected={selectedKeys.includes(p.cartKey)}
                toggleSelect={toggleSelect}
              />
            ))}

            <div className="text-right font-bold text-base mt-4 border-t pt-3">
              সিলেক্টেড মোট:{" "}
              <span className="text-blue-600">৳{grandTotal}</span>
            </div>

            {hasOutOfStock && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold p-2 rounded-lg text-right">
                ⚠️ সিলেক্টেড আইটেমে Out of Stock আছে! আগে সেগুলো সরান বা qty
                কমান।
              </div>
            )}

            <div className="pb-6 flex justify-end">
              <CheckoutButton
                label="চেকআউট করুন"
                fullWidth={false}
                disabled={hasOutOfStock || checkoutItems.length === 0}
                checkoutItems={checkoutItems}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
