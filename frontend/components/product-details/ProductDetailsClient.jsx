"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProductDetailsSkeleton from "../skeletons/ProductDetailsSkeleton";
import { useCartUtils } from "../../hooks/useCartUtils";

import ProductBreadcrumb from "./ProductBreadcrumb";
import ProductGallery from "./ProductGallery";
import ProductInfo from "./ProductInfo";
import PurchaseActions from "./PurchaseActions";
import ProductTabs from "./ProductTabs";
import RelatedProducts from "./RelatedProducts";
import FacebookGroupLink from "./FacebookGroupLink";

export default function ProductDetailsClient({
  product,
  category,
  related = [],
  loading = false,
}) {
  const { cart, wishlist, toggleWishlist, updateCart } = useCartUtils();
  const router = useRouter();

  const [selectedColor, setSelectedColor] = useState(
    product?.colors?.length > 0 ? product.colors[0] : null
  );
  const [activeIdx, setActiveIdx] = useState(0);
  const [tab, setTab] = useState("desc");

  useEffect(() => {
    if (product?.colors?.length > 0) setSelectedColor(product.colors[0]);
    else setSelectedColor(null);
    setActiveIdx(0);
  }, [product]);

  if (loading || !product?._id) return <ProductDetailsSkeleton />;

  // ✅ normalize isSoldOut
  const isSoldOut =
    product?.isSoldOut === true || product?.isSoldOut === "true";

  // ✅ stock normalize (variant stock first)
  const currentStockRaw = selectedColor?.stock ?? product?.stock ?? 0;
  const currentStock = Number(currentStockRaw) || 0;

  // ✅ final out of stock
  const isOutOfStock = currentStock <= 0 || isSoldOut;

  // ✅ variant aware cart key
  const cartKey = selectedColor?.name
    ? `${product._id}|${selectedColor.name}`
    : String(product._id);

  // ✅ quantity by cartKey
  const quantity = cart[String(cartKey)] || 0;

  // ✅ numeric total price
  const totalPrice = Number(product?.price || 0) * Number(quantity || 0);

  // ✅ images choose from variant or fallback
  const images = useMemo(() => {
    if (selectedColor && selectedColor.images?.length > 0)
      return selectedColor.images;

    const gallery = Array.isArray(product.images) ? product.images : [];
    const main =
      product.image && product.image.startsWith("http") ? product.image : null;

    if (main && !gallery.includes(main)) return [main, ...gallery];
    if (gallery.length > 0) return gallery;

    return ["/no-image.png"];
  }, [product, selectedColor]);

  // ✅ safety reset idx if invalid
  useEffect(() => {
    if (!images?.length) return;
    if (activeIdx >= images.length) setActiveIdx(0);
  }, [images, activeIdx]);

  // ✅ autoplay slider
  useEffect(() => {
    if (!images || images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images]);

  // ✅ oldPrice discount logic
  const hasOldPrice =
    product.oldPrice && Number(product.oldPrice) > Number(product.price || 0);

  const discountPct = hasOldPrice
    ? (
        ((Number(product.oldPrice) - Number(product.price)) /
          Number(product.oldPrice)) *
        100
      ).toFixed(1)
    : null;

  // ✅ wishlist normalize
  const isInWishlist = wishlist.includes(String(product._id));

  // ✅ sold count variant aware
  const soldCount = Number(selectedColor?.sold ?? product?.sold ?? 0) || 0;

  // ✅ checkout pass color + stock + cartKey qty
  const handleCheckout = async () => {
    if (isOutOfStock) return;

    // If qty is 0 add 1 first
    if (!quantity || quantity === 0) {
      await updateCart(cartKey, +1, currentStock);
    }

    const finalQty = quantity || 1;

    router.push(
      `/checkout?productId=${product._id}&qty=${finalQty}${
        selectedColor ? `&color=${encodeURIComponent(selectedColor.name)}` : ""
      }&stock=${currentStock}`
    );
  };

return (
  <main className="container mx-auto px-4 sm:px-6 lg:px-8 mt-4 md:py-8">
    <ProductBreadcrumb product={product} category={category} />

    <section className="bg-pink-50 rounded-2xl grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 overflow-hidden">
      {/* Product Gallery */}
      <div className="lg:col-span-7">
        <ProductGallery
          images={images}
          activeIdx={activeIdx}
          setActiveIdx={setActiveIdx}
          productName={product.name}
          isOutOfStock={isOutOfStock}
        />
      </div>

      {/* Product Info */}
      <div className="lg:col-span-5 flex flex-col md:px-6 md:py-6 bg-pink-50 gap-4">
        <ProductInfo
          product={product}
          category={category}
          isOutOfStock={isOutOfStock}
          currentStock={currentStock}
          soldCount={soldCount}
          hasOldPrice={hasOldPrice}
          discountPct={discountPct}
          isInWishlist={isInWishlist}
          toggleWishlist={toggleWishlist}
          selectedColor={selectedColor}
          setSelectedColor={(c) => {
            setSelectedColor(c);
            setActiveIdx(0);
          }}
        />

        <PurchaseActions
          product={product}
          cartKey={cartKey}
          quantity={quantity}
          totalPrice={totalPrice}
          isOutOfStock={isOutOfStock}
          currentStock={currentStock}
          updateCart={updateCart}
          handleCheckout={handleCheckout}
        />
      </div>
    </section>

    <ProductTabs product={product} tab={tab} setTab={setTab} />
    <FacebookGroupLink />
    <RelatedProducts related={related} />
  </main>
);
}
