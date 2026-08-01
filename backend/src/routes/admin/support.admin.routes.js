import express from "express";
import fs from "fs";
import Support from "../../models/Support.js";
import Footer from "../../models/Footer.js";
import { teamPhotoUpload } from "../../../utils/cloudinary/upload.js";
import cloudinary from "../../../utils/cloudinary/cloudinary.js";
import { deleteByPublicId, buildOptimizedUrl } from "../../../utils/cloudinary/cloudinaryHelpers.js";

const router = express.Router();

// ✅ GET Support (Admin — editing form এর জন্য)
// FINAL path: GET /admin/support
router.get("/", async (req, res) => {
  try {
    let support = await Support.findOne();
    if (!support) {
      // প্রথমবার তৈরি হলে ফুটারের কন্টাক্ট তথ্য (phone/email) থেকে শুরুর মান নেওয়া হয়
      const footer = await Footer.findOne();
      support = await Support.create({
        supportEmail: footer?.contact?.email || "",
        supportPhone: footer?.contact?.phone || "",
      });
    }
    res.json(support);
  } catch (err) {
    console.error("❌ Error fetching support (admin):", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ CREATE/UPDATE Support (Admin only)
// FINAL path: POST /admin/support
router.post("/", async (req, res) => {
  try {
    const data = { ...req.body };
    delete data._id;
    delete data.__v;

    data.updatedAt = new Date();

    const support = await Support.findOneAndUpdate(
      {},
      { $set: data },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    res.json({
      message: "✅ Support page updated successfully",
      support,
    });
  } catch (err) {
    console.error("❌ Error updating support:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// ✅ RESET Support to default (Admin only)
// FINAL path: DELETE /admin/support
router.delete("/", async (req, res) => {
  try {
    await Support.deleteMany({});
    // reset এর পরও ফুটারের কন্টাক্ট তথ্য থেকে phone/email আবার বসানো হয়
    const footer = await Footer.findOne();
    const support = await Support.create({
      supportEmail: footer?.contact?.email || "",
      supportPhone: footer?.contact?.phone || "",
    });
    res.json({ message: "🔄 Support page reset to default", support });
  } catch (err) {
    console.error("❌ Error resetting support:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ UPLOAD/REPLACE একটি টিম মেম্বারের ছবি (Admin only)
// FINAL path: POST /admin/support/team/:memberId/photo
router.post("/team/:memberId/photo", teamPhotoUpload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "কোনো ছবি পাওয়া যায়নি" });
    }

    const support = await Support.findOne();
    const member = support?.team?.id(req.params.memberId);

    if (!support || !member) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: "এই টিম মেম্বার পাওয়া যায়নি" });
    }

    if (member.photoPublicId) {
      await deleteByPublicId(member.photoPublicId);
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "support_team",
    });

    fs.unlinkSync(req.file.path);

    member.photo = buildOptimizedUrl(result.public_id);
    member.photoPublicId = result.public_id;
    support.updatedAt = new Date();
    await support.save();

    res.json({ message: "✅ ছবি আপলোড হয়েছে", support });
  } catch (err) {
    console.error("❌ Error uploading team photo:", err);
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {}
    }
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// ✅ একটি টিম মেম্বারের ছবি মুছে ফেলা (Admin only)
// FINAL path: DELETE /admin/support/team/:memberId/photo
router.delete("/team/:memberId/photo", async (req, res) => {
  try {
    const support = await Support.findOne();
    const member = support?.team?.id(req.params.memberId);

    if (!support || !member) {
      return res.status(404).json({ message: "এই টিম মেম্বার পাওয়া যায়নি" });
    }

    if (member.photoPublicId) {
      await deleteByPublicId(member.photoPublicId);
    }

    member.photo = "";
    member.photoPublicId = "";
    support.updatedAt = new Date();
    await support.save();

    res.json({ message: "🗑️ ছবি মুছে ফেলা হয়েছে", support });
  } catch (err) {
    console.error("❌ Error removing team photo:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
