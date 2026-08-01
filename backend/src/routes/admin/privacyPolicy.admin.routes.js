import express from "express";
import PrivacyPolicy from "../../models/PrivacyPolicy.js";

const router = express.Router();

// ✅ GET Privacy Policy (Admin — editing form এর জন্য)
// FINAL path: GET /admin/privacy-policy
router.get("/", async (req, res) => {
  try {
    let policy = await PrivacyPolicy.findOne();
    if (!policy) {
      policy = await PrivacyPolicy.create({}); // schema default গুলো দিয়ে তৈরি হবে
    }
    res.json(policy);
  } catch (err) {
    console.error("❌ Error fetching privacy policy (admin):", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ CREATE/UPDATE Privacy Policy (Admin only)
// FINAL path: POST /admin/privacy-policy
router.post("/", async (req, res) => {
  try {
    const data = { ...req.body };
    delete data._id;
    delete data.__v;

    data.updatedAt = new Date();

    const policy = await PrivacyPolicy.findOneAndUpdate(
      {},
      { $set: data },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    res.json({
      message: "✅ Privacy Policy page updated successfully",
      policy,
    });
  } catch (err) {
    console.error("❌ Error updating privacy policy:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// ✅ RESET Privacy Policy to default (Admin only)
// FINAL path: DELETE /admin/privacy-policy
router.delete("/", async (req, res) => {
  try {
    await PrivacyPolicy.deleteMany({});
    const policy = await PrivacyPolicy.create({}); // নতুন default document
    res.json({ message: "🔄 Privacy Policy page reset to default", policy });
  } catch (err) {
    console.error("❌ Error resetting privacy policy:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
