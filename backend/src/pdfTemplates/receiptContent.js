import PDFDocument from "pdfkit";
import dayjs from "dayjs";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const BRAND_NAME = "হাবিব'স ফ্যাশন";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BENGALI_FONT = path.join(
  __dirname,
  "../fonts/NotoSansBengali-Regular.ttf"
);
const FALLBACK_FONT = "Helvetica";

function formatCurrency(amount) {
  return `৳${Number(amount || 0).toLocaleString()}`;
}

function drawTableRow(doc, y, item, fill = null) {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const tableWidth = right - left;

  if (fill) {
    doc.save();
    doc.rect(left, y, tableWidth, 20).fill(fill);
    doc.restore();
  }

  doc.fontSize(12).fillColor("black");

  const c1 = left + 5;
  const c2 = left + tableWidth * 0.5;
  const c3 = left + tableWidth * 0.65;
  const c4 = left + tableWidth * 0.85;

  doc.text(item.name, c1, y + 5, { width: tableWidth * 0.45 });
  doc.text(item.qty, c2, y + 5, { width: tableWidth * 0.15, align: "right" });
  doc.text(item.unitPrice, c3, y + 5, {
    width: tableWidth * 0.2,
    align: "right",
  });
  doc.text(item.total, c4, y + 5, { width: tableWidth * 0.15, align: "right" });
}

