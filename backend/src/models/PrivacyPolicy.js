import mongoose from "mongoose";

/**
 * ✅ Privacy Policy Page Content
 * "/privacy-policy" পেজের সব কন্টেন্ট সম্পূর্ণ Admin panel থেকে control হবে।
 * About/Footer এর মতোই এটা একটা singleton document (সবসময় ১টাই থাকবে)।
 * sections একটা array বলে Admin ইচ্ছামতো যত খুশি সেকশন যোগ/মুছে/সাজাতে পারবে —
 * তাই কন্টেন্ট পুরোপুরি ফ্লেক্সিবল, কোনো ফিক্সড স্ট্রাকচার নেই।
 */

const SectionSchema = new mongoose.Schema({
  heading: { type: String, required: true, trim: true },
  points: { type: [String], default: [] }, // একাধিক বুলেট পয়েন্ট
});

const PrivacyPolicySchema = new mongoose.Schema({
  pageTitle: { type: String, default: "প্রাইভেসি পলিসি" },
  intro: {
    type: String,
    default:
      "আপনার গোপনীয়তা আমাদের কাছে গুরুত্বপূর্ণ। এই পেজে আমরা ব্যাখ্যা করেছি কীভাবে আমরা আপনার তথ্য সংগ্রহ, ব্যবহার এবং সুরক্ষিত রাখি।",
  },
  effectiveDate: { type: String, default: "" }, // e.g. "০১ আগস্ট, ২০২৬"

  sections: {
    type: [SectionSchema],
    default: [
      {
        heading: "আমরা কী তথ্য সংগ্রহ করি",
        points: [
          "অর্ডার প্রক্রিয়াকরণের জন্য আপনার নাম, ফোন নম্বর ও ঠিকানা।",
          "যোগাযোগের জন্য আপনার ইমেইল ঠিকানা (যদি প্রদান করেন)।",
          "ওয়েবসাইট ব্যবহারের অভিজ্ঞতা উন্নত করতে ব্রাউজিং তথ্য।",
        ],
      },
      {
        heading: "তথ্যের ব্যবহার",
        points: [
          "অর্ডার প্রক্রিয়াকরণ ও ডেলিভারি নিশ্চিত করতে।",
          "গ্রাহক সেবা প্রদান ও সমস্যার সমাধান করতে।",
          "প্রয়োজনে গুরুত্বপূর্ণ আপডেট জানাতে।",
        ],
      },
      {
        heading: "তথ্যের সুরক্ষা",
        points: [
          "আপনার তথ্য সুরক্ষিত রাখতে যথাযথ প্রযুক্তিগত ব্যবস্থা গ্রহণ করা হয়।",
          "অনুমতি ছাড়া কোনো তৃতীয় পক্ষের কাছে তথ্য বিক্রি বা শেয়ার করা হয় না।",
        ],
      },
      {
        heading: "যোগাযোগ করুন",
        points: [
          "এই প্রাইভেসি পলিসি সম্পর্কে কোনো প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ করুন।",
        ],
      },
    ],
  },

  updatedAt: { type: Date, default: Date.now },
});

const PrivacyPolicy =
  mongoose.models.PrivacyPolicy ||
  mongoose.model("PrivacyPolicy", PrivacyPolicySchema);

export default PrivacyPolicy;
