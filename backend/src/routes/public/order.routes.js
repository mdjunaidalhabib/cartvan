import express from "express";
import Order from "../../models/Order.js";
import Product from "../../models/Product.js";
import DeliveryCharge from "../../models/DeliveryCharge.js";

// ✅ correct relative path
import { getOrderMailSendSettings } from "../../../utils/mail/index.js";
import { sendAdminOrderEmail } from "../../../utils/mail/index.js";

const router = express.Router();

/* ---------------- Helpers ---------------- */

const toNumber = (val, fallback = 0) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
};

const normalizePaymentMethod = (method) => {
  const m = String(method || "").toLowerCase();
  if (m === "paynow" || m === "bkash") return "bkash";
  return "cod";
};

const normalizeString = (s) =>
  String(s || "")
    .trim()
    .toLowerCase();

const hasVariants = (product) =>
  Array.isArray(product?.colors) && product.colors.length > 0;

const computeVariantTotalStock = (colors) => {
  const list = Array.isArray(colors) ? colors : [];
  return list.reduce((sum, c) => sum + toNumber(c?.stock, 0), 0);
};

const computeSoldOut = (product) => {
  if (!hasVariants(product)) return toNumber(product?.stock, 0) <= 0;
  const anyInStock = product.colors.some((c) => toNumber(c?.stock, 0) > 0);
  return !anyInStock;
};

/**
 * ✅ DB থেকে Latest delivery fee fetch
 */
const getDeliveryFeeFromDB = async () => {
  try {
    const charge = await DeliveryCharge.findOne().sort({ createdAt: -1 });
    const fee = toNumber(charge?.fee, 0);
    return fee;
  } catch (err) {
    console.error("❌ DeliveryCharge DB Fetch Error:", err);
    return 0;
  }
};

/**
 * ✅ Free Delivery Check
 * cart-এর সবগুলো আইটেম যদি admin থেকে "Free Delivery" মার্ক করা
 * থাকে (Product.freeDelivery === true) — তাহলেই পুরো অর্ডারের
 * delivery charge 0 (জিরো) হবে। একটা আইটেমও non-free-delivery
 * হলে সম্পূর্ণ ডেলিভারি চার্জ প্রযোজ্য হবে।
 */
const isEntireCartFreeDelivery = async (items) => {
  try {
    const ids = [
      ...new Set(
        (Array.isArray(items) ? items : [])
          .map((it) => it?.productId)
          .filter(Boolean),
      ),
    ];
    if (!ids.length) return false;

    const totalCount = ids.length;

    const freeCount = await Product.countDocuments({
      _id: { $in: ids },
      freeDelivery: true,
    });

    // ✅ সবগুলো (ইউনিক) প্রোডাক্টই ফ্রি ডেলিভারি হলে তবেই true
    return freeCount === totalCount;
  } catch (err) {
    console.error("❌ Free delivery check failed:", err);
    return false;
  }
};

/**
 * ✅ Inventory update (stock & sold) for a single item
 * item: { productId, qty, color }
 * mode: "decrease" | "increase"
 *
 * IMPORTANT FIXES:
 * ✅ no silent return (throw error instead)
 * ✅ normalize color match
 * ✅ strict stock validation
 */