export function generateReceiptPDF(order, res) {
  const doc = new PDFDocument({ size: "A4", margin: 72 });
  doc.pipe(res);

  const hasBengaliFont = fs.existsSync(BENGALI_FONT);
  doc.font(hasBengaliFont ? BENGALI_FONT : FALLBACK_FONT);

  // background
  doc.save();
  doc.fillColor("#F9FAFB");
  doc.rect(0, 0, doc.page.width, doc.page.height).fill();
  doc.restore();

  // header
  doc
    .fillColor("#1D4ED8")
    .fontSize(24)
    .text(`${BRAND_NAME}`, { align: "center" });
  doc.moveDown(0.3);
  doc.fillColor("#374151").fontSize(14).text("রসিদ", { align: "center" });
  doc.moveDown(1);

  // order info
  doc
    .fillColor("#1E40AF")
    .fontSize(14)
    .text("অর্ডারের তথ্য", { underline: true });
  doc.fillColor("black").fontSize(12);
  doc.text(
    `অর্ডার আইডি: ${order?.orderNumber != null ? `#${order.orderNumber}` : order?._id || "-"}`
  );
  doc.text(`তারিখ: ${dayjs(order?.createdAt).format("DD/MM/YYYY HH:mm")}`);
  doc.text(`স্ট্যাটাস: ${order?.status || "-"}`);
  doc.moveDown(0.5);

  doc
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .strokeColor("#E5E7EB")
    .stroke();
  doc.moveDown(0.5);

  // billing info
  const billing = order?.billing || {};
  const address = [
    billing.address,
    billing.thana,
    billing.district,
    billing.division,
  ]
    .filter(Boolean)
    .join(", ");

  doc
    .fillColor("#166534")
    .fontSize(14)
    .text("গ্রাহকের তথ্য", { underline: true });
  doc.fillColor("black").fontSize(12);
  doc.text(`নাম: ${billing.name || "-"}`);
  doc.text(`ফোন: ${billing.phone || "-"}`);
  doc.text(`ঠিকানা: ${address || "-"}`);
  doc.moveDown(0.5);

  doc
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .strokeColor("#E5E7EB")
    .stroke();
  doc.moveDown(0.5);

  // items
  doc
    .fillColor("#374151")
    .fontSize(14)
    .text("ক্রয়কৃত পণ্যসমূহ", { underline: true });
  doc.moveDown(0.3);

  const items = order?.items || [];
  let y = doc.y;

  drawTableRow(
    doc,
    y,
    { name: "পণ্য", qty: "পরিমাণ", unitPrice: "মূল্য", total: "মোট" },
    "#E5E7EB"
  );
  y += 20;

  items.forEach((item, i) => {
    // page overflow fix
    if (y > doc.page.height - doc.page.margins.bottom - 40) {
      doc.addPage();
      doc.font(hasBengaliFont ? BENGALI_FONT : FALLBACK_FONT);

      y = doc.page.margins.top;
      drawTableRow(
        doc,
        y,
        { name: "পণ্য", qty: "পরিমাণ", unitPrice: "মূল্য", total: "মোট" },
        "#E5E7EB"
      );
      y += 20;
    }

    const fill = i % 2 === 0 ? "#F3F4F6" : null;
    drawTableRow(
      doc,
      y,
      {
        name: item?.name || "-",
        qty: String(item?.qty || 0),
        unitPrice: formatCurrency(item?.price),
        total: formatCurrency((item?.qty || 0) * (item?.price || 0)),
      },
      fill
    );
    y += 20;
  });

  doc.moveDown(1);

  // totals
  doc.fillColor("#B45309").fontSize(14).text("মূল্যসারণি", { underline: true });
  doc.fillColor("black").fontSize(12);
  doc.text(`মোট: ${formatCurrency(order?.subtotal)}`, { align: "right" });
  doc.text(`ডেলিভারি চার্জ: ${formatCurrency(order?.deliveryCharge)}`, {
    align: "right",
  });

  if ((order?.discount || 0) > 0) {
    doc.text(`ডিসকাউন্ট: -${formatCurrency(order.discount)}`, {
      align: "right",
    });
  }

  doc
    .fontSize(16)
    .fillColor("#15803D")
    .text(`সর্বমোট: ${formatCurrency(order?.total)}`, {
      align: "right",
      underline: true,
    });

  // ✅ Payment / Advance summary — makes it clear on the printed invoice
  // whether the delivery charge was already paid online (bKash/Nagad),
  // so the delivery man doesn't collect it again by mistake.
  doc.moveDown(1);

  const isManualPayment = (order?.paymentMethod || "cod") !== "cod";
  const isAdvancePaid = isManualPayment && order?.paymentStatus === "paid";
  const deliveryCharge = Number(order?.deliveryCharge || 0);
  const grandTotal = Number(order?.total || 0);
  const cashToCollect = isAdvancePaid
    ? Math.max(0, grandTotal - deliveryCharge)
    : grandTotal;

  const boxLeft = doc.page.margins.left;
  const boxWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const boxTop = doc.y;
  const boxHeight = isManualPayment ? 78 : 52;

  doc.save();
  doc
    .roundedRect(boxLeft, boxTop, boxWidth, boxHeight, 6)
    .fill(isAdvancePaid ? "#ECFDF5" : "#FFF7ED");
  doc.restore();
  doc
    .roundedRect(boxLeft, boxTop, boxWidth, boxHeight, 6)
    .strokeColor(isAdvancePaid ? "#10B981" : "#F59E0B")
    .lineWidth(1)
    .stroke();

  let ty = boxTop + 10;

  if (isManualPayment) {
    doc
      .fontSize(11)
      .fillColor(isAdvancePaid ? "#166534" : "#B45309")
      .text(
        isAdvancePaid
          ? `✅ ডেলিভারি চার্জ ${formatCurrency(deliveryCharge)} ইতিমধ্যে ${
              order?.paymentDetails?.methodName || order.paymentMethod
            }-এর মাধ্যমে অগ্রিম পরিশোধিত হয়েছে${
              order?.paymentDetails?.transactionId
                ? ` (TrxID: ${order.paymentDetails.transactionId})`
                : ""
            }।`
          : `⚠️ ${order.paymentMethod} পেমেন্ট এখনো Verify হয়নি — সম্পূর্ণ টাকা ডেলিভারির সময় সংগ্রহ করুন।`,
        boxLeft + 12,
        ty,
        { width: boxWidth - 24 }
      );
    ty = doc.y + 6;
  }

  doc
    .fontSize(13)
    .fillColor("#111827")
    .text("ডেলিভারির সময় সংগ্রহযোগ্য (Cash to Collect):", boxLeft + 12, ty, {
      continued: false,
    });
  doc
    .fontSize(18)
    .fillColor("#DC2626")
    .text(formatCurrency(cashToCollect), boxLeft + 12, doc.y + 2, {
      width: boxWidth - 24,
      align: "right",
    });

  doc.y = boxTop + boxHeight + 10;

  // footer
  doc.moveDown(1);
  doc
    .fillColor("#6B7280")
    .fontSize(12)
    .text("✅ আমাদের সাথে কেনাকাটার জন্য ধন্যবাদ!", { align: "center" });
  doc.text("📞 01234-567890 | ✉️ info@habibsfashion.com", { align: "center" });

  doc.end();
}
