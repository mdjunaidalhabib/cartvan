import express from "express";
import HomeBadge from "../../models/HomeBadge.js";

const router = express.Router();

/**
 * ✅ Public — শুধুমাত্র active badge গুলো, order অনুযায়ী sorted
 * (হোমপেজে স্লাইডারের নিচে দেখানোর জন্য)
 */
router.get("/", async (req, res) => {
  try {
    const badges = await HomeBadge.find({ isActive: true }).sort({
      order: 1,
      createdAt: 1,
    });
    res.json({ badges });
  } catch (err) {
    console.error("❌ Public HomeBadge fetch error:", err);
    res.status(500).json({ message: "Failed to load badges" });
  }
});

export default router;
