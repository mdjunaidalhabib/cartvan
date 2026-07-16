import express from "express";
import Order from "../../models/Order.js";
import { moveToTrash } from "../../../utils/trash/trash.helpers.js";
import {
  regenerateInvoiceInBackground,
  invalidateInvoiceCache,
} from "../../utils/invoice/invoiceService.js";

const router = express.Router();

/**
 * ================================
 * STATUS FLOW (SINGLE SOURCE)
 * ================================
 */
const STATUS_FLOW = {
  pending: ["ready_to_delivery", "cancelled"],
  ready_to_delivery: ["send_to_courier", "cancelled"],
  send_to_courier: ["delivered"],
  delivered: [],
  cancelled: [],
};

/**
 * ================================
 * 🔒 PAYMENT VERIFICATION HOLD
 * ================================
 * Manual/mobile-banking payments (bKash/Nagad/etc.) must be verified
 * (accepted or rejected) by admin from the Payments > Pending queue
 * before the order is allowed to move forward in the status flow.
 * COD orders are exempt — cash is collected on delivery, so payment
 * is naturally settled later and shouldn't block dispatch.
 */
function needsPaymentVerification(order) {
  return (
    order?.paymentMethod &&
    order.paymentMethod !== "cod" &&
    order.paymentStatus === "pending"
  );
}

const PAYMENT_HOLD_MESSAGE =
  "এই অর্ডারের Payment এখনো verify করা হয়নি। Payments > Pending Verification থেকে আগে Accept/Reject করুন, তারপর order status পরিবর্তন করা যাবে।";

/**
 * ================================
 * GET all orders
 * ================================
 */
/**
 * ================================
 * ✅ CREATE order (ADMIN)
 * POST /admin/orders
 * ================================
 */
import Product from "../../models/Product.js"; // ✅ add (আপনার product model path ঠিক করে দিবেন)

router.post("/", async (req, res) => {
  try {
    const {
      items = [],
      deliveryCharge = 120,
      discount = 0,
      billing = {},
      promoCode = null,
      userId = null,

      paymentMethod = "cod",
      paymentStatus = "pending",
      status = "pending",

      // ✅ NEW: createdBy fields
      createdBy = "admin",
      createdByName = "Admin",
      createdById = null,
    } = req.body;

    // ✅ Validate billing
    if (
      !billing?.name?.trim() ||
      !billing?.phone?.trim() ||
      !billing?.address?.trim()
    ) {
      return res
        .status(400)
        .json({ error: "Billing name, phone & address are required" });
    }

    // ✅ Validate items basic
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "At least 1 item is required" });
    }

    // ✅ Resolve products from DB (safe)
    const productIds = items.map((it) => String(it.productId));
    const products = await Product.find({ _id: { $in: productIds } });

    const productMap = new Map();
    products.forEach((p) => productMap.set(String(p._id), p));

    const finalItems = [];
    let subtotal = 0;

    for (const it of items) {
      const pid = String(it.productId || "");
      const qty = Number(it.qty || 0);
      const color = it.color ? String(it.color) : null;

      if (!pid || qty <= 0) continue;

      const p = productMap.get(pid);
      if (!p) continue;

      // ✅ color variant match
      const variant =
        color && Array.isArray(p.colors)
          ? p.colors.find(
              (c) =>
                String(c?.name || "")
                  .trim()
                  .toLowerCase() === String(color).trim().toLowerCase()
            )
          : null;

      const price = Number(p.price || 0);
      const name = p.name || "Product";
      const image =
        variant?.images?.[0] ||
        p.image ||
        (Array.isArray(p.images) ? p.images[0] : null) ||
        null;

      subtotal += price * qty;

      finalItems.push({
        productId: pid,
        name,
        price,
        qty,
        image,
        color: variant?.name || color || null,
        stock: variant?.stock ?? p.stock ?? 0,
      });
    }

    if (!finalItems.length) {
      return res.status(400).json({ error: "No valid items found" });
    }

    const total = Math.max(
      0,
      Number(subtotal) + Number(deliveryCharge || 0) - Number(discount || 0)
    );

    const created = await Order.create({
      items: finalItems,
      subtotal,
      deliveryCharge,
      discount,
      total,

      billing: {
        name: billing.name.trim(),
        phone: billing.phone.trim(),
        address: billing.address.trim(),
        note: billing.note?.trim() || "",
      },

      promoCode,
      userId,
      paymentMethod,
      paymentStatus,
      status,

      // ✅ IMPORTANT: Save createdBy
      createdBy,
      createdByName,
      createdById,
    });

    // ✅ Pre-generate the invoice PDF in the background so it's ready
    // instantly whenever it's downloaded later.
    regenerateInvoiceInBackground(created._id);

    res.status(201).json(created);
  } catch (err) {
    console.error("❌ Failed to create order:", err);
    res.status(400).json({
      error: "Failed to create order",
      details: err.message,
    });
  }
});


