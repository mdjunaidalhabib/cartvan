import express from "express";
import HomepagePopup from "../../models/HomepagePopup.js";

const router = express.Router();

// ✅ GET — Public
// FINAL path: GET /api/v1/homepage-popup
router.get("/", async (req, res) => {
  try {
    const data = await HomepagePopup.findOne();
    res.json(data || { image: "", enabled: false });
  } catch (err) {
    console.error("❌ Error fetching homepage popup:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
