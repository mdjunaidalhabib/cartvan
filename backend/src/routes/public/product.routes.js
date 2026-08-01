import express from "express";
import {
  getProductsPublic,
  getProductByIdPublic,
  getProductsByCategoryPublic,
  addReviewToProduct,
  updateProductReview,
  deleteProductReview,
} from "../../../controllers/product/index.js";

import { userProtect } from "../../middlewares/userProtect.js";
import { cacheResponse } from "../../middlewares/cacheResponse.js";

const router = express.Router();

router.get("/", cacheResponse(), getProductsPublic);
router.get("/category/:categoryId", cacheResponse(), getProductsByCategoryPublic);
router.get("/:id", cacheResponse(), getProductByIdPublic);

router.post("/:id/review", userProtect, addReviewToProduct);
router.put("/:id/review/:reviewId", userProtect, updateProductReview);
router.delete("/:id/review/:reviewId", userProtect, deleteProductReview);

export default router;
