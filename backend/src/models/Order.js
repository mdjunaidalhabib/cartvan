import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
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
    ============================ */
    paymentMethod: {
      type: String,
      enum: ["cod", "bkash"],
      default: "cod",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
      index: true,
    },

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

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
