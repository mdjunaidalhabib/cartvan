import mongoose from "mongoose";

/**
 * ✅ Generic Trash / Recycle Bin
 * Any deletable item (Product, Category, Slider, Order, ...) gets moved
 * here instead of being hard-deleted. Items can be restored, permanently
 * deleted manually, or auto-purged after TRASH_TTL_DAYS (see trash.helpers.js).
 */
const trashSchema = new mongoose.Schema(
  {
    // Which model/collection this item originally belonged to
    collectionName: { type: String, required: true, index: true },

    // The original document's _id (kept so it can be restored with the same id)
    originalId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    // Human readable name shown in the trash list UI
    label: { type: String, default: "" },

    // The full original document, stored as-is
    data: { type: mongoose.Schema.Types.Mixed, required: true },

    deletedAt: { type: Date, default: Date.now },

    // When this trash entry should be auto-purged (permanently deleted)
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true },
);

export default mongoose.models.Trash || mongoose.model("Trash", trashSchema);