const updateInventoryForItem = async (item, mode = "decrease") => {
  const productId = item?.productId;
  const qty = toNumber(item?.qty, 0);
  const color = item?.color ? String(item.color) : null;

  // ✅ STOP silent fail
  if (!productId || qty <= 0) {
    throw new Error(
      `Invalid order item! productId=${productId}, qty=${item?.qty}`
    );
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new Error(`Product not found: ${productId}`);
  }

  const productHasVariants = hasVariants(product);

  // ✅ Variant Mode
  if (productHasVariants && color) {
    const targetColor = normalizeString(color);

    const idx = product.colors.findIndex(
      (c) => normalizeString(c?.name) === targetColor
    );

    if (idx === -1) {
      throw new Error(
        `Variant not found: "${color}" for product: ${product.name}`
      );
    }

    const currentVariantStock = toNumber(product.colors[idx]?.stock, 0);

    if (mode === "decrease") {
      if (currentVariantStock < qty) {
        throw new Error(
          `${product.name} (${product.colors[idx]?.name}) stock not enough. Available: ${currentVariantStock}`
        );
      }

      // ✅ update variant
      product.colors[idx].stock = currentVariantStock - qty;
      product.colors[idx].sold = toNumber(product.colors[idx]?.sold, 0) + qty;

      // ✅ update product sold
      product.sold = toNumber(product.sold, 0) + qty;
    } else {
      // ✅ restock
      product.colors[idx].stock = currentVariantStock + qty;
      product.colors[idx].sold = toNumber(product.colors[idx]?.sold, 0) - qty;
      if (product.colors[idx].sold < 0) product.colors[idx].sold = 0;

      product.sold = toNumber(product.sold, 0) - qty;
      if (product.sold < 0) product.sold = 0;
    }

    // ✅ sync product stock + soldout
    product.stock = computeVariantTotalStock(product.colors);
    product.isSoldOut = computeSoldOut(product);

    await product.save();
    return product;
  }

  // ✅ Normal Product (No variant)
  const baseStock = toNumber(product.stock, 0);

  if (mode === "decrease") {
    if (baseStock < qty) {
      throw new Error(
        `${product.name} stock not enough. Available: ${baseStock}`
      );
    }

    product.stock = baseStock - qty;
    product.sold = toNumber(product.sold, 0) + qty;

    if (product.stock <= 0) product.stock = 0;
  } else {
    product.stock = baseStock + qty;
    product.sold = toNumber(product.sold, 0) - qty;
    if (product.sold < 0) product.sold = 0;
  }

  product.isSoldOut = computeSoldOut(product);
  await product.save();
  return product;
};

/* ---------------- Routes ---------------- */

/**
 * @route   POST /api/orders
 * @desc    ✅ Create new order + stock update + Admin Email
 *          ✅ DeliveryCharge DB driven
 */
router.post("/", async (req, res) => {
  try {
    const {
      items,
      subtotal,
      billing,
      discount,
      promoCode,
      userId,
      paymentMethod,
      paymentStatus,
    } = req.body;

    // ✅ Validation
    if (!items?.length || subtotal == null) {
      return res.status(400).json({
        error: "প্রয়োজনীয় তথ্য প্রদান করা হয়নি (Missing fields)",
      });
    }

    if (!billing?.name || !billing?.phone || !billing?.address) {
      return res.status(400).json({
        error: "Billing তথ্য সম্পূর্ণ নয় (name/phone/address required)",
      });
    }

    // ✅ Payment normalize
    const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod);

    // ✅ DeliveryCharge DB driven
    const baseDeliveryFee = await getDeliveryFeeFromDB();

    // ✅ যদি cart-এ কোনো Free Delivery প্রোডাক্ট থাকে → চার্জ 0
    const isFreeDelivery = await isEntireCartFreeDelivery(items);
    const DELIVERY_CHARGE = isFreeDelivery ? 0 : baseDeliveryFee;

    // ✅ backend-safe total calculation
    const calculatedSubtotal = toNumber(subtotal, 0);
    const calculatedDiscount = toNumber(discount, 0);

    const calculatedTotal =
      calculatedSubtotal + DELIVERY_CHARGE - calculatedDiscount;

    // ✅ SAVE ORDER
    const order = new Order({
      items,
      subtotal: calculatedSubtotal,
      deliveryCharge: DELIVERY_CHARGE,
      discount: calculatedDiscount,
      total: calculatedTotal,
      billing: {
        name: billing.name,
        phone: billing.phone,
        address: billing.address,
        note: billing.note || "",
      },
      promoCode: promoCode || "",
      userId: userId || null,
      paymentMethod: normalizedPaymentMethod,
      paymentStatus: paymentStatus || "pending",
      status: "pending",
    });

    const savedOrder = await order.save();

    /* ✅✅ STRICT INVENTORY UPDATE
       - If stock update fails => rollback order + return 400
    */
    try {
      await Promise.all(
        items.map((item) => updateInventoryForItem(item, "decrease")),
      );
    } catch (stockErr) {
      console.error("❌ Stock/Sold Update Error:", stockErr);

      // ✅ rollback order so fake order not saved
      try {
        await Order.findByIdAndDelete(savedOrder._id);
      } catch (rbErr) {
        console.error("❌ Rollback failed:", rbErr);
      }

      return res.status(400).json({
        error:
          stockErr?.message || "Stock not available / Inventory update failed",
      });
    }

    // ✅ Admin Email Notify (DB settings)
    // Admin Email Notify (DB settings)
    try {
      const settings = await getOrderMailSendSettings();

      // DB তে active email খুঁজে বের করা
      const activeEmailObj = settings.emails.find((e) => e.active);
      const adminEmail = activeEmailObj?.email?.trim();

      if (adminEmail) {
        await sendAdminOrderEmail({
          to: adminEmail,
          orderId: savedOrder._id,
          customerName: savedOrder?.billing?.name,
          customerPhone: savedOrder?.billing?.phone,
          address: savedOrder?.billing?.address,
          note: savedOrder?.billing?.note,
          items: savedOrder?.items,
          subtotal: savedOrder?.subtotal,
          deliveryCharge: savedOrder?.deliveryCharge,
          discount: savedOrder?.discount,
          total: savedOrder?.total,
          paymentMethod: savedOrder?.paymentMethod,
        });
      } else {
        console.warn("⚠️ No active admin email set in DB");
      }
    } catch (mailErr) {
      console.error("❌ Admin Email Send Failed:", mailErr);
    }

    return res.status(201).json(savedOrder);
  } catch (err) {
    console.error("❌ Failed to create order:", err);
    return res.status(500).json({ error: "অর্ডার তৈরি করতে ব্যর্থ হয়েছে।" });
  }
});

