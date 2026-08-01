import express from "express";
import Support from "../../models/Support.js";
import Footer from "../../models/Footer.js";

const router = express.Router();

// ✅ GET Support (Public — /support পেজের জন্য)
// FINAL path: GET /support
router.get("/", async (req, res) => {
  try {
    let support = await Support.findOne();
    if (!support) {
      // প্রথমবার তৈরি হলে ফুটারের কন্টাক্ট তথ্য (phone/email) থেকে শুরুর মান নেওয়া হয়
      const footer = await Footer.findOne();
      support = await Support.create({
        supportEmail: footer?.contact?.email || "",
        supportPhone: footer?.contact?.phone || "",
      });
    }
    res.json(support);
  } catch (err) {
    console.error("❌ Error fetching support:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
