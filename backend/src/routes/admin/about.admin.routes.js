import express from "express";
import About from "../../models/About.js";

const router = express.Router();

// ✅ GET About (Admin — editing form এর জন্য)
// FINAL path: GET /admin/about
router.get("/", async (req, res) => {
  try {
    let about = await About.findOne();
    if (!about) {
      about = await About.create({}); // schema default গুলো দিয়ে তৈরি হবে
    }
    res.json(about);
  } catch (err) {
    console.error("❌ Error fetching about (admin):", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ CREATE/UPDATE About (Admin only)
// FINAL path: POST /admin/about
router.post("/", async (req, res) => {
  try {
    const data = { ...req.body };
    delete data._id;
    delete data.__v;

    data.updatedAt = new Date();

    const about = await About.findOneAndUpdate(
      {},
      { $set: data },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    res.json({
      message: "✅ About page updated successfully",
      about,
    });
  } catch (err) {
    console.error("❌ Error updating about:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// ✅ RESET About to default (Admin only)
// FINAL path: DELETE /admin/about
router.delete("/", async (req, res) => {
  try {
    await About.deleteMany({});
    const about = await About.create({}); // নতুন default document
    res.json({ message: "🔄 About page reset to default", about });
  } catch (err) {
    console.error("❌ Error resetting about:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
