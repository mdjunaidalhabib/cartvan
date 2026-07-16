import express from "express";
import PaymentMethod from "../../models/PaymentMethod.js";
import Order from "../../models/Order.js";
import { restockOrderItems } from "../../utils/inventory/restock.js";
import { moveToTrash } from "../../../utils/trash/trash.helpers.js";
import {
  invalidateInvoiceCache,
  regenerateInvoiceInBackground,
} from "../../utils/invoice/invoiceService.js";

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
    const method = await PaymentMethod.findById(req.params.id);
    if (!method) {
      return res.status(404).json({ error: "Payment method পাওয়া যায়নি" });
    }

    // ✅ hard-delete এর বদলে Trash এ move — অন্যান্য (Product/Category/Slider/Order)
    // এর মতোই এখান থেকেও Restore করা যাবে বা কিছুদিন পর auto-purge হবে।
    await moveToTrash("PaymentMethod", method);

    res.json({ message: "✅ Payment method Trash-এ পাঠানো হয়েছে" });
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
        "orderNumber billing total deliveryCharge paymentMethod paymentDetails createdAt status",
      );

    res.json(orders);
  } catch (err) {
    console.error("❌ Failed to load pending payments:", err);
    res.status(500).json({ error: "Failed to load pending payments" });
  }
});

// GET already-verified orders (paymentMethod != cod, paymentStatus = paid/failed)
// so admin can still look up the TrxID (e.g. for accounting / dispute) after
// accepting/rejecting it — the "pending" list stops showing it once verified.
router.get("/verified", async (req, res) => {
  try {
    const { paymentStatus, hidden } = req.query; // hidden="true" -> show only removed/hidden ones

    const filter = {
      paymentMethod: { $ne: "cod" },
      paymentStatus: ["paid", "failed"].includes(paymentStatus)
        ? paymentStatus
        : { $in: ["paid", "failed"] },
      // ✅ default view: hide করা orders বাদে সব দেখাও
      // ?hidden=true দিলে শুধু hide করা orders দেখাবে, যাতে দরকার হলে Restore করা যায়
      hiddenFromPaymentsView: hidden === "true" ? true : { $ne: true },
    };

    const orders = await Order.find(filter)
      .sort({ updatedAt: -1 })
      .limit(200)
      .select(
        "orderNumber billing total deliveryCharge paymentMethod paymentStatus paymentDetails createdAt updatedAt status cancelReason",
      );

    res.json(orders);
  } catch (err) {
    console.error("❌ Failed to load verified payments:", err);
    res.status(500).json({ error: "Failed to load verified payments" });
  }
});

// PATCH — Remove from (hide) or Restore back to the Verified/TrxID view.
// Order কখনোই delete/trash হয় না, শুধু এই flag টা টগল হয়।
router.patch("/verified/:orderId/visibility", async (req, res) => {
  try {
    const { hidden } = req.body; // true = remove from view, false = restore

    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { hiddenFromPaymentsView: !!hidden },
      { new: true },
    ).select("_id hiddenFromPaymentsView");

    if (!order) {
      return res.status(404).json({ error: "Order পাওয়া যায়নি" });
    }

    res.json({
      message: hidden
        ? "✅ Payments history থেকে সরানো হয়েছে"
        : "✅ Payments history-তে ফিরিয়ে আনা হয়েছে",
      order,
    });
  } catch (err) {
    console.error("❌ Failed to update payment view visibility:", err);
    res.status(500).json({ error: "Failed to update visibility" });
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

    // ✅ Payment accept (paid) হলে — order যেহেতু এতক্ষণ payment verification
    // এর জন্য "pending" এ hold হয়ে ছিল, এখন সেটা automatically পরের
    // step ("ready_to_delivery") এ চলে যাবে, admin কে আলাদা করে status
    // আপডেট করতে হবে না।
    if (paymentStatus === "paid" && order.status === "pending") {
      order.status = "ready_to_delivery";
    }

    await order.save();

    await invalidateInvoiceCache(order._id);
    regenerateInvoiceInBackground(order._id);

    res.json(order);
  } catch (err) {
    console.error("❌ Failed to update payment status:", err);
    res.status(500).json({ error: "Failed to update payment status" });
  }
});

export default router;
