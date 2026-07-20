import Promo from "../models/Promo.js";
import PromoRedemption from "../models/PromoRedemption.js";
import PromoCustomerUsage from "../models/PromoCustomerUsage.js";
import Order from "../models/Order.js";

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const normalize = (value) => String(value || "").trim().toLowerCase();
export const normalizePromoCode = (value) =>
  String(value || "").trim().toUpperCase();

export const getPromoCustomerKey = ({ userId, phone }) => {
  if (userId !== null && userId !== undefined && String(userId).trim()) {
    return `user:${String(userId).trim()}`;
  }
  const normalizedPhone = String(phone || "").replace(/\D/g, "");
  return normalizedPhone ? `phone:${normalizedPhone}` : "guest:unknown";
};

const promoError = (message, code = "PROMO_INVALID", statusCode = 400) => {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
};

const idsToSet = (values) =>
  new Set(
    (Array.isArray(values) ? values : []).map((value) => String(value)),
  );

const getEligibleItems = (promo, items) => {
  const products = idsToSet(promo.applicableProductIds);
  const categories = idsToSet(promo.applicableCategoryIds);
  const excluded = idsToSet(promo.excludedProductIds);

  return (Array.isArray(items) ? items : []).filter((item) => {
    const productId = String(item?.productId || "");
    const categoryId = String(item?.categoryId || "");
    if (excluded.has(productId)) return false;
    if (promo.appliesTo === "products") return products.has(productId);
    if (promo.appliesTo === "categories") return categories.has(categoryId);
    return true;
  });
};

export const validatePromoForOrder = async ({
  code,
  items,
  subtotal,
  deliveryCharge,
  userId,
  phone,
  paymentMethod,
}) => {
  const normalizedCode = normalizePromoCode(code);
  if (!normalizedCode) {
    throw promoError("Promo code দিন।", "PROMO_REQUIRED");
  }

  const promo = await Promo.findOne({
    code: normalizedCode,
    isArchived: false,
  });
  if (!promo) {
    throw promoError("Promo code সঠিক নয়।", "PROMO_NOT_FOUND", 404);
  }
  if (!promo.isActive) {
    throw promoError("এই promo code এখন inactive।", "PROMO_INACTIVE");
  }

  const now = new Date();
  if (promo.startDate && now < promo.startDate) {
    throw promoError(
      "এই promo campaign এখনো শুরু হয়নি।",
      "PROMO_NOT_STARTED",
    );
  }
  if (promo.endDate && now > promo.endDate) {
    throw promoError("এই promo code-এর মেয়াদ শেষ।", "PROMO_EXPIRED");
  }
  if (promo.totalUsageLimit && promo.usedCount >= promo.totalUsageLimit) {
    throw promoError(
      "এই promo code-এর usage limit শেষ।",
      "PROMO_LIMIT_REACHED",
    );
  }

  const calculatedSubtotal = toNumber(subtotal, 0);
  const totalQty = (Array.isArray(items) ? items : []).reduce(
    (sum, item) => sum + toNumber(item?.qty, 0),
    0,
  );

  if (calculatedSubtotal < toNumber(promo.minimumOrderAmount, 0)) {
    throw promoError(
      `এই code ব্যবহার করতে minimum order ৳${promo.minimumOrderAmount} হতে হবে।`,
      "PROMO_MINIMUM_NOT_MET",
    );
  }
  if (totalQty < toNumber(promo.minimumQuantity, 1)) {
    throw promoError(
      `এই code ব্যবহার করতে কমপক্ষে ${promo.minimumQuantity}টি item লাগবে।`,
      "PROMO_MINIMUM_QUANTITY_NOT_MET",
    );
  }

  const allowedPaymentMethods = (promo.allowedPaymentMethods || []).map(
    normalize,
  );
  if (
    allowedPaymentMethods.length > 0 &&
    !allowedPaymentMethods.includes(normalize(paymentMethod || "cod"))
  ) {
    throw promoError(
      "Selected payment method-এ এই promo প্রযোজ্য নয়।",
      "PROMO_PAYMENT_NOT_ALLOWED",
    );
  }

  const customerKey = getPromoCustomerKey({ userId, phone });
  const customerLimit = promo.firstOrderOnly
    ? 1
    : toNumber(promo.usageLimitPerCustomer, 1);
  if (customerLimit && customerKey !== "guest:unknown") {
    const customerUsage = await PromoCustomerUsage.findOne({
      promo: promo._id,
      customerKey,
    }).lean();
    if (toNumber(customerUsage?.count, 0) >= customerLimit) {
      throw promoError(
        "আপনি এই promo code-এর usage limit ইতিমধ্যে পূরণ করেছেন।",
        "PROMO_CUSTOMER_LIMIT",
      );
    }
  }

  if (promo.firstOrderOnly) {
    const customerFilter = [];
    if (userId !== null && userId !== undefined && String(userId).trim()) {
      customerFilter.push({ userId: String(userId) });
    }
    if (phone) {
      customerFilter.push({ "billing.phone": String(phone).trim() });
    }

    if (customerFilter.length) {
      const previousOrder = await Order.exists({
        $or: customerFilter,
        status: { $ne: "cancelled" },
      });
      if (previousOrder) {
        throw promoError(
          "এই promo code শুধু first order-এর জন্য।",
          "PROMO_FIRST_ORDER_ONLY",
        );
      }
    }
  }

  const eligibleItems = getEligibleItems(promo, items);
  const eligibleSubtotal = eligibleItems.reduce(
    (sum, item) =>
      sum + toNumber(item?.price, 0) * toNumber(item?.qty, 0),
    0,
  );

  if (eligibleSubtotal <= 0) {
    throw promoError(
      "আপনার cart-এর কোনো product-এ এই promo প্রযোজ্য নয়।",
      "PROMO_NO_ELIGIBLE_ITEMS",
    );
  }

  let discountAmount = 0;
  let shippingDiscount = 0;

  if (promo.discountType === "percentage") {
    discountAmount =
      (eligibleSubtotal * toNumber(promo.discountValue, 0)) / 100;
    if (
      promo.maxDiscountAmount !== null &&
      promo.maxDiscountAmount !== undefined
    ) {
      discountAmount = Math.min(
        discountAmount,
        toNumber(promo.maxDiscountAmount, 0),
      );
    }
  } else if (promo.discountType === "fixed") {
    discountAmount = Math.min(
      toNumber(promo.discountValue, 0),
      eligibleSubtotal,
    );
  } else if (promo.discountType === "free_shipping") {
    shippingDiscount = Math.max(0, toNumber(deliveryCharge, 0));
  }

  discountAmount = Math.max(0, Math.round(discountAmount));
  shippingDiscount = Math.max(0, Math.round(shippingDiscount));

  return {
    promo,
    customerKey,
    eligibleSubtotal,
    discountAmount,
    shippingDiscount,
    finalDeliveryCharge: Math.max(
      0,
      toNumber(deliveryCharge, 0) - shippingDiscount,
    ),
  };
};

