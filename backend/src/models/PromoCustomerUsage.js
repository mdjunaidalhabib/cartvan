import mongoose from "mongoose";

const promoCustomerUsageSchema = new mongoose.Schema(
  {
    promo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Promo",
      required: true,
      index: true,
    },
    customerKey: { type: String, required: true, index: true },
    count: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

promoCustomerUsageSchema.index(
  { promo: 1, customerKey: 1 },
  { unique: true },
);

export default mongoose.models.PromoCustomerUsage ||
  mongoose.model("PromoCustomerUsage", promoCustomerUsageSchema);
