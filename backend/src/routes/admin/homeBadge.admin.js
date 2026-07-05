import express from "express";
import HomeBadge from "../../models/HomeBadge.js";

const router = express.Router();

/**
 * ✅ default seed — প্রথমবার হিট করলে ৩টা default badge তৈরি হবে
 * (fresh DB / প্রথমবার ব্যবহার করার জন্য)
 */
const DEFAULTS = [
  { field: "freeDelivery", name: "Free Delivery", icon: "truck", order: 1 },
  { field: "bestDiscount", name: "Best Discount", icon: "bag", order: 2 },
  { field: "cartvanBox", name: "Gift Box", icon: "gift", order: 3 },
];

const ensureSeeded = async () => {
  const count = await HomeBadge.countDocuments();
  if (count > 0) return;

  for (const d of DEFAULTS) {
    try {
      await HomeBadge.create(d);
    } catch {
      // ignore duplicate race
    }
  }
};

/**
 * ✅ GET all badges (admin) — active + inactive সবগুলো
 */
router.get("/", async (req, res) => {
  try {
    await ensureSeeded();
    const badges = await HomeBadge.find().sort({ order: 1, createdAt: 1 });
    res.json({ badges });
  } catch (err) {
    console.error("❌ HomeBadge list error:", err);
    res.status(500).json({ message: "Failed to load badges" });
  }
});

/**
 * ✅ GET available (unused) fields — নতুন badge তৈরির সময় dropdown-এ
 * শুধুমাত্র যেসব field এখনো ব্যবহার হয়নি সেগুলো দেখানোর জন্য
 */
router.get("/available-fields", async (req, res) => {
  try {
    await ensureSeeded();
    const used = await HomeBadge.find().distinct("field");
    const allFields = ["freeDelivery", "bestDiscount", "cartvanBox"];
    const available = allFields.filter((f) => !used.includes(f));
    res.json({ available });
  } catch (err) {
    res.status(500).json({ message: "Failed to load available fields" });
  }
});

/**
 * ✅ CREATE new badge
 * body: { name, field, icon, order }
 */
router.post("/", async (req, res) => {
  try {
    const { name, field, icon, order } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "নাম আবশ্যক (name required)" });
    }

    const allowedFields = ["freeDelivery", "bestDiscount", "cartvanBox"];
    if (!allowedFields.includes(field)) {
      return res.status(400).json({ message: "Invalid field" });
    }

    const exists = await HomeBadge.findOne({ field });
    if (exists) {
      return res.status(400).json({
        message: "এই টাইপের badge আগে থেকেই আছে। আগেরটা delete করে আবার তৈরি করুন।",
      });
    }

    const badge = await HomeBadge.create({
      name: String(name).trim(),
      field,
      icon: icon || "gift",
      order: Number.isFinite(Number(order)) ? Number(order) : 0,
      isActive: true,
    });

    const badges = await HomeBadge.find().sort({ order: 1, createdAt: 1 });
    res.json({ message: "✅ Badge created", badge, badges });
  } catch (err) {
    console.error("❌ HomeBadge create error:", err);
    res.status(500).json({ message: err.message || "Create failed" });
  }
});

/**
 * ✅ UPDATE badge — name / icon / order / isActive এডিট করা যাবে,
 * কিন্তু `field` (technical key) পরিবর্তন করা যাবে না
 */
router.put("/:id", async (req, res) => {
  try {
    const badge = await HomeBadge.findById(req.params.id);
    if (!badge) return res.status(404).json({ message: "Badge not found" });

    const { name, icon, order, isActive } = req.body;

    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({ message: "নাম খালি রাখা যাবে না" });
      }
      badge.name = String(name).trim();
    }

    if (icon !== undefined) badge.icon = icon;
    if (order !== undefined) badge.order = Number(order) || 0;
    if (isActive !== undefined) badge.isActive = !!isActive;

    await badge.save();

    const badges = await HomeBadge.find().sort({ order: 1, createdAt: 1 });
    res.json({ message: "✅ Badge updated", badge, badges });
  } catch (err) {
    console.error("❌ HomeBadge update error:", err);
    res.status(500).json({ message: err.message || "Update failed" });
  }
});

/**
 * ✅ DELETE badge
 */
router.delete("/:id", async (req, res) => {
  try {
    const badge = await HomeBadge.findById(req.params.id);
    if (!badge) return res.status(404).json({ message: "Badge not found" });

    await badge.deleteOne();

    const badges = await HomeBadge.find().sort({ order: 1, createdAt: 1 });
    res.json({ message: "✅ Badge deleted", badges });
  } catch (err) {
    console.error("❌ HomeBadge delete error:", err);
    res.status(500).json({ message: "Delete failed" });
  }
});

export default router;
