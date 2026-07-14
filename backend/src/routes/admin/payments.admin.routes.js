import express from "express";
import PaymentMethod from "../../models/PaymentMethod.js";
import Order from "../../models/Order.js";
import { restockOrderItems } from "../../utils/inventory/restock.js";

const router = express.Router();

/* =====================================================
   ✅ PAYMENT METHODS CRUD (bKash / Nagad / Rocket etc.)
===================================================== */

// GET all methods (admin sees active + inactive both)
router.get("/methods", async (req, res) => {
  try {
    const methods = await PaymentMethod.find().sort({ order: 1, createdAt: 1 });
    res.json(methods);
  } catch (err) {
    console.error("❌ Failed to load payment methods:", err);
    res.status(500).json({ error: "Failed to load payment methods" });
  }
});

// CREATE new method
router.post("/methods", async (req, res) => {
  try {
    const { name, number, accountType, actionLabel, instructions, logo, active, order } =
      req.body;

    if (!name?.trim() || !number?.trim()) {
      return res
        .status(400)
        .json({ error: "Method name ও number আবশ্যক (required)" });
    }

    const created = await PaymentMethod.create({
      name: name.trim(),
      number: number.trim(),
      accountType: accountType || "personal",
      actionLabel: actionLabel?.trim() || "Send Money",
      instructions: instructions || "",
      logo: logo || "",
      active: active !== undefined ? !!active : true,
      order: Number.isFinite(Number(order)) ? Number(order) : 0,
    });

    res.status(201).json(created);
  } catch (err) {
    console.error("❌ Failed to create payment method:", err);
    res.status(500).json({ error: "Failed to create payment method" });
  }
});

// UPDATE method
router.put("/methods/:id", async (req, res) => {
  try {
    const { name, number, accountType, actionLabel, instructions, logo, active, order } =
      req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (number !== undefined) updateData.number = number.trim();
    if (accountType !== undefined) updateData.accountType = accountType;
    if (actionLabel !== undefined) updateData.actionLabel = actionLabel.trim();
    if (instructions !== undefined) updateData.instructions = instructions;
    if (logo !== undefined) updateData.logo = logo;
    if (active !== undefined) updateData.active = !!active;
    if (order !== undefined) updateData.order = Number(order) || 0;

    const updated = await PaymentMethod.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true },
    );

    if (!updated) {
      return res.status(404).json({ error: "Payment method পাওয়া যায়নি" });
    }

    res.json(updated);
  } catch (err) {
    console.error("❌ Failed to update payment method:", err);
    res.status(500).json({ error: "Failed to update payment method" });
  }
});

// DELETE method
router.delete("/methods/:id", async (req, res) => {
  try {
    const deleted = await PaymentMethod.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Payment method পাওয়া যায়নি" });
    }
    res.json({ message: "Payment method deleted" });
  } catch (err) {
    console.error("❌ Failed to delete payment method:", err);
    res.status(500).json({ error: "Failed to delete payment method" });
  }
});

/* =====================================================
   ✅ MANUAL PAYMENT VERIFICATION QUEUE
   Orders paid via bKash/Nagad/etc. (not COD) that are
   still "pending" need admin to check the sender number
   + TrxID against their own mobile banking app.
===================================================== */

// GET all orders awaiting verification (paymentMethod != cod, paymentStatus = pending)
router.get("/pending", async (req, res) => {
  try {
    const orders = await Order.find({
      paymentMethod: { $ne: "cod" },
      paymentStatus: "pending",
    })
      .sort({ createdAt: -1 })
      .select(
        "orderNumber billing total paymentMethod paymentDetails createdAt status",
      );

    res.json(orders);
  } catch (err) {
    console.error("❌ Failed to load pending payments:", err);
    res.status(500).json({ error: "Failed to load pending payments" });
  }
});

// PATCH verify/reject a single order's payment
router.patch("/:orderId/verify", async (req, res) => {
  try {
    const { paymentStatus } = req.body;

    if (!["paid", "failed", "pending"].includes(paymentStatus)) {
      return res.status(400).json({ error: "Invalid paymentStatus" });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: "Order পাওয়া যায়নি" });
    }

    order.paymentStatus = paymentStatus;

    // ✅ Payment reject হলে অর্ডার আর কখনো process/accept করা যাবে না —
    // (already delivered/cancelled না হলে) সাথে সাথে order cancel করে
    // stock ফেরত দেওয়া হচ্ছে, চাই সেটা এখনো pending থাকুক বা admin
    // ইতিমধ্যে processing-এ পাঠিয়ে থাকুক।
    if (
      paymentStatus === "failed" &&
      !["delivered", "cancelled"].includes(order.status)
    ) {
      order.status = "cancelled";
      order.cancelReason = "Payment verification ব্যর্থ (Admin কর্তৃক reject করা হয়েছে)";

      try {
        await restockOrderItems(order.items);
      } catch (restockErr) {
        console.error("❌ Restock on payment-reject failed:", restockErr);
      }
    }

    await order.save();

    res.json(order);
  } catch (err) {
    console.error("❌ Failed to update payment status:", err);
    res.status(500).json({ error: "Failed to update payment status" });
  }
});

export default router;
