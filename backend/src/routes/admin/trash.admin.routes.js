import express from "express";
import {
  getTrashList,
  restoreTrashItem,
  permanentDeleteTrashItem,
  emptyTrash,
} from "../../../controllers/trash/trash.controller.js";

const router = express.Router();

router.get("/", getTrashList);
router.post("/:id/restore", restoreTrashItem);

// ✅ "/empty" must come BEFORE "/:id" so it isn't swallowed as an :id param
router.delete("/empty", emptyTrash);
router.delete("/:id", permanentDeleteTrashItem);

export default router;