/**
 * @route   GET /api/orders/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "অর্ডারটি খুঁজে পাওয়া যায়নি।" });
    }

    return res.status(200).json(order);
  } catch (err) {
    console.error("❌ Error fetching order:", err);
    if (err.kind === "ObjectId") {
      return res.status(400).json({ error: "অর্ডার আইডি সঠিক নয়।" });
    }
    return res.status(500).json({ error: "সার্ভার এরর!" });
  }
});

/**
 * @route   GET /api/orders?userId=xxx
 */
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "userId প্রয়োজন।" });
    }
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (err) {
    return res.status(500).json({ error: "অর্ডার লিস্ট লোড করা সম্ভব হয়নি।" });
  }
});

/**
 * @route   PUT /api/orders/:id
 * ✅ Cancel = Restock
 */
router.put("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "অর্ডার পাওয়া যায়নি।" });

    const { status, cancelReason, billing, paymentStatus } = req.body;

    if (billing) {
      order.billing = {
        ...order.billing,
        name: billing.name ?? order.billing.name,
        phone: billing.phone ?? order.billing.phone,
        address: billing.address ?? order.billing.address,
        note: billing.note ?? order.billing.note,
      };
    }

    if (paymentStatus) {
      const ps = String(paymentStatus);
      if (["pending", "paid", "failed"].includes(ps)) {
        order.paymentStatus = ps;
      }
    }

    // ✅ Cancel -> Restock (ONLY if pending)
    if (status === "cancelled") {
      if (order.status !== "pending") {
        return res.status(403).json({
          error: "অর্ডারটি ইতিমধ্যে প্রসেস হয়ে গেছে, ক্যানসেল করা সম্ভব নয়।",
        });
      }

      order.status = "cancelled";
      order.cancelReason = cancelReason || "Cancelled by user";

      try {
        await Promise.all(
          order.items.map((item) => updateInventoryForItem(item, "increase"))
        );
      } catch (restockErr) {
        console.error("❌ Restock Error:", restockErr);
      }
    } else if (status) {
      const allowed = [
        "pending",
        "ready_to_delivery",
        "send_to_courier",
        "delivered",
        "cancelled",
      ];

      if (!allowed.includes(String(status))) {
        return res.status(400).json({ error: "Invalid status" });
      }

      order.status = status;
    }

    await order.save();
    return res.json(order);
  } catch (err) {
    console.error("❌ Order update error:", err);
    return res.status(500).json({ error: "অর্ডার আপডেট ব্যর্থ হয়েছে।" });
  }
});

export default router;
