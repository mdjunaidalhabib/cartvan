import express from "express";
import Slider from "../../models/Slider.js";
import upload from "../../../utils/upload.js"; // multer
import fs from "fs";
import cloudinary from "../../../utils/cloudinary.js";
import { deleteByPublicId, buildOptimizedUrl } from "../../../utils/cloudinaryHelpers.js";
import sharp from "sharp";

const router = express.Router();

/**
 * ✅ SLIDER IMAGE RULE (SERVER-SIDE ENFORCE)
 * - INPUT: jpeg/png/webp allowed
 * - OUTPUT: WEBP only
 * - 1500×500 exactly
 * - max 100KB
 */
const SLIDER_IMAGE_RULE = {
  width: 1500,
  height: 500,
  maxBytes: 100 * 1024, // ✅ 100KB
  allowedInputTypes: ["image/webp", "image/jpeg", "image/png"],
};

/**
 * ✅ safe unlink
 */
const safeUnlink = (filePath) => {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {}
};

/**
 * ✅ Convert ANY input -> 1500×500 WEBP under 100KB
 * returns outputPath
 */
const convertToSliderWebp = async (inputPath) => {
  const outputPath = inputPath.replace(/\.\w+$/, "") + "__1500x500.webp";

  let quality = 90;

  let buffer = await sharp(inputPath)
    .resize(SLIDER_IMAGE_RULE.width, SLIDER_IMAGE_RULE.height, {
      fit: "cover",
      position: "centre",
    })
    .webp({ quality })
    .toBuffer();

  while (buffer.length > SLIDER_IMAGE_RULE.maxBytes && quality > 25) {
    quality -= 7;
    buffer = await sharp(inputPath)
      .resize(SLIDER_IMAGE_RULE.width, SLIDER_IMAGE_RULE.height, {
        fit: "cover",
        position: "centre",
      })
      .webp({ quality })
      .toBuffer();
  }

  if (buffer.length > SLIDER_IMAGE_RULE.maxBytes) {
    throw new Error(
      `Could not compress under ${Math.floor(
        SLIDER_IMAGE_RULE.maxBytes / 1024
      )}KB`
    );
  }

  fs.writeFileSync(outputPath, buffer);
  return outputPath;
};

/**
 * ✅ validate INPUT (jpeg/png/webp allowed)
 */
const validateSliderInputFile = (file) => {
  if (!file) return "";

  if (!SLIDER_IMAGE_RULE.allowedInputTypes.includes(file.mimetype)) {
    return "Only jpeg/png/webp allowed (Auto convert to 1500×500 WEBP)";
  }

  return "";
};

/**
 * ✅ helper: normalize serial/order to 1..n
 */
const normalizeOrders = async () => {
  const slides = await Slider.find().sort({ order: 1, createdAt: 1 });

  const ops = slides.map((s, i) => ({
    updateOne: {
      filter: { _id: s._id },
      update: { $set: { order: i + 1 } },
    },
  }));

  if (ops.length) await Slider.bulkWrite(ops);
};

/**
 * ✅ GET all slides (admin)
 */
router.get("/", async (req, res) => {
  try {
    const slides = await Slider.find().sort({ order: 1 });
    res.json({ slides });
  } catch (err) {
    res.status(500).json({ message: "Failed to load slides" });
  }
});

/**
 * ✅ Reorder (bulk update)
 */
router.patch("/reorder", async (req, res) => {
  try {
    const { reordered = [] } = req.body;

    const ops = reordered.map((o) => ({
      updateOne: {
        filter: { _id: o._id },
        update: { $set: { order: Number(o.order) } },
      },
    }));

    if (ops.length) await Slider.bulkWrite(ops);

    await normalizeOrders();

    const slides = await Slider.find().sort({ order: 1 });
    res.json({ message: "✅ Reordered", slides });
  } catch (err) {
    console.error("Reorder failed:", err);
    res.status(500).json({ message: "Reorder failed" });
  }
});

/**
 * ✅ POST create/update slide (admin)
 * - auto shift order to avoid duplicates
 * - upload/remove image
 * - ✅ auto convert to 1500×500 WEBP under 100KB
 */
