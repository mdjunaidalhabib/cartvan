import mongoose from "mongoose";

/**
 * ✅ HomeBadge
 * হোমপেজে স্লাইডারের নিচে যে ৩টা অফার বাটন দেখা যায়
 * (Free Delivery / Best Discount / Gift Box) — সেগুলোর
 * নাম, আইকন, অর্ডার এবং visibility এখন সম্পূর্ণ Admin panel
 * থেকে control হবে।
 *
 * `field` — টেকনিক্যাল key, Product schema-এর boolean field-এর
 * সাথে map করে (freeDelivery / bestDiscount / cartvanBox)।
 * এই key অপরিবর্তনীয় (create করার পর change করা যায় না) —
 * কারণ প্রোডাক্ট ফিল্টারিং ও checkout-এ free delivery লজিক
 * এই key-এর উপর নির্ভর করে। কিন্তু `name` (label) এবং `icon`
 * সম্পূর্ণ এডিটেবল — অর্থাৎ "Gift Box" বাটনটার কোনো নিজস্ব
 * hardcoded নাম নেই, Admin যা নাম দেবে ফ্রন্ট এন্ডে সেটাই দেখাবে।
 */
const homeBadgeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    field: {
      type: String,
      required: true,
      enum: ["freeDelivery", "bestDiscount", "cartvanBox"],
      unique: true,
    },

    icon: {
      type: String,
      enum: ["truck", "bag", "gift", "tag", "fire", "star", "percent"],
      default: "gift",
    },

    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.models.HomeBadge ||
  mongoose.model("HomeBadge", homeBadgeSchema);
