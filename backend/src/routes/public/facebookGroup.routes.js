import express from "express";
import FacebookGroup from "../../models/FacebookGroup.js";

const router = express.Router();

// ✅ GET — Public
// FINAL path: GET /api/v1/facebook-group
router.get("/", async (req, res) => {
  try {
    const data = await FacebookGroup.findOne();
    res.json(data || { name: "Cartvan Family", link: "", enabled: true });
  } catch (err) {
    console.error("❌ Error fetching facebook group settings:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
