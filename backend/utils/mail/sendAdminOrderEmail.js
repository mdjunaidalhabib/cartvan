import nodemailer from "nodemailer";

export async function sendAdminOrderEmail({
  to,
  orderId,
  customerName,
  customerPhone,
  address,
  note,
  items,
  subtotal,
  deliveryCharge,
  discount,
  total,
  paymentMethod,
}) {
  const transporter = nodemailer.createTransport({
    host: "smtp.resend.com",
    port: 465,
    secure: true,
    auth: {
      user: "resend",
      pass: process.env.RESEND_API_KEY,
    },
  });

  const safe = (v) => (v == null ? "" : String(v));

  const normalizedItems = (Array.isArray(items) ? items : []).map((it) => ({
    name: safe(it?.name || it?.title || it?.productName || "Item"),
    color: it?.color ? safe(it.color) : "",
    qty: Number(it?.qty || 0),
    price: Number(it?.price || 0),
  }));

  const itemsHtml = normalizedItems
    .map(
      (it, idx) => `<tr>
        <td style="padding:8px;border:1px solid #eee;">${idx + 1}</td>
        <td style="padding:8px;border:1px solid #eee;">${it.name}${
        it.color ? ` (${it.color})` : ""
      }</td>
        <td style="padding:8px;border:1px solid #eee;text-align:center;">${
          it.qty
        }</td>
        <td style="padding:8px;border:1px solid #eee;text-align:right;">৳${
          it.price
        }</td>
        <td style="padding:8px;border:1px solid #eee;text-align:right;">৳${
          it.price * it.qty
        }</td>
      </tr>`
    )
    .join("");

  const itemsText = normalizedItems
    .map(
      (it, idx) =>
        `${idx + 1}. ${it.name}${it.color ? ` (${it.color})` : ""} x${
          it.qty
        } - ৳${it.price * it.qty}`
    )
    .join("\n");

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:700px;margin:auto;border:1px solid #eee;border-radius:10px;padding:16px;">
    <h2 style="margin:0;color:#db2777;">New Order Received</h2>
    <p style="margin:8px 0 0;color:#444;">Order ID: <b>${safe(orderId)}</b></p>

    <hr style="border:none;border-top:1px solid #eee;margin:14px 0;" />

    <h3 style="margin:0 0 8px;color:#111;">Customer Info</h3>
    <p style="margin:4px 0;">Name: <b>${safe(customerName)}</b></p>
    <p style="margin:4px 0;">Phone: <b>${safe(customerPhone)}</b></p>
    <p style="margin:4px 0;">Address: <b>${safe(address)}</b></p>
    ${note ? `<p style="margin:4px 0;">Note: <b>${safe(note)}</b></p>` : ""}

    <hr style="border:none;border-top:1px solid #eee;margin:14px 0;" />

    <h3 style="margin:0 0 8px;color:#111;">Items</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr>
          <th style="padding:8px;border:1px solid #eee;text-align:left;">#</th>
          <th style="padding:8px;border:1px solid #eee;text-align:left;">Product</th>
          <th style="padding:8px;border:1px solid #eee;text-align:center;">Qty</th>
          <th style="padding:8px;border:1px solid #eee;text-align:right;">Price</th>
          <th style="padding:8px;border:1px solid #eee;text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${
          itemsHtml ||
          `<tr><td colspan="5" style="padding:10px;border:1px solid #eee;">No items</td></tr>`
        }
      </tbody>
    </table>

    <hr style="border:none;border-top:1px solid #eee;margin:14px 0;" />

    <h3 style="margin:0 0 8px;color:#111;">Summary</h3>
    <p style="margin:4px 0;">Subtotal: <b>৳${Number(subtotal || 0)}</b></p>
    <p style="margin:4px 0;">Delivery: <b>৳${Number(
      deliveryCharge || 0
    )}</b></p>
    <p style="margin:4px 0;">Discount: <b>৳${Number(discount || 0)}</b></p>
    <p style="margin:8px 0;font-size:18px;color:#db2777;">Grand Total: <b>৳${Number(
      total || 0
    )}</b></p>
    <p style="margin:4px 0;">Payment Method: <b>${safe(paymentMethod)}</b></p>

    <hr style="border:none;border-top:1px solid #eee;margin:14px 0;" />
    <p style="margin:0;color:#666;font-size:12px;">This is an automated notification.</p>
  </div>
  `;

  const text = `New Order Received
Order ID: ${safe(orderId)}

Customer Info
Name: ${safe(customerName)}
Phone: ${safe(customerPhone)}
Address: ${safe(address)}
${note ? `Note: ${safe(note)}\n` : ""}
Items
${itemsText || "No items"}

Summary
Subtotal: ৳${Number(subtotal || 0)}
Delivery: ৳${Number(deliveryCharge || 0)}
Discount: ৳${Number(discount || 0)}
Grand Total: ৳${Number(total || 0)}
Payment Method: ${safe(paymentMethod)}

This is an automated notification.`;

  await transporter.sendMail({
    from: `"Order Notification" <${process.env.EMAIL_FROM}>`,
    to,
    replyTo: process.env.EMAIL_FROM,
    subject: `New Order Received - ${orderId}`,
    text,
    html,
    messageId: `<order-${orderId}-${Date.now()}@${process.env.EMAIL_FROM.split(
      "@"
    )[1]}>`,
  });
}
