import express from "express";
import DeliveryCharge from "../../models/DeliveryCharge.js";

const router = express.Router();

// ✅ Admin Read
router.get("/", async (req, res) => {
  try {
    let data = await DeliveryCharge.findOne();
    if (!data) data = await DeliveryCharge.create({ fee: 120 });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to load delivery fee" });
  }
});

// ✅ Admin Update
router.patch("/", async (req, res) => {
  try {
    const { fee, label } = req.body;

    if (fee !== undefined && !Number.isFinite(Number(fee))) {
      return res.status(400).json({ error: "Invalid fee" });
    }

    if (label !== undefined && !String(label).trim()) {
      return res.status(400).json({ error: "Label খালি রাখা যাবে না" });
    }

    let data = await DeliveryCharge.findOne();
    if (!data) data = await DeliveryCharge.create({ fee: 120 });

    if (fee !== undefined) data.fee = Number(fee);
    if (label !== undefined) data.label = String(label).trim();
    await data.save();

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to update delivery fee" });
  }
});

export default router;
