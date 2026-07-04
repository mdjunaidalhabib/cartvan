import express from "express";
import multer from "multer";
import cloudinary from "../../../utils/cloudinary.js";
import { buildOptimizedUrl } from "../../../utils/cloudinaryHelpers.js";

const router = express.Router();

// ✅ memory storage for cloudinary upload (best)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ✅ POST /profile/avatar
router.post("/avatar", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "avatars",
        resource_type: "image",
      },
      (err, result) => {
        if (err) {
          console.error("❌ Cloudinary upload error:", err);
          return res.status(500).json({ message: "Upload failed" });
        }

        return res.status(200).json({ url: buildOptimizedUrl(result.public_id) }); // ✅ f_auto,q_auto সহ optimized URL
      }
    );

    stream.end(req.file.buffer);
  } catch (error) {
    console.error("❌ Avatar upload route error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
