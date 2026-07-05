import express from "express";
import FacebookGroup from "../../models/FacebookGroup.js";

const router = express.Router();

// ✅ GET — Admin (settings page load এ দরকার)
// FINAL path: GET /api/v1/admin/facebook-group
router.get("/", async (req, res) => {
  try {
    let data = await FacebookGroup.findOne();
    if (!data) {
      data = await FacebookGroup.create({});
    }
    res.json(data);
  } catch (err) {
    console.error("❌ Error fetching facebook group settings:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ POST — Admin update
// FINAL path: POST /api/v1/admin/facebook-group
router.post("/", async (req, res) => {
  try {
    const { name, link, enabled } = req.body;

    const existing = await FacebookGroup.findOne();

    const updateData = {
      name: name !== undefined ? String(name).trim() : (existing?.name ?? "Cartvan Family"),
      link: link !== undefined ? String(link).trim() : (existing?.link ?? ""),
      enabled: enabled !== undefined ? !!enabled : (existing?.enabled ?? true),
    };

    let updated;
    if (!existing) {
      updated = await FacebookGroup.create(updateData);
    } else {
      Object.assign(existing, updateData);
      updated = await existing.save();
    }

    res.json({ message: "✅ Facebook group settings updated", data: updated });
  } catch (err) {
    console.error("❌ Error updating facebook group settings:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
