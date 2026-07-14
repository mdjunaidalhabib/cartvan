"use client";

import {
  Edit3,
  Trash2,
  Send,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import Badge from "../../Badge";
import CopyButton from "../../CopyButton";
import CourierStatus from "../../CourierStatus";

import {
  STATUS_LABEL,
  STATUS_OPTIONS,
  LOCKED_STATUSES,
  STATUS_FLOW,
  READY_STATUS,
} from "../shared/constants";
import { formatOrderTime, needsPaymentVerification } from "../shared/utils";

export default function OrderCard({
  o,
  expanded,
  setOpenId,
  selected,
  toggleOne,
  updatingId,
  onStatusChange,
  onEdit,
  onDelete,
  onSendCourier,

  // ✅ NEW: parent থেকে courier final sync handler পাঠাবেন
  onFinalStatusSync,
}) {
  const locked = LOCKED_STATUSES.includes(o.status);
  const paymentHold = !locked && needsPaymentVerification(o);
  const itemCount = o.items?.reduce((s, it) => s + (it.qty || 0), 0) || 0;
  const firstTwo = o.items?.slice(0, 2) || [];
  const moreCount = (o.items?.length || 0) - firstTwo.length;

  const isAdminCreated = o?.createdBy === "admin";

  const handleStatusUpdate = async (id, newStatus, order) => {
    try {
      // ✅ READY → send_to_courier হলে auto courier create
      if (order?.status === READY_STATUS && newStatus === "send_to_courier") {
        await onSendCourier(order);
        return;
      }

      await onStatusChange(id, { status: newStatus });
    } catch (error) {
      console.error("Status update failed", error);
    }
  };

  return (
    <div
      className={`border-b last:border-none transition-colors ${
        expanded ? "bg-gray-50/50" : "bg-white"
      }`}
    >
      {/* ===== COMPACT HEADER ===== */}
      <div className="px-2 py-2 flex gap-2 items-center bg-white">
        <input
          type="checkbox"
          className="h-3.5 w-3.5 rounded border-gray-300"
          checked={selected.includes(o._id)}
          onChange={() => toggleOne(o._id)}
          disabled={locked}
        />

        <button
          onClick={() => setOpenId(expanded ? null : o._id)}
          className="flex-1 flex justify-between items-center text-left min-w-0"
        >
          {/* LEFT */}
          <div className="flex-1 min-w-0 pr-1">
            {/* NAME + STATUS */}
            <div className="flex items-center gap-1.5 flex-wrap leading-none">
              <span className="text-[13px] font-bold text-gray-900 capitalize truncate">
                {o.billing?.name || "Unknown"}
              </span>

              <div className="leading-none">
                <Badge type={o.status}>{STATUS_LABEL[o.status]}</Badge>
              </div>
            </div>

            {/* Cancel Reason */}
            {o.status === "cancelled" && o.cancelReason && (
              <div className="text-[11px] text-red-600 leading-none mt-0.5">
                <span className="font-semibold">Reason:</span> {o.cancelReason}
              </div>
            )}

            {/* META ROW */}
            <div className="flex items-center flex-wrap gap-x-2 gap-y-0 text-[10px] text-gray-400 leading-none mt-0.5">
              {isAdminCreated && (
                <span className="text-blue-700 font-semibold">
                  Created by : {o?.createdByName || "Admin"}
                </span>
              )}

              <span className="font-mono">
                #{o.orderNumber ?? o._id.slice(-6)}
              </span>
              <span>• {formatOrderTime(o)}</span>
              <span>• {itemCount} items</span>
            </div>
          </div>

          {/* RIGHT */}
          <div className="text-right shrink-0 flex flex-col items-end">
            <div className="text-[14px] font-black text-gray-900 leading-tight">
              ৳{o.total}
            </div>
            <div
              className={`flex items-center gap-0.5 text-[9px] font-bold uppercase leading-none ${
                expanded ? "text-blue-600" : "text-gray-400"
              }`}
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </div>
          </div>
        </button>
      </div>

      {/* ===== EXPANDED CONTENT ===== */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-5 rounded-lg bg-white border border-gray-100 p-2 shadow-sm">
              <div className="text-[9px] font-bold text-gray-400 uppercase mb-1">
                Customer
              </div>
              <div className="font-bold text-gray-800 text-[11px] truncate">
                {o.billing?.name}
              </div>
              <div className="text-[10px] text-gray-600">
                {o.billing?.phone}
              </div>
              <div className="text-[10px] text-gray-500 line-clamp-2 mt-1 italic">
                {o.billing?.address}
              </div>
            </div>

            <div className="col-span-7 rounded-lg bg-white border border-gray-100 p-2 shadow-sm">
              <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase mb-1">
                <span>Items</span>
                <span>{o.items?.length || 0} total</span>
              </div>
              <div className="space-y-1.5">
                {firstTwo.map((it, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <img
                      src={it.image || "/placeholder.png"}
                      className="w-7 h-7 rounded border object-cover"
                      alt=""
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold truncate leading-tight">
                        {it.name}
                      </p>
                      <p className="text-[9px] text-gray-500">
                        Qty: {it.qty} • ৳{it.price}
                      </p>
                    </div>
                  </div>
                ))}

                {moreCount > 0 && (
                  <p className="text-[9px] text-blue-500 font-medium">
                    + {moreCount} more items
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-100/50 rounded-lg p-2 text-[11px] space-y-1">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>৳{o.subtotal}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery</span>
              <span>৳{o.deliveryCharge}</span>
            </div>
            {!!o.discount && (
              <div className="flex justify-between text-red-500 font-medium">
                <span>Discount</span>
                <span>-৳{o.discount}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1 mt-1 text-sm">
              <span>Total</span>
              <span>৳{o.total}</span>
            </div>
          </div>

          <div className="rounded-lg bg-white border border-gray-100 p-2 shadow-sm text-[11px] space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-bold text-gray-400 uppercase">
                Payment
              </span>
              <Badge>{o.paymentMethod?.toUpperCase()}</Badge>
              {o.paymentMethod !== "cod" && (
                <span
                  className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full border ${
                    o.paymentStatus === "paid"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : o.paymentStatus === "failed"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {o.paymentStatus === "paid"
                    ? "Verified"
                    : o.paymentStatus === "failed"
                      ? "Rejected"
                      : "Pending"}
                </span>
              )}
            </div>

            {o.paymentMethod !== "cod" && o.paymentDetails?.transactionId && (
              <div className="flex items-center gap-1 text-gray-600">
                <span className="text-gray-400">TrxID:</span>
                <span className="font-mono font-semibold text-gray-800 truncate">
                  {o.paymentDetails.transactionId}
                </span>
                <CopyButton value={o.paymentDetails.transactionId} />
              </div>
            )}

            {o.paymentMethod !== "cod" && o.paymentDetails?.senderNumber && (
              <div className="text-gray-500">
                Sender: {o.paymentDetails.senderNumber}
              </div>
            )}
          </div>

          {paymentHold && (
            <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
              ⏳ Payment verify হয়নি — status hold করা আছে। Payments পেজ থেকে Accept/Reject করুন।
            </div>
          )}

          <div className="flex items-center gap-2 w-full overflow-x-auto">
            {/* STATUS */}
            {paymentHold ? (
              <div className="h-10 min-w-[140px] flex items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-3 text-[11px] font-bold text-amber-700 shadow-sm">
                🔒 Payment Pending
              </div>
            ) : (
              <select
                className="h-10 min-w-[140px] rounded-lg border border-gray-200 px-3 text-[11px] font-bold bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                value={o.status}
                disabled={locked || updatingId === o._id}
                onChange={(e) => handleStatusUpdate(o._id, e.target.value, o)}
              >
                <option value={o.status} disabled>
                  {STATUS_LABEL[o.status]} (Current)
                </option>

                {STATUS_OPTIONS.filter(
                  (s) =>
                    (STATUS_FLOW[o.status] || []).includes(s) &&
                    s !== o.status,
                ).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            )}

            {/* ACTIONS */}
            <div className="flex items-center gap-1.5 shrink-0">
              <IconBtn
                onClick={() => onEdit(o)}
                className="bg-amber-400 hover:bg-amber-500 text-white transition"
              >
                <Edit3 size={16} />
              </IconBtn>

              <IconBtn
                onClick={() => onDelete?.(o)}
                className="bg-red-500 hover:bg-red-600 text-white transition"
              >
                <Trash2 size={16} />
              </IconBtn>

              {o.status === READY_STATUS && !o.courier?.trackingId && (
                <IconBtn
                  onClick={() =>
                    handleStatusUpdate(o._id, "send_to_courier", o)
                  }
                  disabled={updatingId === o._id}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50"
                >
                  <Send size={16} />
                </IconBtn>
              )}

              <a
                href={`/api/invoice/${o._id}`}
                target="_blank"
                rel="noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white p-3  rounded-lg transition flex items-center justify-center"
              >
                <FileText size={16} />
              </a>
            </div>
          </div>

          {/* ✅ COURIER STATUS + LIVE TRACKING (MOBILE) */}
          <CourierStatus
            trackingId={o.courier?.trackingId}
            courier={o.courier}
            orderId={o._id}
            orderStatus={o.status}
            onFinalStatus={(orderId, finalStatus) => {
              if (LOCKED_STATUSES.includes(o.status)) return;
              if (o.status === finalStatus) return;

              // ✅ Desktop এর মতো parent এ sync করাবে
              onFinalStatusSync?.(orderId, finalStatus);
            }}
          />

          {/* ✅ Cancel reason (Expanded section-এও চাইলে দেখাতে পারেন) */}
          {o.status === "cancelled" && o.cancelReason && (
            <div className="text-[11px] text-red-600">
              <span className="font-semibold">Reason:</span> {o.cancelReason}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IconBtn({ children, className = "", disabled, ...props }) {
  return (
    <button
      disabled={disabled}
      {...props}
      className={`h-10 w-10 grid place-items-center rounded-lg shadow-sm transition active:scale-95 ${
        disabled ? "opacity-40 cursor-not-allowed" : "hover:brightness-95"
      } ${className}`}
    >
      {children}
    </button>
  );
}
