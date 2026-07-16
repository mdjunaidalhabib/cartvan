import express from "express";
import DeliveryCharge from "../../models/DeliveryCharge.js";

const router = express.Router();

// ✅ Public Read (Checkout ব্যবহার করবে)
router.get("/", async (req, res) => {
  try {
    let data = await DeliveryCharge.findOne();

    // যদি DB তে না থাকে, auto create
    if (!data) data = await DeliveryCharge.create({ fee: 120 });

    res.json({ fee: data.fee, label: data.label });
  } catch (err) {
    res.status(500).json({ error: "Failed to load delivery fee" });
  }
});

export default router;
