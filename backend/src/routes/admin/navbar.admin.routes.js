import express from "express";
import Navbar from "../../models/Navbar.js";
import upload from "../../../utils/upload.js"; // multer
import fs from "fs";
import { deleteByPublicId, buildOptimizedUrl } from "../../../utils/cloudinaryHelpers.js";
import cloudinary from "../../../utils/cloudinary.js";

const router = express.Router();

// ✅ POST Navbar + optional logo upload (Admin only)
// FINAL path: POST /api/v1/admin/navbar
router.post("/", upload.single("logo"), async (req, res) => {
  try {
    let data = { ...req.body };

    // Parse brand JSON string
    if (data.brand && typeof data.brand === "string") {
      try {
        data.brand = JSON.parse(data.brand);
      } catch {
        data.brand = {};
      }
    }

    let navbar = await Navbar.findOne();

    // removeLogo request
    const removeLogo = data.removeLogo === "true";
    if (removeLogo && navbar?.brand?.logoPublicId) {
      await deleteByPublicId(navbar.brand.logoPublicId);

      data.brand = data.brand || {};
      data.brand.logo = "";
      data.brand.logoPublicId = "";
      delete data.removeLogo;
    }

    // Handle logo upload
    if (req.file) {
      // delete old logo by public id
      if (navbar?.brand?.logoPublicId) {
        await deleteByPublicId(navbar.brand.logoPublicId);
      }

      // upload new logo to NAVBAR folder
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "navbar_logos",
      });

      fs.unlinkSync(req.file.path);

      data.brand = data.brand || {};
      data.brand.logo = buildOptimizedUrl(result.public_id); // ✅ f_auto,q_auto সহ optimized URL
      data.brand.logoPublicId = result.public_id;
    } else if (navbar?.brand) {
      // file না এলে আগের logo/publicId রেখে দাও
      data.brand = {
        ...navbar.brand,
        ...(data.brand || {}),
      };
    }

    // Update or create
    if (!navbar) {
      navbar = await Navbar.create(data);
    } else {
      Object.assign(navbar, data);
      navbar.updatedAt = new Date();
      await navbar.save();
    }

    res.json({ message: "✅ Navbar updated successfully", navbar });
  } catch (err) {
    console.error("❌ Error updating navbar:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