router.get("/", async (req, res) => {
  try {
    const filter = {};

    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("❌ Failed to fetch orders:", err);
    res.status(500).json({
      error: "Failed to fetch orders",
      details: err.message,
    });
  }
});

/**
 * ================================
 * 🔥 BULK STATUS UPDATE (ADMIN)
 * ================================
 * body: { ids: [], status, cancelReason? }
 */
router.put("/bulk/status", async (req, res) => {
  try {
    const { ids, status, cancelReason } = req.body;

    if (!Array.isArray(ids) || !status) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const orders = await Order.find({ _id: { $in: ids } });

    const result = {
      updated: [],
      skipped: [],
      paymentHold: [],
      errors: [],
    };

    for (const o of orders) {
      try {
        if (["delivered", "cancelled"].includes(o.status)) {
          result.skipped.push(o._id);
          continue;
        }

        // 🔒 Payment not verified yet — hold, unless admin is cancelling
        if (needsPaymentVerification(o) && status !== "cancelled") {
          result.paymentHold.push(o._id);
          continue;
        }

        const allowedNext = STATUS_FLOW[o.status] || [];
        if (!allowedNext.includes(status)) {
          result.skipped.push(o._id);
          continue;
        }

        const update = { status };

        if (status === "cancelled") {
          update.cancelReason = cancelReason?.trim() || "Cancelled by admin";
        }

        const updated = await Order.findByIdAndUpdate(o._id, update, {
          new: true,
        });

        result.updated.push(updated._id);
      } catch (e) {
        result.errors.push({ id: o._id, error: e.message });
      }
    }

    if (result.paymentHold.length && !result.updated.length) {
      return res.status(400).json({
        ...result,
        error: `${result.paymentHold.length} টি অর্ডারের Payment এখনো verify করা হয়নি। Payments > Pending Verification থেকে আগে Accept/Reject করুন।`,
      });
    }

    res.json(result);
  } catch (err) {
    console.error("❌ Bulk status update failed:", err);
    res.status(500).json({
      error: "Bulk update failed",
      details: err.message,
    });
  }
});

/**
 * ================================
 * 🔥 BULK DELETE (ADMIN)
 * ================================
 * body: { ids: [] }
 */
router.post("/bulk/delete", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    // ✅ hard-delete এর বদলে Trash এ move — 3 দিন পর auto-purge হবে
    const orders = await Order.find({ _id: { $in: ids } });
    for (const o of orders) {
      await moveToTrash("Order", o);
    }

    res.json({ deletedCount: orders.length });
  } catch (err) {
    console.error("❌ Bulk delete failed:", err);
    res.status(500).json({
      error: "Bulk delete failed",
      details: err.message,
    });
  }
});

/**
 * ================================
 * GET single order
 * ================================
 */
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    res.json(order);
  } catch (err) {
    console.error("❌ Error fetching order:", err);
    res.status(500).json({
      error: "Failed to fetch order",
      details: err.message,
    });
  }
});

/**
 * ================================
 * UPDATE order (ADMIN)
 * ================================
 */
