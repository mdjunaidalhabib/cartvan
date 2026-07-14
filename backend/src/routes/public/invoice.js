import express from "express";
import Order from "../../models/Order.js";
import {
  getCachedInvoicePath,
  generateAndCacheInvoice,
} from "../../utils/invoice/invoiceService.js";

const router = express.Router();

/* ================= ROUTE ================= */

router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send("Order not found");

    const orderRef =
      order.orderNumber ?? order._id.toString().slice(-6).toUpperCase();
    const filename = `invoice-${orderRef}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    // ✅ FAST PATH: already pre-generated (order create) or cached
    // from a previous download -> serve straight from disk, instant.
    const cachedPath = getCachedInvoicePath(order);
    if (cachedPath) {
      return res.sendFile(cachedPath);
    }

    // ✅ FALLBACK: cache miss (older order, or background generation
    // hasn't finished/failed yet) -> generate now and cache for next time.
    const { pdfBuffer } = await generateAndCacheInvoice(order);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error("Invoice Error:", err);
    res.status(500).send("Error generating invoice");
  }
});

export default router;
