import Trash from "../../src/models/Trash.js";
import {
  restoreFromTrashEntry,
  cleanupTrashAssets,
} from "../../utils/trash/trash.helpers.js";

/* ================== GET trash list ================== */
export const getTrashList = async (req, res) => {
  try {
    const { type } = req.query; // optional: Product | Category | Slider | Order
    const filter = type ? { collectionName: type } : {};

    const items = await Trash.find(filter).sort({ deletedAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err?.message || "Server error" });
  }
};

/* ================== RESTORE single item ================== */
export const restoreTrashItem = async (req, res) => {
  try {
    const entry = await Trash.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: "Trash item not found" });

    const restored = await restoreFromTrashEntry(entry);

    res.json({ message: "✅ Restored successfully", item: restored });
  } catch (err) {
    console.error("❌ Restore error:", err);
    res.status(500).json({ error: err?.message || "Server error" });
  }
};

/* ================== PERMANENTLY DELETE single item ================== */
export const permanentDeleteTrashItem = async (req, res) => {
  try {
    const entry = await Trash.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: "Trash item not found" });

    await cleanupTrashAssets(entry.collectionName, entry.data);
    await entry.deleteOne();

    res.json({ message: "🗑️ Permanently deleted" });
  } catch (err) {
    res.status(500).json({ error: err?.message || "Server error" });
  }
};

/* ================== EMPTY ALL TRASH ================== */
export const emptyTrash = async (req, res) => {
  try {
    const items = await Trash.find();

    for (const entry of items) {
      await cleanupTrashAssets(entry.collectionName, entry.data);
    }

    await Trash.deleteMany({});

    res.json({ message: `🗑️ Trash emptied (${items.length} item(s) removed)` });
  } catch (err) {
    res.status(500).json({ error: err?.message || "Server error" });
  }
};
