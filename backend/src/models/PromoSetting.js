import mongoose from "mongoose";

const promoSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "frontend-promo",
      unique: true,
      immutable: true,
    },
    showPromoField: { type: Boolean, default: true },
    showAvailabilityMessage: { type: Boolean, default: true },
    availableMessage: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "Promo code থাকলে এখানে ব্যবহার করে discount নিন।",
    },
    unavailableMessage: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "এই মুহূর্তে কোনো promo code available নেই।",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  { timestamps: true },
);

export const PROMO_SETTING_KEY = "frontend-promo";

export default mongoose.models.PromoSetting ||
  mongoose.model("PromoSetting", promoSettingSchema);
