import mongoose from "mongoose";

// --- Variant/Color Schema ---
const colorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    // ✅ Variant price (per color)
    price: { type: Number, default: 0, min: 0 },

    // ✅ Optional oldPrice (per color)
    oldPrice: { type: Number, default: null, min: 0 },

    images: { type: [String], default: [] },

    stock: { type: Number, default: 0, min: 0 },
    sold: { type: Number, default: 0, min: 0 },
  },
  { _id: true },
);

// --- Review Schema ---
const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    }, // ✅ FIX
    user: { type: String, default: "" },
    avatar: { type: String, default: "" },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    comment: { type: String, default: "" },
  },
  { timestamps: true },
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },

    // ✅ default null
    oldPrice: { type: Number, default: null, min: 0 },

    image: { type: String, default: "" }, // Main Image
    images: { type: [String], default: [] }, // Gallery Images

    // ✅ variants
    colors: { type: [colorSchema], default: [] },

    rating: { type: Number, default: 0, min: 0, max: 5 },
    description: { type: String, default: "" },
    additionalInfo: { type: String, default: "" },
    reviews: [reviewSchema],

    stock: { type: Number, default: 0, min: 0 },
    sold: { type: Number, default: 0, min: 0 },

    isSoldOut: { type: Boolean, default: false },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    order: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },

    // ✅ OfferBadge fields
    freeDelivery: { type: Boolean, default: false },
    bestDiscount: { type: Boolean, default: false },
    cartvanBox: { type: Boolean, default: false },
  },
  { timestamps: true },
);

productSchema.index({ name: "text", category: 1 });

export default mongoose.models.Product ||
  mongoose.model("Product", productSchema);
