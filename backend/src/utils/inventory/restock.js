import Product from "../../models/Product.js";

const toNumber = (val, fallback = 0) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeString = (s) =>
  String(s || "")
    .trim()
    .toLowerCase();

const hasVariants = (product) =>
  Array.isArray(product?.colors) && product.colors.length > 0;

const computeVariantTotalStock = (colors) => {
  const list = Array.isArray(colors) ? colors : [];
  return list.reduce((sum, c) => sum + toNumber(c?.stock, 0), 0);
};

const computeSoldOut = (product) => {
  if (!hasVariants(product)) return toNumber(product?.stock, 0) <= 0;
  const anyInStock = product.colors.some((c) => toNumber(c?.stock, 0) > 0);
  return !anyInStock;
};

/**
 * ✅ একটা order item-এর stock ফিরিয়ে দেওয়া (restock) — order cancel হলে ব্যবহার হয়।
 * item: { productId, qty, color }
 */
const restockOneItem = async (item) => {
  const productId = item?.productId;
  const qty = toNumber(item?.qty, 0);
  const color = item?.color ? String(item.color) : null;

  if (!productId || qty <= 0) return;

  const product = await Product.findById(productId);
  if (!product) return;

  if (hasVariants(product) && color) {
    const targetColor = normalizeString(color);
    const idx = product.colors.findIndex(
      (c) => normalizeString(c?.name) === targetColor,
    );

    if (idx !== -1) {
      const currentStock = toNumber(product.colors[idx]?.stock, 0);
      product.colors[idx].stock = currentStock + qty;

      const currentSold = toNumber(product.colors[idx]?.sold, 0);
      product.colors[idx].sold = Math.max(0, currentSold - qty);

      product.sold = Math.max(0, toNumber(product.sold, 0) - qty);
      product.stock = computeVariantTotalStock(product.colors);
      product.isSoldOut = computeSoldOut(product);
      await product.save();
      return;
    }
  }

  // ✅ No-variant product
  product.stock = toNumber(product.stock, 0) + qty;
  product.sold = Math.max(0, toNumber(product.sold, 0) - qty);
  product.isSoldOut = computeSoldOut(product);
  await product.save();
};

/**
 * ✅ পুরো order-এর সব item restock করে (order cancel হলে কল হবে)
 */
export const restockOrderItems = async (items = []) => {
  await Promise.all(
    (Array.isArray(items) ? items : []).map((item) =>
      restockOneItem(item).catch((err) =>
        console.error("❌ Restock failed for item:", item, err),
      ),
    ),
  );
};
