import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Order from "../../models/Order.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= PATHS ================= */

// backend/src/utils/invoice -> backend
const BACKEND_ROOT = path.join(__dirname, "../../../");
const PUBLIC_DIR = path.join(BACKEND_ROOT, "public");
const TEMPLATE_PATH = path.join(BACKEND_ROOT, "templates/invoice.html");
const CSS_PATH = path.join(PUBLIC_DIR, "invoice.css");
const BG_IMAGE_PATH = path.join(PUBLIC_DIR, "invoice-template.png");

// where generated PDFs are cached on disk
export const INVOICE_CACHE_DIR = path.join(BACKEND_ROOT, "uploads", "invoices");

function ensureCacheDir() {
  if (!fs.existsSync(INVOICE_CACHE_DIR)) {
    fs.mkdirSync(INVOICE_CACHE_DIR, { recursive: true });
  }
}

function getInvoiceFilePath(orderId) {
  return path.join(INVOICE_CACHE_DIR, `${orderId}.pdf`);
}

/* ================= STATIC ASSETS (loaded once) ================= */

let htmlTemplateCache = null;
let cssCache = null;
let bgImageBase64Cache = null;

function loadStaticAssets() {
  if (htmlTemplateCache === null) {
    htmlTemplateCache = fs.readFileSync(TEMPLATE_PATH, "utf8");
  }
  if (cssCache === null) {
    cssCache = fs.readFileSync(CSS_PATH, "utf8");
  }
  if (bgImageBase64Cache === null) {
    bgImageBase64Cache = `data:image/png;base64,${fs
      .readFileSync(BG_IMAGE_PATH)
      .toString("base64")}`;
  }
  return {
    htmlTemplate: htmlTemplateCache,
    css: cssCache,
    bgImageBase64: bgImageBase64Cache,
  };
}

/* ================= PUPPETEER HELPER ================= */

let browser = null;

async function getBrowser() {
  if (browser && browser.connected) {
    return browser;
  }

  browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  return browser;
}

/* ================= HELPERS ================= */

function formatDateTime(date) {
  const d = new Date(date);
  return {
    datePart: d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    timePart: d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  };
}

function truncate(text = "", max = 35) {
  return text.length > max ? text.slice(0, max) + "..." : text;
}

function formatCurrency(num) {
  return Number(num || 0).toLocaleString("en-BD");
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ================= HTML BUILD ================= */

// minimum rows the items table should always show; real rows fill in from
// the top and any leftover slots stay blank so the table keeps its shape
// on orders with only 1-2 items. Orders with more items than this simply
// grow past it — nothing gets cut off.
const MIN_ITEM_ROWS = 8;

function buildEmptyRow() {
  return `
        <div class="row empty">
          <span>&nbsp;</span>
          <span>&nbsp;</span>
          <span>&nbsp;</span>
          <span>&nbsp;</span>
          <span>&nbsp;</span>
        </div>
      `;
}

function buildInvoiceHtml(order) {
  const { htmlTemplate, bgImageBase64 } = loadStaticAssets();
  const { datePart, timePart } = formatDateTime(order.createdAt);

  const items = order.items || [];

  const filledRows = items
    .map((item, index) => {
      const price = formatCurrency(item.price);
      const total = formatCurrency(item.qty * item.price);

      return `
        <div class="row">
          <span>${index + 1}</span>
          <span>${escapeHtml(truncate(item.name))}</span>
          <span>${price}</span>
          <span>${item.qty}</span>
          <span>${total}</span>
        </div>
      `;
    })
    .join("");

  const emptyRowsNeeded = Math.max(MIN_ITEM_ROWS - items.length, 0);
  const emptyRows = Array.from({ length: emptyRowsNeeded }, buildEmptyRow).join(
    "",
  );

  const itemRows = filledRows + emptyRows;

  const finalHtml = htmlTemplate
    .replace("{{orderId}}", escapeHtml(order._id.toString()))
    .replace("{{date}}", escapeHtml(datePart))
    .replace("{{time}}", escapeHtml(timePart))
    .replace(
      "{{payment}}",
      escapeHtml((order.paymentMethod || "").toUpperCase()),
    )
    .replace("{{name}}", escapeHtml(order.billing?.name || ""))
    .replace("{{phone}}", escapeHtml(order.billing?.phone || ""))
    .replace("{{address}}", escapeHtml(order.billing?.address || ""))
    .replace("{{items}}", itemRows)
    .replace("{{subtotal}}", formatCurrency(order.subtotal))
    .replace("{{delivery}}", formatCurrency(order.deliveryCharge))
    .replace("{{discount}}", formatCurrency(order.discount || 0))
    .replace("{{total}}", formatCurrency(order.total))
    .replace("{{note}}", escapeHtml(order.billing?.note || ""));

  return { finalHtml, bgImageBase64 };
}

/* ================= PDF BUFFER ================= */

async function generateInvoicePdfBuffer(order) {
  let page;
  try {
    const { finalHtml, bgImageBase64 } = buildInvoiceHtml(order);

    const activeBrowser = await getBrowser();
    page = await activeBrowser.newPage();

    await page.setContent(finalHtml, { waitUntil: "networkidle0" });
    await page.addStyleTag({ path: CSS_PATH });
    await page.addStyleTag({
      content: `.page { background-image: url("${bgImageBase64}"); }`,
    });
    await page.evaluateHandle("document.fonts.ready");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `<div></div>`,
      footerTemplate: `
        <div style="
          width: 100%;
          font-family: Arial;
          font-size: 10px;
          padding: 0 40px 10px;
          display: flex;
          justify-content: space-between;
          color: #666;
        ">
          <span>Invoice #${order._id.toString().slice(-6)}</span>
          <span>
            Page <span class="pageNumber"></span> of
            <span class="totalPages"></span>
          </span>
        </div>
      `,
      margin: { top: "20px", bottom: "60px", left: "0px", right: "0px" },
    });

    return pdfBuffer;
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
  }
}

