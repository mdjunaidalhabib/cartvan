import mongoose from "mongoose";

const deliveryChargeSchema = new mongoose.Schema(
  {
    fee: { type: Number, required: true, default: 0 },
    // ✅ Checkout পেজে যে টেক্সট দেখানো হয় (যেমন: "🚚 ডেলিভারি চার্জ"),
    // সেটা এখন admin panel থেকে কাস্টমাইজ করা যাবে।
    label: { type: String, default: "🚚 ডেলিভারি চার্জ", trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("DeliveryCharge", deliveryChargeSchema);