router.post("/", upload.single("image"), async (req, res) => {
  let convertedPath = null;

  try {
    let data = { ...req.body };

    if (data.slide && typeof data.slide === "string") {
      try {
        data.slide = JSON.parse(data.slide);
      } catch {
        data.slide = {};
      }
    }

    const slidePayload = data.slide || {};
    const removeImage = data.removeImage === "true";

    let slide = null;
    let oldOrder = null;

    if (slidePayload._id) {
      slide = await Slider.findById(slidePayload._id);
      if (slide) oldOrder = slide.order ?? 1;
    }

    const newOrder = Number(slidePayload.order ?? 1);

    /**
     * ✅ removeImage request
     */
    if (removeImage && slide?.srcPublicId) {
      await deleteByPublicId(slide.srcPublicId);
      slidePayload.src = "";
      slidePayload.srcPublicId = "";
      delete data.removeImage;
    }

    /**
     * ✅ handle new image upload (AUTO CONVERT + UPLOAD)
     */
    if (req.file) {
      const inputErr = validateSliderInputFile(req.file);

      if (inputErr) {
        safeUnlink(req.file.path);

        return res.status(400).json({
          message: inputErr,
          code: "INVALID_SLIDER_IMAGE",
          rule: {
            input: "jpeg/png/webp",
            output: "WEBP",
            width: 1500,
            height: 500,
            maxKB: 100,
          },
        });
      }

      // ✅ convert server-side
      convertedPath = await convertToSliderWebp(req.file.path);

      // ✅ delete old cloudinary image if exists
      if (slide?.srcPublicId) {
        await deleteByPublicId(slide.srcPublicId);
      }

      // ✅ upload converted webp
      const result = await cloudinary.uploader.upload(convertedPath, {
        folder: "slider_images",
        resource_type: "image",
      });

      // ✅ cleanup local temp
      safeUnlink(req.file.path);
      safeUnlink(convertedPath);

      slidePayload.src = buildOptimizedUrl(result.public_id); // ✅ f_auto,q_auto সহ optimized URL
      slidePayload.srcPublicId = result.public_id;
    } else if (slide) {
      // ✅ keep old image if no new image uploaded
      slidePayload.src = slidePayload.src || slide.src;
      slidePayload.srcPublicId = slidePayload.srcPublicId || slide.srcPublicId;
    }

    // =========================================================
    // ✅ AUTO SHIFT SERIAL / ORDER LOGIC (NO DUPLICATE)
    // =========================================================
    if (!slide) {
      // ✅ CREATE
      await Slider.updateMany(
        { order: { $gte: newOrder } },
        { $inc: { order: 1 } }
      );

      slide = await Slider.create(slidePayload);
    } else {
      // ✅ UPDATE
      if (oldOrder !== newOrder) {
        if (newOrder > oldOrder) {
          await Slider.updateMany(
            { order: { $gt: oldOrder, $lte: newOrder } },
            { $inc: { order: -1 } }
          );
        } else {
          await Slider.updateMany(
            { order: { $gte: newOrder, $lt: oldOrder } },
            { $inc: { order: 1 } }
          );
        }
      }

      Object.assign(slide, slidePayload);
      slide.updatedAt = new Date();
      await slide.save();
    }

    // ✅ save/update শেষে normalize
    await normalizeOrders();

    const slides = await Slider.find().sort({ order: 1 });
    res.json({ message: "✅ Slide saved", slide, slides });
  } catch (err) {
    console.error("❌ Error saving slide:", err);

    // ✅ cleanup temp files
    safeUnlink(req.file?.path);
    safeUnlink(convertedPath);

    res.status(500).json({ message: err.message || "Server error" });
  }
});

/**
 * ✅ DELETE ALL slides
 */
router.delete("/delete-all", async (req, res) => {
  try {
    const allSlides = await Slider.find();

    for (const s of allSlides) {
      if (s.srcPublicId) await deleteByPublicId(s.srcPublicId);
    }

    await Slider.deleteMany({});
    res.json({ message: "✅ All slides deleted" });
  } catch (err) {
    console.error("❌ Delete all error:", err);
    res.status(500).json({ message: "Failed to delete all slides" });
  }
});

/**
 * ✅ TOGGLE active/hidden
 */
router.patch("/:id/toggle", async (req, res) => {
  try {
    const slide = await Slider.findById(req.params.id);
    if (!slide) return res.status(404).json({ message: "Not found" });

    slide.isActive = !slide.isActive;
    await slide.save();

    res.json({ message: "✅ Status updated", slide });
  } catch (err) {
    res.status(500).json({ message: "Toggle failed" });
  }
});

/**
 * ✅ DELETE single slide
 */
router.delete("/:id", async (req, res) => {
  try {
    const slide = await Slider.findById(req.params.id);
    if (!slide) return res.status(404).json({ message: "Not found" });

    if (slide.srcPublicId) await deleteByPublicId(slide.srcPublicId);

    await slide.deleteOne();

    // ✅ normalize after delete
    await normalizeOrders();

    const slides = await Slider.find().sort({ order: 1 });
    res.json({ message: "✅ Slide deleted", slides });
  } catch (err) {
    console.error("Delete failed:", err);
    res.status(500).json({ message: "Delete failed" });
  }
});

export default router;
