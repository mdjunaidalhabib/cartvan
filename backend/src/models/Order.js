import mongoose from "mongoose";
import Counter from "./Counter.js";

const orderSchema = new mongoose.Schema(
  {
    /* ===========================
       ✅ ORDER NUMBER (auto-increment, human-readable)
       - Separate from Mongo's _id
       - Used on invoice/receipt instead of the ObjectId
       - Sequential: 1001, 1002, 1003, ...
    ============================ */
    orderNumber: { type: Number, unique: true, index: true },

    /* ===========================
       ✅ ITEMS
    ============================ */
    items: [
      {
        productId: { type: String, required: true },
        name: { type: String, default: "" },
        price: { type: Number, default: 0 },
        qty: { type: Number, default: 1 },
        image: { type: String, default: "" },

        // ✅ Optional but useful
        color: { type: String, default: null },
        stock: { type: Number, default: 0 },
      },
    ],

    /* ===========================
       ✅ TOTALS
    ============================ */
    subtotal: { type: Number, required: true },
    deliveryCharge: { type: Number, required: true, default: 120 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },

    /* ===========================
       ✅ BILLING
    ============================ */
    billing: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      note: { type: String, default: "" },
    },

    /* ===========================
       ✅ OPTIONAL META
    ============================ */
    promoCode: { type: String, default: null },
    userId: { type: String, default: null },

    /* ===========================
       ✅ WHO CREATED THIS ORDER
       (User checkout / Admin panel)
    ============================ */
    createdBy: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },
    createdByName: { type: String, default: null },
    createdById: { type: String, default: null },

    /* ===========================
       ✅ PAYMENT
       - paymentMethod is now a free-form string: "cod" or the
         PaymentMethod name (e.g. "bKash", "Nagad", "Rocket") since
         admin can add/remove methods dynamically.
    ============================ */
    paymentMethod: {
      type: String,
      default: "cod",
      trim: true,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
      index: true,
    },

    // ✅ Manual mobile-banking verification details (bKash/Nagad/etc.)
    // Filled only when paymentMethod !== "cod"
    paymentDetails: {
      methodId: { type: mongoose.Schema.Types.ObjectId, default: null },
      methodName: { type: String, default: null }, // snapshot, in case method is later renamed/deleted
      senderNumber: { type: String, default: null },
      transactionId: {
        type: String,
        default: null,
        uppercase: true,
        trim: true,
      },
    },

    // ✅ Admin panel-এর "Payments > Verified / TrxID" লিস্ট থেকে "Remove"
    // চাপলে Order নিজে delete/trash না করে শুধু এই flag true করা হয় —
    // Order (এবং তার accounting/history value) অক্ষত থাকে, Orders পেজে
    // ঠিক আগের মতোই দেখা যায়, শুধু Payments history-তে আর দেখানো হয় না।
    hiddenFromPaymentsView: { type: Boolean, default: false },

    /* ===========================
       ✅ ORDER STATUS
    ============================ */
    status: {
      type: String,
      enum: [
        "pending",
        "ready_to_delivery",
        "send_to_courier",
        "delivered",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },

    /* ===========================
       ✅ COURIER INFO (OPTION–B)
    ============================ */
    courier: {
      provider: { type: String, default: null },
      trackingId: { type: String, default: null },
      consignmentId: { type: String, default: null },
      status: { type: String, default: null },
      rawResponse: { type: mongoose.Schema.Types.Mixed, default: null },
      sentAt: { type: Date, default: null },
    },

    /* ===========================
       ✅ LEGACY FIELD FOR COMPATIBILITY
    ============================ */
    trackingId: { type: String, default: null },
    cancelReason: { type: String, default: null },

    /* ===========================
       ✅ INVOICE PDF CACHE
       (pre-generated on order create, invalidated on billing/total change)
    ============================ */
    invoice: {
      cachedAt: { type: Date, default: null },
      version: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

// ✅ Speeds up duplicate-TrxID lookup during checkout (fraud check)
orderSchema.index({
  "paymentDetails.methodName": 1,
  "paymentDetails.transactionId": 1,
});

// ✅ Pre-save hook to auto-increment orderNumber safely
// (same Counter-based pattern already used for User.userId)
orderSchema.pre("save", async function (next) {
  if (
    this.isNew &&
    (this.orderNumber === undefined || this.orderNumber === null)
  ) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { name: "orderNumber" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true },
      );
      this.orderNumber = counter?.seq ?? 1001;
    } catch (e) {
      // fallback if counter fails — still lets the order save
      this.orderNumber = Date.now();
    }
  }
  next();
});

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
