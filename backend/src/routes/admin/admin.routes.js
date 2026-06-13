import express from "express";
import Admin from "../../models/Admin.js";
import fs from "fs";

import upload from "../../../utils/cloudinary/upload.js";
import cloudinary from "../../../utils/cloudinary/cloudinary.js";
import { deleteByPublicId } from "../../../utils/cloudinary/cloudinaryHelpers.js";

import {
  protect,
  superAdminOnly,
} from "../../middlewares/adminAuthMiddleware.js";

import { loginAdmin, logoutAdmin } from "../../../controllers/auth/index.js";

const router = express.Router();

router.post("/login", loginAdmin);
router.post("/logout", protect, logoutAdmin);

// ✅ VERIFY
router.get("/verify", protect, async (req, res) => {
  try {
    const freshAdmin = await Admin.findById(req.admin._id).select("-password");

    if (!freshAdmin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    res.json({
      message: "✅ Auth verified",
      admin: freshAdmin,
    });
  } catch (error) {
    console.error("Verify Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ GET PROFILE
router.get("/me", protect, async (req, res) => {
  try {
    res.json(req.admin);
  } catch (err) {
    console.error("Get Profile Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ UPDATE PROFILE (🔥 FULL FIXED)
router.put("/me", protect, upload.single("avatar"), async (req, res) => {
  try {
    // 🔹 STEP 1: parse profile JSON safely
    let data = {};

    if (req.body.profile) {
      try {
        data = JSON.parse(req.body.profile);
      } catch (e) {
        console.error("Profile parse error:", e);
        data = {};
      }
    }

    const admin = await Admin.findById(req.admin._id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // 🔥 STEP 2: FIXED removeAvatar (support both places)
    const removeAvatar =
      req.body.removeAvatar === "true" || data.removeAvatar === "true";

    if (removeAvatar && admin.avatarPublicId) {
      await deleteByPublicId(admin.avatarPublicId);

      admin.avatar = "";
      admin.avatarPublicId = "";
    }

    // 🔥 STEP 3: upload new avatar
    if (req.file) {
      // old image delete
      if (admin.avatarPublicId) {
        await deleteByPublicId(admin.avatarPublicId);
      }

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "admin_avatars",
      });

      // remove temp file
      fs.unlinkSync(req.file.path);

      admin.avatar = result.secure_url;
      admin.avatarPublicId = result.public_id;
    }

    // 🔹 STEP 4: update fields
    if (data.name !== undefined) admin.name = data.name;
    if (data.username !== undefined) admin.username = data.username;
    if (data.phone !== undefined) admin.phone = data.phone;
    if (data.address !== undefined) admin.address = data.address;

    await admin.save();

    res.json({
      message: "✅ Profile updated",
      admin,
    });
  } catch (err) {
    console.error("Update Profile Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ CHANGE PASSWORD
router.put("/me/password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current & new password required" });
    }

    const admin = await Admin.findById(req.admin._id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const ok = await admin.matchPassword(currentPassword);
    if (!ok) {
      return res.status(400).json({ message: "❌ Current password incorrect" });
    }

    admin.password = newPassword;
    await admin.save();

    res.json({ message: "✅ Password updated successfully" });
  } catch (err) {
    console.error("Password Update Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