/* ================= PUBLIC API ================= */

/**
 * Generate a fresh invoice PDF for the given order, write it to the disk
 * cache, and stamp the order with the cache path + timestamp.
 * Safe to call from a background job (order create) or on-demand (cache miss).
 */
export async function generateAndCacheInvoice(orderIdOrOrder) {
  ensureCacheDir();

  const order =
    typeof orderIdOrOrder === "string" || orderIdOrOrder?._bsontype
      ? await Order.findById(orderIdOrOrder)
      : orderIdOrOrder;

  if (!order) {
    throw new Error("Order not found for invoice generation");
  }

  const pdfBuffer = await generateInvoicePdfBuffer(order);
  const filePath = getInvoiceFilePath(order._id.toString());

  await fs.promises.writeFile(filePath, pdfBuffer);

  await Order.findByIdAndUpdate(order._id, {
    invoice: {
      cachedAt: new Date(),
      version: (order.invoice?.version || 0) + 1,
    },
  });

  return { filePath, pdfBuffer };
}

/**
 * Returns the cached PDF file path for an order, if a valid cache file
 * actually exists on disk. Returns null on a cache miss.
 */
export function getCachedInvoicePath(order) {
  if (!order?.invoice?.cachedAt) return null;
  const filePath = getInvoiceFilePath(order._id.toString());
  return fs.existsSync(filePath) ? filePath : null;
}

/**
 * Deletes the cached PDF (if any) and clears the cache stamp on the order,
 * so the next download regenerates a fresh copy. Call this whenever
 * order data that appears on the invoice changes (billing, discount, total...).
 */
export async function invalidateInvoiceCache(orderId) {
  const filePath = getInvoiceFilePath(orderId.toString());
  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath).catch(() => {});
  }
  await Order.findByIdAndUpdate(orderId, { $unset: { invoice: 1 } }).catch(
    () => {},
  );
}

/**
 * Fire-and-forget helper: regenerate the invoice in the background and
 * swallow errors (caller should not block the HTTP response on this).
 */
export function regenerateInvoiceInBackground(orderId) {
  generateAndCacheInvoice(orderId).catch((err) => {
    console.error(`❌ Background invoice generation failed (${orderId}):`, err);
  });
}

export { getInvoiceFilePath };
