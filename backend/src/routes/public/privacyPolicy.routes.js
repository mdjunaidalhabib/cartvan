import express from "express";
import PrivacyPolicy from "../../models/PrivacyPolicy.js";

const router = express.Router();

// ✅ GET Privacy Policy (Public — /privacy-policy পেজের জন্য)
// FINAL path: GET /privacy-policy
router.get("/", async (req, res) => {
  try {
    let policy = await PrivacyPolicy.findOne();
    if (!policy) {
      policy = await PrivacyPolicy.create({}); // প্রথমবার হলে default content দিয়ে তৈরি হবে
    }
    res.json(policy);
  } catch (err) {
    console.error("❌ Error fetching privacy policy:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
