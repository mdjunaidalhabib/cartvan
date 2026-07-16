import express from "express";
import CourierSetting from "../../models/CourierSetting.js";
import Order from "../../models/Order.js";

const router = express.Router();

/* ======================================================
   🪵 DEBUG LOGGER
====================================================== */
router.use((req, res, next) => {
  console.log("🚚 STEADFAST ROUTE HIT:", req.method, req.originalUrl);
  next();
});

/* ======================================================
   🔑 Helper: Get active courier config
====================================================== */
async function getActiveCourier(courier = "steadfast") {
  const setting = await CourierSetting.findOne({
    courier,
    isActive: true,
  }).lean();

  if (!setting) {
    const err = new Error("Courier setting not found or inactive");
    err.code = "COURIER_NOT_CONFIGURED";
    throw err;
  }

  if (!setting.apiKey || !setting.secretKey) {
    const err = new Error("Courier apiKey/secretKey missing in DB");
    err.code = "COURIER_KEYS_MISSING";
    throw err;
  }

  console.log("✅ Active courier found:", setting.courier);
  return setting;
}

/* ======================================================
   🧰 Helper: Safe parse JSON
====================================================== */
function safeJsonParse(raw) {
  try {
    return { ok: true, data: JSON.parse(raw) };
  } catch (e) {
    return { ok: false, error: e };
  }
}

/* ======================================================
   🚚 SINGLE ORDER → Steadfast
   POST /admin/api/send-order
====================================================== */
router.post("/send-order", async (req, res) => {
  const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  console.log("📥 STEADFAST SEND ORDER HIT, requestId:", requestId);

  try {
    const {
      invoice,
      name,
      phone,
      address,
      note,
      item_description,
    } = req.body || {};

    if (!invoice || !name || !phone || !address) {
      return res.status(400).json({
        ok: false,
        requestId,
        error: "invoice, name, phone, address are required",
      });
    }

    const order = await Order.findById(invoice);
    if (!order) {
      return res.status(404).json({
        ok: false,
        requestId,
        error: "Order not found",
      });
    }

    // ✅ COD amount is always computed server-side from the order itself —
    // never trust a client-supplied value here. If the delivery charge was
    // already collected online (bKash/Nagad, verified/paid), the courier
    // should only collect the remaining product amount, otherwise the
    // customer gets charged for delivery twice.
    const isManualPayment = (order.paymentMethod || "cod") !== "cod";
    const isAdvancePaid = isManualPayment && order.paymentStatus === "paid";
    const codAmount = isAdvancePaid
      ? Math.max(0, Number(order.total || 0) - Number(order.deliveryCharge || 0))
      : Number(order.total || 0);

    const courier = await getActiveCourier("steadfast");

    const baseUrl = process.env.STEADFAST_BASE_URL;
    if (!baseUrl || !/^https?:\/\//i.test(baseUrl)) {
      return res.status(500).json({
        ok: false,
        requestId,
        error: "STEADFAST_BASE_URL invalid",
      });
    }

    const url = `${baseUrl.replace(/\/+$/, "")}/create_order`;

    const payload = {
      invoice: String(order._id),
      recipient_name: name,
      recipient_phone: phone,
      recipient_address: address,
      cod_amount: codAmount,
      delivery_type: 0,
      note: note || "",
      item_description: item_description || "",
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Api-Key": courier.apiKey,
        "Secret-Key": courier.secretKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const raw = await resp.text();
    const parsed = safeJsonParse(raw);
    const data = parsed.ok ? parsed.data : null;

    if (!resp.ok || data?.status !== 200) {
      return res.status(502).json({
        ok: false,
        requestId,
        error: data?.message || "Steadfast API error",
        rawResponse: raw,
      });
    }

    order.status = "send_to_courier";

    order.courier = {
      provider: "steadfast",
      trackingId: data?.consignment?.tracking_code || "",
      consignmentId: data?.consignment?.consignment_id || null,
      status: data?.consignment?.status || "in_review",
      codAmountSent: codAmount,
      rawResponse: data,
      sentAt: new Date(),
    };

    order.trackingId = order.courier.trackingId;

    await order.save();

    return res.json({
      ok: true,
      requestId,
      message: "Courier order created & status updated",
      trackingCode: order.courier.trackingId,
      order,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message || "Courier service error",
    });
  }
});

/* ======================================================
   🔄 SYNC COURIER FINAL STATUS
   POST /admin/api/sync-courier-final
====================================================== */
router.post("/sync-courier-final", async (req, res) => {
  const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  console.log("🔄 COURIER FINAL SYNC HIT:", requestId);

  try {
    const { orderId, finalStatus } = req.body || {};

    if (!orderId || !finalStatus) {
      return res.status(400).json({
        ok: false,
        requestId,
        error: "orderId and finalStatus required",
      });
    }

    if (!["delivered", "cancelled"].includes(finalStatus)) {
      return res.status(400).json({
        ok: false,
        requestId,
        error: "finalStatus must be delivered or cancelled",
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        ok: false,
        requestId,
        error: "Order not found",
      });
    }

    if (order.status !== "send_to_courier" && order.status !== finalStatus) {
      return res.status(400).json({
        ok: false,
        requestId,
        error: `Cannot sync from ${order.status} → ${finalStatus}`,
      });
    }

    order.status = finalStatus;

    if (order.courier) {
      order.courier.status = finalStatus;
      order.courier.syncedAt = new Date();
    }

    await order.save();

    console.log("✅ Courier final status synced:", order._id);

    return res.json({
      ok: true,
      requestId,
      message: "Courier final status synced successfully",
      order,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      requestId,
      error: err.message || "Courier sync error",
    });
  }
});

export default router;
