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
    // 🔥 timeZone lock kora holo Asia/Dhaka e, nahole server UTC e
    // thakle invoice e vul (UTC) time show hoy customer'r real time er bodole
    datePart: d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Dhaka",
    }),
    timePart: d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Dhaka",
    }),
  };
}

// 🔥 human-readable, sequential Order Number (e.g. #1024) used across the
// invoice instead of the 24-char Mongo ObjectId. Falls back to the old
// shortened-ObjectId format for legacy orders created before orderNumber
// existed (should not happen after the backfill script has been run).
function shortOrderId(order) {
  if (order?.orderNumber != null) return `#${order.orderNumber}`;
  const id = order?._id ?? order;
  return `#${id.toString().slice(-6).toUpperCase()}`;
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

/**
 * 🔥 FIX: String.prototype.replace(placeholder, value) treats certain
 * "$" sequences in the *replacement string* as special patterns
 * ($&, $`, $', $1, $$ ...). If any customer-entered field (name, phone,
 * address, note) happens to contain a "$", the previously-replaced or
 * surrounding template text could get spliced into the output — which is
 * exactly what caused fields to bleed into each other on the PDF.
 *
 * Using a function as the replacement value sidesteps this entirely:
 * whatever the function returns is inserted literally, with zero special
 * pattern interpretation.
 */
function safeReplace(str, placeholder, value) {
  return str.replace(placeholder, () => value);
}

// Only when the delivery charge was already paid online (bKash/Nagad,
// verified) do we split the summary into "Advance Payment" + "COD" rows.
// Plain COD orders (or manual payments still pending verification) keep
// the summary exactly as before — just Subtotal/Delivery/Discount/Total.
function buildExtraSummaryRowsHtml(order) {
  const isManualPayment = (order.paymentMethod || "cod") !== "cod";
  const isAdvancePaid = isManualPayment && order.paymentStatus === "paid";

  if (!isAdvancePaid) return "";

  const deliveryCharge = Number(order.deliveryCharge || 0);
  const total = Number(order.total || 0);
  const codAmount = Math.max(0, total - deliveryCharge);

  return `
        <div class="summary-row advance">
          <span class="label">Advance Payment</span><span>${formatCurrency(deliveryCharge)} tk</span>
        </div>
        <div class="summary-row codrow">
          <span class="label">COD</span><span>${formatCurrency(codAmount)} tk</span>
        </div>
  `;
}

// Plain payment method text shown next to "Payment:" — no highlight/badge.
function buildPaymentValueHtml(order) {
  return escapeHtml((order.paymentMethod || "cod").toUpperCase());
}

// 🔥 Payment Status is its own separate line in the header now (not crammed
// next to "Payment:", not in the note box). Only manual payments (bKash/
// Nagad) have a verification status to show — for plain COD there's
// nothing to verify, so this whole line is omitted for COD orders.
function buildPaymentStatusLineHtml(order) {
  const isManualPayment = (order.paymentMethod || "cod") !== "cod";
  if (!isManualPayment) return "";

  let statusHtml;
  if (order.paymentStatus === "paid") {
    statusHtml = `<span class="payment-status paid">Verified ✅</span>`;
  } else if (order.paymentStatus === "failed") {
    statusHtml = `<span class="payment-status failed">Rejected ❌</span>`;
  } else {
    statusHtml = `<span class="payment-status pending">Pending Verification ⚠️</span>`;
  }

  return `<div><strong>Payment Status:</strong> ${statusHtml}</div>`;
}

// Customer note only. Payment info now has its own place next to the
// Payment field in the header, so it no longer needs to be repeated here.
function buildNoteLineHtml(order) {
  return escapeHtml(order.billing?.note || "") || "—";
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

  // 🔥 all placeholder values collected up-front, then swapped in via a
  // single regex pass — one scan of the template instead of 13, and the
  // function-replacement form keeps "$" characters in user data literal.
  const values = {
    orderId: escapeHtml(shortOrderId(order)),
    date: escapeHtml(datePart),
    time: escapeHtml(timePart),
    payment: buildPaymentValueHtml(order),
    paymentStatusLine: buildPaymentStatusLineHtml(order),
    name: escapeHtml(order.billing?.name || ""),
    phone: escapeHtml(order.billing?.phone || ""),
    address: escapeHtml(order.billing?.address || ""),
    items: itemRows,
    subtotal: formatCurrency(order.subtotal),
    delivery: formatCurrency(order.deliveryCharge),
    discount: formatCurrency(order.discount || 0),
    total: formatCurrency(order.total),
    extraSummaryRows: buildExtraSummaryRowsHtml(order),
    noteLine: buildNoteLineHtml(order),
  };

  const finalHtml = htmlTemplate.replace(/\{\{(\w+)\}\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match,
  );

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
          justify-content: flex-end;
          color: #666;
        ">
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
