import express from "express";
import About from "../../models/About.js";

const router = express.Router();

// ✅ GET About (Public — /about পেজের জন্য)
// FINAL path: GET /about
router.get("/", async (req, res) => {
  try {
    let about = await About.findOne();
    if (!about) {
      about = await About.create({}); // প্রথমবার হলে default content দিয়ে তৈরি হবে
    }
    res.json(about);
  } catch (err) {
    console.error("❌ Error fetching about:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
