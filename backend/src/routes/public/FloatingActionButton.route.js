import express from "express";
import FloatingActionButton from "../../models/FloatingActionButton.js";

const router = express.Router();

// ✅ GET — Public
// FINAL path: GET /api/v1/contact-button
router.get("/", async (req, res) => {
  try {
    const data = await FloatingActionButton.findOne();
    res.json(data || { phone: "", whatsapp: "", messenger: "", enabled: true });
  } catch (err) {
    console.error("❌ Error fetching contact button:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
