import mongoose from "mongoose";
import Product from "../models/Product.js";

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const normalizeString = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const hasVariants = (product) =>
  Array.isArray(product?.colors) && product.colors.length > 0;

export const createOrderValidationError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const buildPricedOrderItemsFromDB = async (rawItems) => {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw createOrderValidationError("Order items are required");
  }

  const grouped = new Map();

  for (const rawItem of rawItems) {
    const productId = String(rawItem?.productId || "").trim();
    const qty = Number(rawItem?.qty);
    const color = rawItem?.color ? String(rawItem.color).trim() : null;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw createOrderValidationError(
        `Invalid product ID: ${productId || "empty"}`,
      );
    }
    if (!Number.isInteger(qty) || qty < 1) {
      throw createOrderValidationError("Quantity must be a positive integer");
    }

    const key = `${productId}|${normalizeString(color)}`;
    const current = grouped.get(key);
    if (current) current.qty += qty;
    else grouped.set(key, { productId, qty, color });
  }

  const trustedItems = [];

  for (const item of grouped.values()) {
    const product = await Product.findById(item.productId);
    if (!product || product.isActive === false) {
      throw createOrderValidationError(`Product not found: ${item.productId}`);
    }

    let selectedVariant = null;
    if (hasVariants(product)) {
      if (!item.color) {
        throw createOrderValidationError(
          `Please select a variant for ${product.name}`,
        );
      }
      selectedVariant = product.colors.find(
        (variant) =>
          normalizeString(variant?.name) === normalizeString(item.color),
      );
      if (!selectedVariant) {
        throw createOrderValidationError(
          `Variant not found: "${item.color}" for product: ${product.name}`,
        );
      }
    }

    const price = Number(selectedVariant?.price ?? product.price);
    const stock = Number(selectedVariant?.stock ?? product.stock ?? 0);

    if (!Number.isFinite(price) || price < 0) {
      throw createOrderValidationError(
        `Invalid price configured for ${product.name}`,
      );
    }
    if (!Number.isFinite(stock) || stock < item.qty) {
      const label = selectedVariant?.name ? ` (${selectedVariant.name})` : "";
      throw createOrderValidationError(
        `${product.name}${label} stock not enough. Available: ${Math.max(
          0,
          toNumber(stock, 0),
        )}`,
      );
    }

    trustedItems.push({
      productId: String(product._id),
      categoryId: product.category ? String(product.category) : null,
      name: product.name,
      price,
      qty: item.qty,
      image:
        selectedVariant?.images?.[0] ||
        product.image ||
        product.images?.[0] ||
        "",
      color: selectedVariant?.name || null,
      stock,
      freeDelivery: !!product.freeDelivery,
    });
  }

  return trustedItems;
};

export const calculateItemsSubtotal = (items) =>
  (Array.isArray(items) ? items : []).reduce(
    (sum, item) =>
      sum + toNumber(item?.price, 0) * toNumber(item?.qty, 0),
    0,
  );
