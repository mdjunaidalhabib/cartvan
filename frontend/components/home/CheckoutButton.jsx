"use client";
import { useRouter } from "next/navigation";
import { useUser } from "../../context/UserContext";
import { useState, useCallback, useMemo } from "react";

export default function CheckoutButton({
  product,
  productId,
  qty = 1,
  total,
  fullWidth,
  onClick,
  label,

  // ✅ pass actual stock from product details (variant stock)
  stock,

  // ✅ pass color name (for single product checkout)
  color,

  // ✅ cart checkout support (items array)
  checkoutItems,

  // ✅ external control
  disabled,
  loading: externalLoading,

  // ✅ optional extra styling
  className = "",
}) {
  const router = useRouter();
  const { me } = useUser();
  const [loading, setLoading] = useState(false);

  const mergedLoading = Boolean(externalLoading || loading);

  // ✅ Always normalize stock as number
  const currentStock = useMemo(() => {
    const s =
      stock !== undefined && stock !== null ? stock : product?.stock ?? 0;
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }, [stock, product?.stock]);

  const isOutOfStock = currentStock <= 0;

  // ✅ cart mode out-of-stock check
  const cartHasOutOfStock = useMemo(() => {
    if (!Array.isArray(checkoutItems) || checkoutItems.length === 0)
      return false;

    return checkoutItems.some((it) => {
      const st = Number(it?.stock ?? Infinity);
      const q = Number(it?.qty ?? 0);
      return st <= 0 || q <= 0 || q > st;
    });
  }, [checkoutItems]);

  const handleClick = useCallback(async () => {
    if (mergedLoading) return;
    if (disabled) return;

    // ✅ prevent checkout if cart contains out-of-stock
    if (cartHasOutOfStock) return;

    // ✅ single product out-of-stock block
    if (!checkoutItems && isOutOfStock) return;

    setLoading(true);

    try {
      // ✅ build checkout url (product OR cart)
      // ✅ শুধু path পাঠানো হচ্ছে, origin (www vs non-www) বাদ দিয়ে —
      // নাহলে Google login এর পর ভিন্ন domain এ redirect হলে token/localStorage হারিয়ে যায়
      const checkoutUrl = (() => {
        // ✅ cart checkout
        if (Array.isArray(checkoutItems) && checkoutItems.length > 0) {
          const payload = encodeURIComponent(JSON.stringify(checkoutItems));
          return `/checkout?items=${payload}`;
        }

        // ✅ single product checkout (include color + stock)
        if (productId) {
          const c = color ? `&color=${encodeURIComponent(color)}` : "";
          const s = `&stock=${encodeURIComponent(String(currentStock))}`;
          return `/checkout?productId=${productId}&qty=${qty}${c}${s}`;
        }

        return `/checkout`;
      })();

      // 🔹 User not logged in → redirect to Google Auth
      if (!me) {
        window.location.href = `${
          "/api"
        }/auth/google?redirect=${encodeURIComponent(checkoutUrl)}`;
        return;
      }

      // 🔹 custom onClick (optional)
      if (onClick) {
        await onClick();
        return;
      }

      // 🔹 redirect to checkout
      const redirectPath = (() => {
        if (Array.isArray(checkoutItems) && checkoutItems.length > 0) {
          const payload = encodeURIComponent(JSON.stringify(checkoutItems));
          return `/checkout?items=${payload}`;
        }

        if (productId) {
          const c = color ? `&color=${encodeURIComponent(color)}` : "";
          const s = `&stock=${encodeURIComponent(String(currentStock))}`;
          return `/checkout?productId=${productId}&qty=${qty}${c}${s}`;
        }

        return `/checkout`;
      })();

      router.push(redirectPath);
    } catch (err) {
      console.error("Checkout failed:", err);
    } finally {
      setLoading(false);
    }
  }, [
    mergedLoading,
    disabled,
    cartHasOutOfStock,
    checkoutItems,
    isOutOfStock,
    me,
    onClick,
    productId,
    qty,
    router,
    color,
    currentStock,
  ]);

  const isDisabled =
    Boolean(disabled) ||
    mergedLoading ||
    cartHasOutOfStock ||
    (!checkoutItems && isOutOfStock);

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        ${fullWidth ? "w-full" : "w-auto"}

        /* ✅ MOBILE (default) */
        h-10 px-4 text-sm font-medium rounded-lg
        shadow-md

        /* ✅ DESKTOP (md+) */
        md:h-12 md:px-24 md:text-base md:font-semibold md:rounded-xl
        md:shadow-sm

        bg-green-600 hover:bg-green-700 transition-colors duration-200
        text-white
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
        ${className}
      `}
    >
      {mergedLoading ? (
        <>
          <span className="animate-spin text-xs md:text-sm">⏳</span>
          <span className="text-xs md:text-sm">Processing...</span>
        </>
      ) : label ? (
        label
      ) : total ? (
        `অর্ডার কনফার্ম করুন ৳${total}`
      ) : cartHasOutOfStock ? (
        "Out of Stock"
      ) : (
        "Buy Now"
      )}
    </button>
  );
}
