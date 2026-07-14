/**
 * ✅ Manual/mobile-banking payments (bKash/Nagad/etc.) must be verified
 * (accepted/rejected) by admin from Payments > Pending Verification
 * before the order can move forward in the status flow.
 * COD orders are exempt (cash is collected on delivery).
 */
export function needsPaymentVerification(o) {
  return (
    !!o?.paymentMethod &&
    o.paymentMethod !== "cod" &&
    o.paymentStatus === "pending"
  );
}

export function formatOrderTime(o) {
  const raw = o?.createdAt || o?.orderDate || o?.date;
  if (!raw) return "—";

  const d = new Date(raw);
  if (isNaN(d.getTime())) return "—";

  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
