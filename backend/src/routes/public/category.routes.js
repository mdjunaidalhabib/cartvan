import express from "express";
import {
  getCategoriesPublic,
  getCategoryByIdPublic,
} from "../../../controllers/category/index.js";
import { cacheResponse } from "../../middlewares/cacheResponse.js";

const router = express.Router();

router.get("/", cacheResponse(), getCategoriesPublic);
router.get("/:id", cacheResponse(), getCategoryByIdPublic);

export default router;
