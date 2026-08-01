import mongoose from "mongoose";

/**
 * ✅ Support Page Content
 * "/support" পেজের সব কন্টেন্ট (Team/Founder & CEO, FAQ/Info sections, Contact)
 * সম্পূর্ণ Admin panel থেকে control হবে — কোনো hardcoded টেক্সট নেই।
 * About/PrivacyPolicy এর মতোই এটা একটা singleton document (সবসময় ১টাই থাকবে)।
 */

const TeamMemberSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  title: { type: String, default: "" }, // e.g. "Founder & CEO"
  photo: { type: String, default: "" }, // Cloudinary image URL
  photoPublicId: { type: String, default: "" }, // Cloudinary public_id (পুরনো ছবি delete করতে দরকার)
  bio: { type: String, default: "" },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
});

const SectionSchema = new mongoose.Schema({
  heading: { type: String, required: true, trim: true },
  content: { type: String, default: "" },
});

const SupportSchema = new mongoose.Schema({
  pageTitle: { type: String, default: "সাপোর্ট সেন্টার" },
  intro: {
    type: String,
    default:
      "আপনার যেকোনো প্রশ্ন, সমস্যা বা মতামতের জন্য আমরা সবসময় পাশে আছি। নিচে আমাদের টিম ও যোগাযোগের তথ্য দেওয়া হলো।",
  },

  supportEmail: { type: String, default: "" },
  supportPhone: { type: String, default: "" },
  workingHours: { type: String, default: "" }, // e.g. "সকাল ৯টা - রাত ৯টা (৭ দিন)"

  team: {
    type: [TeamMemberSchema],
    default: [
      {
        name: "আপনার নাম",
        title: "Founder & CEO",
        photo: "",
        bio: "আমাদের প্রতিষ্ঠাতা ও প্রধান নির্বাহী কর্মকর্তা।",
        email: "",
        phone: "",
      },
    ],
  },

  sections: {
    type: [SectionSchema],
    default: [
      {
        heading: "কীভাবে সাপোর্ট পাবেন",
        content:
          "যেকোনো সমস্যায় আমাদের ইমেইল বা ফোনে যোগাযোগ করুন, আমরা যত দ্রুত সম্ভব উত্তর দেওয়ার চেষ্টা করি।",
      },
    ],
  },

  updatedAt: { type: Date, default: Date.now },
});

const Support = mongoose.models.Support || mongoose.model("Support", SupportSchema);

export default Support;
