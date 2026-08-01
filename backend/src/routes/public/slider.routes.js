import express from "express";
import Slider from "../../models/Slider.js";
import { cacheResponse } from "../../middlewares/cacheResponse.js";

const router = express.Router();

/**
 * PUBLIC: Website slider images
 * GET /slider-images
 */
router.get("/", cacheResponse(), async (req, res) => {
  try {
    const slides = await Slider.find({ isActive: true })
      .sort({ order: 1 })
      .lean();
    res.json({ slides });
  } catch (err) {
    res.status(500).json({ message: "Failed to load slides" });
  }
});

export default router;
