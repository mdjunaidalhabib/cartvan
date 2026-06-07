import express from "express";
import FloatingActionButton from "../../models/FloatingActionButton.js";

const router = express.Router();

// ✅ GET — Admin (settings page load এ দরকার)
// FINAL path: GET /api/v1/admin/contact-button
router.get("/", async (req, res) => {
  try {
    const data = await FloatingActionButton.findOne();
    res.json(data || { phone: "", whatsapp: "", messenger: "", enabled: true });
  } catch (err) {
    console.error("❌ Error fetching contact button:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ POST — Admin update
// FINAL path: POST /api/v1/admin/contact-button
router.post("/", async (req, res) => {
  try {
    const { phone, whatsapp, messenger, enabled } = req.body;

    const existing = await FloatingActionButton.findOne();

    const updateData = {
      phone:     phone     ?? existing?.phone     ?? "",
      whatsapp:  whatsapp  ?? existing?.whatsapp  ?? "",
      messenger: messenger ?? existing?.messenger ?? "",
      enabled:   enabled !== undefined ? enabled : (existing?.enabled ?? true),
      updatedAt: new Date(),
    };

    let updated;
    if (!existing) {
      updated = await FloatingActionButton.create(updateData);
    } else {
      Object.assign(existing, updateData);
      updated = await existing.save();
    }

    res.json({ message: "✅ Contact button updated", data: updated });
  } catch (err) {
    console.error("❌ Error updating contact button:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