router.put("/:id", async (req, res) => {
  try {
    const current = await Order.findById(req.params.id);
    if (!current) return res.status(404).json({ error: "Order not found" });

    const updateData = {};

    if (req.body.status !== undefined) updateData.status = req.body.status;

    if (req.body.trackingId !== undefined)
      updateData.trackingId = req.body.trackingId;

    if (req.body.paymentMethod !== undefined)
      updateData.paymentMethod = req.body.paymentMethod;

    if (
      req.body.paymentStatus !== undefined &&
      ["pending", "paid", "failed"].includes(req.body.paymentStatus)
    )
      updateData.paymentStatus = req.body.paymentStatus;

    if (req.body.cancelReason !== undefined)
      updateData.cancelReason = req.body.cancelReason;

    // ✅ DISCOUNT UPDATE + TOTAL RECALC
    if (req.body.discount !== undefined) {
      let discount = Number(req.body.discount);

      if (isNaN(discount) || discount < 0) discount = 0;

      const subtotal = Number(current.subtotal || 0);
      const delivery = Number(current.deliveryCharge || 0);

      const maxAllowedDiscount = subtotal + delivery;
      if (discount > maxAllowedDiscount) discount = maxAllowedDiscount;

      updateData.discount = discount;
      updateData.total = subtotal + delivery - discount;
    }

    if (req.body.billing) {
      updateData.billing = {
        name: req.body.billing.name?.trim()
          ? req.body.billing.name
          : current.billing?.name,
        phone: req.body.billing.phone?.trim()
          ? req.body.billing.phone
          : current.billing?.phone,
        address: req.body.billing.address?.trim()
          ? req.body.billing.address
          : current.billing?.address,
        note: req.body.billing.note?.trim()
          ? req.body.billing.note
          : current.billing?.note,
      };
    }

    if (
      updateData.status !== undefined &&
      updateData.status !== current.status
    ) {
      // 🔒 Hold: payment not verified yet — block status advance
      // (cancelling is still allowed since it doesn't need payment to be confirmed)
      if (
        needsPaymentVerification(current) &&
        updateData.status !== "cancelled"
      ) {
        return res.status(400).json({
          error: PAYMENT_HOLD_MESSAGE,
          code: "PAYMENT_VERIFICATION_REQUIRED",
        });
      }

      const allowedNext = STATUS_FLOW[current.status] || [];
      if (!allowedNext.includes(updateData.status)) {
        return res.status(400).json({
          error: `Invalid status change: ${current.status} → ${updateData.status}`,
        });
      }
    }

    if (
      ["delivered", "cancelled"].includes(current.status) &&
      Object.keys(updateData).some((k) => k !== "status")
    ) {
      return res.status(400).json({
        error: "Delivered or cancelled order cannot be edited",
      });
    }

    if (updateData.status === "cancelled") {
      if (!updateData.cancelReason?.trim()) {
        updateData.cancelReason = "Cancelled by admin";
      }
    }

    const updated = await Order.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    // ✅ Invoice-visible fields changed -> old cached PDF is stale.
    // Wipe it and rebuild in the background so downloads stay instant.
    const invoiceAffectingFields = [
      "billing",
      "discount",
      "total",
      "paymentStatus",
      "paymentMethod",
    ];
    if (invoiceAffectingFields.some((k) => updateData[k] !== undefined)) {
      await invalidateInvoiceCache(updated._id);
      regenerateInvoiceInBackground(updated._id);
    }

    res.json(updated);
  } catch (err) {
    console.error("❌ Failed to update order:", err);
    res.status(400).json({
      error: "Failed to update order",
      details: err.message,
    });
  }
});


/**
 * ================================
 * DELETE order (ADMIN)
 * ================================
 */
router.delete("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // ✅ hard-delete এর বদলে Trash এ move — 3 দিন পর auto-purge হবে,
    // এর মাঝে Trash থেকে restore করা যাবে।
    await moveToTrash("Order", order);

    res.json({ message: "Order moved to Trash" });
  } catch (err) {
    console.error("❌ Failed to delete order:", err);
    res.status(500).json({
      error: "Failed to delete order",
      details: err.message,
    });
  }
});

export default router;
