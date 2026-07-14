import express from "express";
import PaymentMethod from "../../models/PaymentMethod.js";

const router = express.Router();

/**
 * @route   GET /api/payment-methods
 * @desc    ✅ Checkout-এ দেখানোর জন্য শুধু active মেথডগুলো
 */
router.get("/", async (req, res) => {
  try {
    const methods = await PaymentMethod.find({ active: true })
      .sort({ order: 1, createdAt: 1 })
      .select("name number accountType actionLabel instructions logo order");

    res.json(methods);
  } catch (err) {
    console.error("❌ Failed to load payment methods:", err);
    res.status(500).json({ error: "Payment methods লোড করা যায়নি।" });
  }
});

export default router;
