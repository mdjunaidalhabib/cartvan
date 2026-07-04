import express from "express";
import Footer from "../../models/Footer.js";
import upload from "../../../utils/upload.js";
import { deleteByPublicId, buildOptimizedUrl } from "../../../utils/cloudinaryHelpers.js";
import cloudinary from "../../../utils/cloudinary.js";
import fs from "fs";

const router = express.Router();

// ✅ GET Footer (Public)
// FINAL path: GET /api/v1/footer
router.get("/", async (req, res) => {
  try {
    const footer = await Footer.findOne();
    if (!footer) return res.json({});

    const footerObj = footer.toObject();

    // ✅ socials → socialLinks নামে পাঠাও (frontend এর সাথে মিলিয়ে)
    footerObj.socialLinks = (footerObj.socials || []).map((s) => ({
      platform: s.platform,
      url: s.url,
    }));
    delete footerObj.socials;

    res.json(footerObj);
  } catch (err) {
    console.error("❌ Error fetching footer:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ POST Footer + optional logo (Admin only)
// FINAL path: POST /api/v1/admin/footer
router.post("/", upload.single("logo"), async (req, res) => {
  try {
    let data = { ...req.body };

    // Parse brand/contact/socialLinks JSON if sent as string
    if (data.brand && typeof data.brand === "string") {
      data.brand = JSON.parse(data.brand);
    }
    if (data.contact && typeof data.contact === "string") {
      data.contact = JSON.parse(data.contact);
    }
    if (data.socialLinks && typeof data.socialLinks === "string") {
      // ✅ frontend পাঠায় socialLinks → DB তে socials হিসেবে save
      const parsed = JSON.parse(data.socialLinks);
      data.socials = parsed.map((s) => ({ platform: s.platform, url: s.url }));
      delete data.socialLinks;
    }

    const footer = await Footer.findOne();

    // removeLogo request
    const removeLogo = data.removeLogo === "true";
    if (removeLogo && footer?.brand?.logoPublicId) {
      await deleteByPublicId(footer.brand.logoPublicId);
      data.brand = data.brand || {};
      data.brand.logo = "";
      data.brand.logoPublicId = "";
      delete data.removeLogo;
    }

    // Upload new logo if exists
    if (req.file) {
      if (footer?.brand?.logoPublicId) {
        await deleteByPublicId(footer.brand.logoPublicId);
      }

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "footer_logos",
      });

      fs.unlinkSync(req.file.path);

      data.brand = data.brand || {};
      data.brand.logo = buildOptimizedUrl(result.public_id); // ✅ f_auto,q_auto সহ optimized URL
      data.brand.logoPublicId = result.public_id;
    } else if (footer?.brand) {
      data.brand = {
        ...footer.brand.toObject?.() ?? footer.brand,
        ...(data.brand || {}),
      };
    }

    // Update or create
    let updatedFooter;
    if (!footer) {
      updatedFooter = await Footer.create(data);
    } else {
      Object.assign(footer, data);
      footer.updatedAt = new Date();
      updatedFooter = await footer.save();
    }

    // ✅ Response এ socials → socialLinks হিসেবে পাঠাও
    const responseObj = updatedFooter.toObject();
    responseObj.socialLinks = (responseObj.socials || []).map((s) => ({
      platform: s.platform,
      url: s.url,
    }));
    delete responseObj.socials;

    res.json({
      message: "✅ Footer updated successfully",
      footer: responseObj,
    });
  } catch (err) {
    console.error("❌ Error updating footer:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ DELETE Footer (Admin only)
// FINAL path: DELETE /api/v1/admin/footer
router.delete("/", async (req, res) => {
  try {
    const footer = await Footer.findOne();

    if (footer?.brand?.logoPublicId) {
      await deleteByPublicId(footer.brand.logoPublicId);
    }

    await Footer.deleteMany({});
    res.json({ message: "🗑️ Footer deleted" });
  } catch (err) {
    console.error("❌ Error deleting footer:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
