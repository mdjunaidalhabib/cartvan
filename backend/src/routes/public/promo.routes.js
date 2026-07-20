import express from "express";
import DeliveryCharge from "../../models/DeliveryCharge.js";
import {
  buildPricedOrderItemsFromDB,
  calculateItemsSubtotal,
} from "../../services/orderPricingService.js";
import { validatePromoForOrder } from "../../services/promoService.js";
import { getPublicPromoSettings } from "../../services/promoSettingsService.js";

const router = express.Router();

const getDeliveryFee = async () => {
  const charge = await DeliveryCharge.findOne().sort({ createdAt: -1 });
  const fee = Number(charge?.fee);
  return Number.isFinite(fee) ? fee : 0;
};

router.get("/settings", async (req, res) => {
  try {
    const settings = await getPublicPromoSettings();
    res.setHeader("Cache-Control", "no-store");
    return res.json(settings);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error?.message || "Promo settings load failed",
    });
  }
});

router.post("/validate", async (req, res) => {
  try {
    const { code, items, userId, phone, paymentMethod } = req.body;
    const trustedItems = await buildPricedOrderItemsFromDB(items);
    const subtotal = calculateItemsSubtotal(trustedItems);
    const entireCartFreeDelivery =
      trustedItems.length > 0 &&
      trustedItems.every((item) => item.freeDelivery);
    const deliveryCharge = entireCartFreeDelivery
      ? 0
      : await getDeliveryFee();

    const result = await validatePromoForOrder({
      code,
      items: trustedItems,
      subtotal,
      deliveryCharge,
      userId,
      phone,
      paymentMethod,
    });

    return res.json({
      success: true,
      message: "Promo code applied successfully.",
      promo: {
        id: result.promo._id,
        code: result.promo.code,
        title: result.promo.title,
        description: result.promo.description,
        discountType: result.promo.discountType,
        discountValue: result.promo.discountValue,
      },
      subtotal,
      eligibleSubtotal: result.eligibleSubtotal,
      discountAmount: result.discountAmount,
      shippingDiscount: result.shippingDiscount,
      deliveryCharge: result.finalDeliveryCharge,
      total: Math.max(
        0,
        subtotal + result.finalDeliveryCharge - result.discountAmount,
      ),
    });
  } catch (error) {
    return res.status(error?.statusCode || 400).json({
      success: false,
      code: error?.code || "PROMO_INVALID",
      error: error?.message || "Promo validation failed",
    });
  }
});

export default router;
