import express from "express";
import fs from "fs";
import sharp from "sharp";
import HomepagePopup from "../../models/HomepagePopup.js";
import { popupUpload } from "../../../utils/cloudinary/upload.js";
import cloudinary from "../../../utils/cloudinary.js";
import { deleteByPublicId, buildOptimizedUrl } from "../../../utils/cloudinaryHelpers.js";

const router = express.Router();

/**
 * ✅ HOMEPAGE POPUP IMAGE RULE (SERVER-SIDE ENFORCE)
 * - INPUT: jpeg/png/webp allowed
 * - OUTPUT: WEBP only, 800×800 (1:1), max 200KB
 */
const POPUP_IMAGE_RULE = {
  width: 800,
  height: 800,
  maxBytes: 200 * 1024,
  allowedInputTypes: ["image/webp", "image/jpeg", "image/png"],
};

const safeUnlink = (filePath) => {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {}
};

const convertToPopupWebp = async (inputPath) => {
  const outputPath = inputPath.replace(/\.\w+$/, "") + "__800x800.webp";

  let quality = 90;

  let buffer = await sharp(inputPath)
    .resize(POPUP_IMAGE_RULE.width, POPUP_IMAGE_RULE.height, {
      fit: "cover",
      position: "centre",
    })
    .webp({ quality })
    .toBuffer();

  while (buffer.length > POPUP_IMAGE_RULE.maxBytes && quality > 25) {
    quality -= 7;
    buffer = await sharp(inputPath)
      .resize(POPUP_IMAGE_RULE.width, POPUP_IMAGE_RULE.height, {
        fit: "cover",
        position: "centre",
      })
      .webp({ quality })
      .toBuffer();
  }

  if (buffer.length > POPUP_IMAGE_RULE.maxBytes) {
    throw new Error(
      `Could not compress under ${Math.floor(POPUP_IMAGE_RULE.maxBytes / 1024)}KB`
    );
  }

  fs.writeFileSync(outputPath, buffer);
  return outputPath;
};

const validatePopupInputFile = (file) => {
  if (!file) return "";

  if (!POPUP_IMAGE_RULE.allowedInputTypes.includes(file.mimetype)) {
    return "Only jpeg/png/webp allowed (Auto convert to 800×800 WEBP)";
  }

  return "";
};

/**
 * ✅ GET — Admin (settings page load এ দরকার)
 * FINAL path: GET /api/v1/admin/homepage-popup
 */
router.get("/", async (req, res) => {
  try {
    const data = await HomepagePopup.findOne();
    res.json(data || { image: "", enabled: false });
  } catch (err) {
    console.error("❌ Error fetching homepage popup:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * ✅ POST — Admin create/update (image upload + toggle)
 * FINAL path: POST /api/v1/admin/homepage-popup
 */
router.post("/", popupUpload.single("image"), async (req, res) => {
  let convertedPath = null;

  try {
    const { enabled, removeImage } = req.body;

    const existing = await HomepagePopup.findOne();

    const updateData = {
      image: existing?.image || "",
      imagePublicId: existing?.imagePublicId || "",
      enabled:
        enabled !== undefined ? enabled === "true" || enabled === true : existing?.enabled ?? false,
      updatedAt: new Date(),
    };

    // ✅ remove image request
    if (removeImage === "true" && existing?.imagePublicId) {
      await deleteByPublicId(existing.imagePublicId);
      updateData.image = "";
      updateData.imagePublicId = "";
    }

    // ✅ handle new image upload (auto convert + upload)
    if (req.file) {
      const inputErr = validatePopupInputFile(req.file);

      if (inputErr) {
        safeUnlink(req.file.path);

        return res.status(400).json({
          message: inputErr,
          code: "INVALID_POPUP_IMAGE",
          rule: {
            input: "jpeg/png/webp",
            output: "WEBP",
            width: 800,
            height: 800,
            maxKB: 200,
          },
        });
      }

      convertedPath = await convertToPopupWebp(req.file.path);

      if (existing?.imagePublicId) {
        await deleteByPublicId(existing.imagePublicId);
      }

      const result = await cloudinary.uploader.upload(convertedPath, {
        folder: "homepage_popup",
        resource_type: "image",
      });

      safeUnlink(req.file.path);
      safeUnlink(convertedPath);

      updateData.image = buildOptimizedUrl(result.public_id);
      updateData.imagePublicId = result.public_id;
    }

    let updated;
    if (!existing) {
      updated = await HomepagePopup.create(updateData);
    } else {
      Object.assign(existing, updateData);
      updated = await existing.save();
    }

    res.json({ message: "✅ Homepage popup updated", data: updated });
  } catch (err) {
    console.error("❌ Error updating homepage popup:", err);

    safeUnlink(req.file?.path);
    safeUnlink(convertedPath);

    res.status(500).json({ message: err.message || "Server error" });
  }
});

export default router;
