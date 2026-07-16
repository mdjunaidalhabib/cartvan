import Trash from "../../src/models/Trash.js";
import Product from "../../src/models/Product.js";
import Category from "../../src/models/Category.js";
import Slider from "../../src/models/Slider.js";
import Order from "../../src/models/Order.js";
import PaymentMethod from "../../src/models/PaymentMethod.js";
import {
  deleteFromCloudinary,
  deleteByPublicId,
} from "../cloudinary/cloudinaryHelpers.js";

// ✅ যতদিন Trash এ রাখা হবে, তারপর auto-delete (permanent)
export const TRASH_TTL_DAYS = 3;

// ✅ প্রতিটা collection এর জন্য মডেল ম্যাপ (restore এর সময় দরকার)
const MODEL_MAP = {
  Product,
  Category,
  Slider,
  Order,
  PaymentMethod,
};

// ✅ Trash list এ দেখানোর জন্য একটা readable label বানানো
const getLabel = (collectionName, data) => {
  switch (collectionName) {
    case "Product":
      return data?.name || "Unnamed product";
    case "Category":
      return data?.name || "Unnamed category";
    case "Slider":
      return data?.title || "Untitled slide";
    case "Order":
      return data?.billing?.name
        ? `Order - ${data.billing.name}`
        : `Order #${String(data?._id || "").slice(-6)}`;
    case "PaymentMethod":
      return data?.name ? `Payment Method - ${data.name}` : "Unnamed payment method";
    default:
      return data?.name || data?.title || String(data?._id || "Item");
  }
};

/**
 * ✅ Hard-delete এর বদলে item টা Trash এ move করে।
 * NOTE: এখানে কোনো cloudinary image ডিলিট করা হয় না — restore করলে
 * যাতে ছবি সহ পুরোপুরি ফিরে আসে। Image/asset শুধু permanent delete
 * (manual অথবা auto-purge) এর সময় cleanup হবে।
 *
 * @param {string} collectionName - "Product" | "Category" | "Slider" | "Order"
 * @param {import("mongoose").Document} doc - already-fetched mongoose document
 */
export const moveToTrash = async (collectionName, doc) => {
  const data = doc.toObject({ depopulate: true });

  const trashEntry = await Trash.create({
    collectionName,
    originalId: doc._id,
    label: getLabel(collectionName, data),
    data,
    deletedAt: new Date(),
    expiresAt: new Date(Date.now() + TRASH_TTL_DAYS * 24 * 60 * 60 * 1000),
  });

  await doc.deleteOne();

  return trashEntry;
};

/**
 * ✅ Trash এ থাকা কোনো item এর সাথে জড়িত cloudinary image/asset ডিলিট করে।
 * শুধু permanent delete (manual "Delete forever" অথবা 3 দিন পর auto-purge)
 * এর সময় call হবে — soft delete/restore এ না।
 */
export const cleanupTrashAssets = async (collectionName, data) => {
  try {
    if (collectionName === "Product") {
      if (data.image) await deleteFromCloudinary(data.image);
      for (const url of data.images || []) await deleteFromCloudinary(url);
      for (const color of data.colors || []) {
        for (const url of color.images || []) await deleteFromCloudinary(url);
      }
    } else if (collectionName === "Category") {
      if (data.imagePublicId) await deleteByPublicId(data.imagePublicId);
      else if (data.image) await deleteFromCloudinary(data.image);
    } else if (collectionName === "Slider") {
      if (data.srcPublicId) await deleteByPublicId(data.srcPublicId);
    }
    // Order ইত্যাদির কোনো external asset নেই
  } catch (err) {
    console.error("⚠️ Trash asset cleanup failed:", err);
  }
};

/**
 * ✅ Trash থেকে original collection এ ফিরিয়ে আনে (একই _id সহ)।
 */
export const restoreFromTrashEntry = async (trashEntry) => {
  const Model = MODEL_MAP[trashEntry.collectionName];
  if (!Model) {
    throw new Error(`Unknown collection: ${trashEntry.collectionName}`);
  }

  const data = { ...trashEntry.data };

  const restored = new Model(data);
  restored.isNew = true;
  await restored.save();

  await trashEntry.deleteOne();

  return restored;
};

/**
 * ✅ যেসব trash entry এর expiresAt পার হয়ে গেছে, সেগুলোর asset cleanup করে
 * permanently ডিলিট করে দেয়। server.js থেকে boot এ একবার + প্রতি ঘন্টায় call হয়।
 */
export const purgeExpiredTrash = async () => {
  try {
    const expired = await Trash.find({ expiresAt: { $lte: new Date() } });

    for (const entry of expired) {
      await cleanupTrashAssets(entry.collectionName, entry.data);
      await entry.deleteOne();
    }

    if (expired.length) {
      console.log(
        `🗑️ Trash auto-purge: removed ${expired.length} expired item(s)`,
      );
    }
  } catch (err) {
    console.error("❌ Trash auto-purge failed:", err);
  }
};
