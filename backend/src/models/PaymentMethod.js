import mongoose from "mongoose";

/**
 * ✅ PAYMENT METHOD (Dynamic Mobile Banking)
 * Admin can add/edit/remove methods like bKash, Nagad, Rocket, Upay etc.
 * Each method has a merchant/personal number that's shown to the
 * customer at checkout, along with instructions on how to send money.
 */
const paymentMethodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "bKash"
    number: { type: String, required: true, trim: true }, // merchant number
    accountType: {
      type: String,
      enum: ["personal", "merchant", "agent"],
      default: "personal",
    },
    // ✅ কাস্টমারকে ঠিক কোন action করতে বলা হবে (Send Money / Cash In / Payment ইত্যাদি)।
    // Personal ও Merchant/Agent নাম্বারে bKash/Nagad app-এ ভিন্ন অপশন থাকে,
    // তাই এটা fixed টেক্সট না রেখে অ্যাডমিন থেকে সেট করা যায়।
    actionLabel: { type: String, default: "Send Money", trim: true },
    instructions: { type: String, default: "" }, // shown to customer
    logo: { type: String, default: "" }, // optional icon/logo url
    active: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 }, // display order (lower first)
  },
  { timestamps: true },
);

const PaymentMethod =
  mongoose.models.PaymentMethod ||
  mongoose.model("PaymentMethod", paymentMethodSchema);

export default PaymentMethod;