export const reservePromoUsage = async ({
  validation,
  order,
  userId,
  phone,
}) => {
  if (!validation?.promo || !order?._id) return null;

  const promo = validation.promo;
  const customerKey = validation.customerKey;
  const customerLimit = promo.firstOrderOnly
    ? 1
    : toNumber(promo.usageLimitPerCustomer, 1);
  let customerReserved = false;
  let globalReserved = false;

  // Atomic per-customer reservation. The unique compound index prevents two
  // simultaneous checkouts from both claiming the first usage slot.
  if (customerKey !== "guest:unknown" && customerLimit > 0) {
    let usage = await PromoCustomerUsage.findOneAndUpdate(
      {
        promo: promo._id,
        customerKey,
        count: { $lt: customerLimit },
      },
      { $inc: { count: 1 } },
      { new: true },
    );

    if (!usage) {
      try {
        usage = await PromoCustomerUsage.create({
          promo: promo._id,
          customerKey,
          count: 1,
        });
      } catch (error) {
        if (error?.code === 11000) {
          usage = await PromoCustomerUsage.findOneAndUpdate(
            {
              promo: promo._id,
              customerKey,
              count: { $lt: customerLimit },
            },
            { $inc: { count: 1 } },
            { new: true },
          );
        } else {
          throw error;
        }
      }
    }

    if (!usage) {
      throw promoError(
        "আপনি এই promo code-এর usage limit ইতিমধ্যে পূরণ করেছেন।",
        "PROMO_CUSTOMER_LIMIT",
      );
    }
    customerReserved = true;
  }

  const limitFilter = {
    _id: promo._id,
    isActive: true,
    isArchived: false,
  };
  if (promo.totalUsageLimit) {
    limitFilter.$expr = { $lt: ["$usedCount", "$totalUsageLimit"] };
  }

  const updatedPromo = await Promo.findOneAndUpdate(
    limitFilter,
    { $inc: { usedCount: 1 } },
    { new: true },
  );

  if (!updatedPromo) {
    if (customerReserved) {
      await PromoCustomerUsage.findOneAndUpdate(
        { promo: promo._id, customerKey },
        { $inc: { count: -1 } },
      );
    }
    throw promoError(
      "Promo usage limit এইমাত্র শেষ হয়েছে।",
      "PROMO_LIMIT_REACHED",
    );
  }
  globalReserved = true;

  try {
    return await PromoRedemption.create({
      promo: promo._id,
      order: order._id,
      code: promo.code,
      customerKey,
      userId:
        userId !== undefined && userId !== null ? String(userId) : null,
      customerPhone: phone ? String(phone).trim() : null,
      eligibleSubtotal: validation.eligibleSubtotal,
      discountAmount: validation.discountAmount,
      shippingDiscount: validation.shippingDiscount,
    });
  } catch (error) {
    if (globalReserved) {
      await Promo.findByIdAndUpdate(promo._id, { $inc: { usedCount: -1 } });
    }
    if (customerReserved) {
      await PromoCustomerUsage.findOneAndUpdate(
        { promo: promo._id, customerKey },
        { $inc: { count: -1 } },
      );
    }
    throw error;
  }
};

export const releasePromoUsage = async ({ promoId, orderId }) => {
  if (!promoId || !orderId) return;
  const redemption = await PromoRedemption.findOneAndDelete({
    promo: promoId,
    order: orderId,
  });
  if (redemption) {
    await Promo.findByIdAndUpdate(promoId, { $inc: { usedCount: -1 } });
    await PromoCustomerUsage.findOneAndUpdate(
      { promo: promoId, customerKey: redemption.customerKey },
      { $inc: { count: -1 } },
    );
  }
};
