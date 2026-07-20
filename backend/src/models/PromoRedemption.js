import mongoose from "mongoose";

const promoRedemptionSchema = new mongoose.Schema(
  {
    promo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Promo",
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    customerKey: { type: String, required: true, index: true },
    userId: { type: String, default: null, index: true },
    customerPhone: { type: String, default: null, index: true },
    eligibleSubtotal: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    shippingDiscount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

promoRedemptionSchema.index({ promo: 1, customerKey: 1, createdAt: -1 });

export default mongoose.models.PromoRedemption ||
  mongoose.model("PromoRedemption", promoRedemptionSchema);
