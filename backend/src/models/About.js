import mongoose from "mongoose";

/**
 * ✅ About Page Content
 * "/about" পেজের সব কন্টেন্ট (Hero, Story, Stats, Mission, Vision, Features, CTA)
 * এখন সম্পূর্ণ Admin panel থেকে control হবে — কোনো hardcoded টেক্সট নেই।
 * Footer/HomeBadge এর মতোই এটা একটা singleton document (সবসময় ১টাই থাকবে)।
 */

const StatSchema = new mongoose.Schema({
  value: { type: String, required: true, trim: true }, // e.g. "10K+"
  label: { type: String, required: true, trim: true }, // e.g. "সন্তুষ্ট গ্রাহক"
});

const FeatureSchema = new mongoose.Schema({
  icon: {
    type: String,
    enum: [
      "shield-check",
      "truck",
      "headphones",
      "refresh-cw",
      "target",
      "eye",
      "award",
      "star",
      "heart",
      "users",
      "clock",
      "thumbs-up",
    ],
    default: "star",
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
});

const AboutSchema = new mongoose.Schema({
  hero: {
    badge: { type: String, default: "✨ আমাদের সম্পর্কে" },
    titleLine1: { type: String, default: "আপনার বিশ্বস্ত" },
    titleLine2: { type: String, default: "অনলাইন শপিং সঙ্গী" },
    description: {
      type: String,
      default:
        "আমরা বিশ্বাস করি অনলাইন শপিং হওয়া উচিত সহজ, নিরাপদ এবং আনন্দদায়ক। তাই আমরা মানসম্মত পণ্য, দ্রুত ডেলিভারি এবং অসাধারণ গ্রাহক সেবা নিশ্চিত করি।",
    },
    primaryButtonText: { type: String, default: "এখনই শপ করুন" },
    primaryButtonLink: { type: String, default: "/products" },
    secondaryButtonText: { type: String, default: "আরও জানুন" },
  },

  storeName: { type: String, default: "আপনার স্টোরের নাম" },

  story: {
    subtitle: { type: String, default: "Our Story" },
    heading: { type: String, default: "আমরা কারা?" },
    paragraph1: {
      type: String,
      default:
        "একটি আধুনিক ই-কমার্স প্ল্যাটফর্ম যেখানে গ্রাহকরা সহজেই তাদের প্রয়োজনীয় পণ্য খুঁজে পান। আমরা ফ্যাশন, ইলেকট্রনিক্স, হোম & লিভিং, বিউটি এবং আরও অনেক ক্যাটাগরির পণ্য সরবরাহ করি।",
    },
    paragraph2: {
      type: String,
      default:
        "আমাদের লক্ষ্য শুধুমাত্র পণ্য বিক্রি করা নয়, বরং একটি বিশ্বস্ত সম্পর্ক তৈরি করা যেখানে প্রতিটি গ্রাহক আত্মবিশ্বাসের সাথে কেনাকাটা করতে পারেন।",
    },
  },

  stats: {
    type: [StatSchema],
    default: [
      { value: "10K+", label: "সন্তুষ্ট গ্রাহক" },
      { value: "5K+", label: "পণ্য" },
      { value: "50+", label: "ব্র্যান্ড" },
      { value: "24/7", label: "সাপোর্ট" },
    ],
  },

  mission: {
    title: { type: String, default: "আমাদের লক্ষ্য" },
    description: {
      type: String,
      default:
        "গ্রাহকদের জন্য সর্বোচ্চ মানের পণ্য, প্রতিযোগিতামূলক মূল্য এবং দ্রুত ডেলিভারি নিশ্চিত করা।",
    },
  },

  vision: {
    title: { type: String, default: "আমাদের ভিশন" },
    description: {
      type: String,
      default:
        "বাংলাদেশের অন্যতম সেরা ও সবচেয়ে বিশ্বস্ত ই-কমার্স প্ল্যাটফর্ম হিসেবে প্রতিষ্ঠিত হওয়া।",
    },
  },

  featuresSection: {
    subtitle: { type: String, default: "Why Choose Us" },
    heading: { type: String, default: "কেন আমাদের বেছে নেবেন?" },
    description: {
      type: String,
      default: "আমরা শুধুমাত্র একটি অনলাইন স্টোর নই, আমরা আপনার নির্ভরযোগ্য শপিং পার্টনার।",
    },
  },

  features: {
    type: [FeatureSchema],
    default: [
      {
        icon: "shield-check",
        title: "আসল পণ্যের নিশ্চয়তা",
        description: "প্রতিটি পণ্য যাচাই-বাছাই করে সরবরাহ করা হয়।",
      },
      {
        icon: "truck",
        title: "দ্রুত ডেলিভারি",
        description: "সারা দেশে দ্রুত ও নিরাপদ ডেলিভারি সেবা।",
      },
      {
        icon: "refresh-cw",
        title: "সহজ রিটার্ন",
        description: "নির্দিষ্ট শর্তে সহজ রিটার্ন ও রিফান্ড সুবিধা।",
      },
      {
        icon: "headphones",
        title: "গ্রাহক সাপোর্ট",
        description: "যেকোনো সমস্যায় আমাদের টিম সর্বদা প্রস্তুত।",
      },
    ],
  },

  cta: {
    title: { type: String, default: "আপনার পছন্দের পণ্য খুঁজে নিন" },
    description: {
      type: String,
      default: "হাজারো পণ্যের সংগ্রহ থেকে আজই আপনার প্রয়োজনীয় পণ্যটি অর্ডার করুন।",
    },
    buttonText: { type: String, default: "এখনই শপ করুন" },
    buttonLink: { type: String, default: "/products" },
  },

  updatedAt: { type: Date, default: Date.now },
});

const About = mongoose.models.About || mongoose.model("About", AboutSchema);

export default About;
