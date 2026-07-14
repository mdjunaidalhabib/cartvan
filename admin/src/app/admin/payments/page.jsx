"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "../../../../utils/api";
import Toast from "../../../../components/Toast";
import ConfirmDialog from "../../../../components/ConfirmDialog";

/* =========================================================
   ✅ Small skeleton for initial loading
========================================================= */
function RowsSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

/* =========================================================
   ✅ TAB 1: Pending Verification Queue
========================================================= */
function PendingVerificationTab({ showToast }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { orderId, status, label }

  const load = useCallback(() => {
    setLoading(true);
    apiFetch("/admin/payments/pending")
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => showToast("❌ Pending payment লোড করা যায়নি!", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(orderId, paymentStatus) {
    setBusyId(orderId);
    try {
      await apiFetch(`/admin/payments/${orderId}/verify`, {
        method: "PATCH",
        body: JSON.stringify({ paymentStatus }),
      });

      setOrders((prev) => prev.filter((o) => o._id !== orderId));
      showToast(
        paymentStatus === "paid"
          ? "✅ Payment Verified হয়েছে!"
          : "❌ Payment Rejected করা হয়েছে!",
        paymentStatus === "paid" ? "success" : "error"
      );
    } catch (err) {
      showToast("❌ আপডেট ব্যর্থ হয়েছে!", "error");
    } finally {
      setBusyId(null);
      setConfirmAction(null);
    }
  }

  if (loading) return <RowsSkeleton />;

  if (!orders.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-3xl mb-2">🎉</p>
        <p className="text-sm font-medium">
          Verify করার মতো কোনো Pending Payment নেই।
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {orders.map((o) => (
          <div
            key={o._id}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-gray-800">
                  #{o.orderNumber}
                </span>
                <span className="text-[10px] font-bold uppercase bg-pink-50 text-pink-600 border border-pink-100 px-2 py-0.5 rounded-full">
                  {o.paymentMethod}
                </span>
                <span className="text-xs text-gray-500">
                  {o.billing?.name} · {o.billing?.phone}
                </span>
              </div>

              <div className="text-xs text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                <span>
                  Sender:{" "}
                  <b className="text-gray-800">
                    {o.paymentDetails?.senderNumber || "—"}
                  </b>
                </span>
                <span>
                  TrxID:{" "}
                  <b className="text-gray-800 tracking-wide">
                    {o.paymentDetails?.transactionId || "—"}
                  </b>
                </span>
                <span>
                  Amount: <b className="text-gray-800">৳{o.total}</b>
                </span>
              </div>

              <p className="text-[10px] text-gray-400">
                {new Date(o.createdAt).toLocaleString("bn-BD")}
              </p>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                disabled={busyId === o._id}
                onClick={() =>
                  setConfirmAction({
                    orderId: o._id,
                    status: "failed",
                    label: `অর্ডার #${o.orderNumber} এর payment Reject করবেন?`,
                  })
                }
                className="px-3 py-2 text-xs font-bold rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 disabled:opacity-50"
              >
                ❌ Reject
              </button>
              <button
                disabled={busyId === o._id}
                onClick={() =>
                  setConfirmAction({
                    orderId: o._id,
                    status: "paid",
                    label: `অর্ডার #${o.orderNumber} এর payment Verify (Paid মার্ক) করবেন?`,
                  })
                }
                className="px-3 py-2 text-xs font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {busyId === o._id ? "..." : "✅ Verify"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        show={!!confirmAction}
        title="নিশ্চিত করুন"
        message={confirmAction?.label}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() =>
          confirmAction && updateStatus(confirmAction.orderId, confirmAction.status)
        }
      />
    </>
  );
}

/* =========================================================
   ✅ TAB 2: Payment Methods Settings (bKash/Nagad/Rocket etc.)
========================================================= */
const emptyForm = {
  name: "",
  number: "",
  accountType: "personal",
  actionLabel: "Send Money",
  instructions: "",
  active: true,
  order: 0,
};

// ✅ Account type বদলালে একটা reasonable default action suggest করা হয়,
// কিন্তু অ্যাডমিন চাইলে নিজের মতো বদলে দিতে পারবে (এটা শুধু suggestion)
const suggestActionLabel = (accountType) => {
  if (accountType === "merchant") return "Payment";
  if (accountType === "agent") return "Cash Out";
  return "Send Money";
};

function PaymentMethodsTab({ showToast }) {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch("/admin/payments/methods")
      .then((data) => setMethods(Array.isArray(data) ? data : []))
      .catch(() => showToast("❌ Payment methods লোড করা যায়নি!", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(m) {
    setEditingId(m._id);
    setForm({
      name: m.name || "",
      number: m.number || "",
      accountType: m.accountType || "personal",
      actionLabel: m.actionLabel || "Send Money",
      instructions: m.instructions || "",
      active: !!m.active,
      order: m.order || 0,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function submitForm(e) {
    e.preventDefault();

    if (!form.name.trim() || !form.number.trim()) {
      showToast("⚠️ Method নাম ও নম্বর দিন!", "error");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const updated = await apiFetch(`/admin/payments/methods/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
        setMethods((prev) =>
          prev.map((m) => (m._id === editingId ? updated : m))
        );
        showToast("✅ Payment method আপডেট হয়েছে!", "success");
      } else {
        const created = await apiFetch("/admin/payments/methods", {
          method: "POST",
          body: JSON.stringify(form),
        });
        setMethods((prev) => [...prev, created]);
        showToast("✅ নতুন Payment method যোগ হয়েছে!", "success");
      }
      resetForm();
    } catch (err) {
      showToast("❌ সেভ করা যায়নি!", "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(m) {
    try {
      const updated = await apiFetch(`/admin/payments/methods/${m._id}`, {
        method: "PUT",
        body: JSON.stringify({ active: !m.active }),
      });
      setMethods((prev) => prev.map((x) => (x._id === m._id ? updated : x)));
    } catch {
      showToast("❌ Status পরিবর্তন করা যায়নি!", "error");
    }
  }

  async function deleteMethod(id) {
    try {
      await apiFetch(`/admin/payments/methods/${id}`, { method: "DELETE" });
      setMethods((prev) => prev.filter((m) => m._id !== id));
      showToast("🗑️ Payment method মুছে ফেলা হয়েছে!", "success");
    } catch {
      showToast("❌ মুছতে ব্যর্থ হয়েছে!", "error");
    } finally {
      setDeleteTarget(null);
    }
  }

  const inputClass =
    "mt-1 w-full p-2 border rounded-md border-gray-300 outline-none text-sm focus:ring-2 focus:ring-pink-200";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Form */}
      <form
        onSubmit={submitForm}
        className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-4 space-y-3 h-fit"
      >
        <h3 className="font-bold text-gray-800 text-sm">
          {editingId ? "✏️ Method এডিট করুন" : "➕ নতুন Method যোগ করুন"}
        </h3>

        <label className="block">
          <span className="text-xs font-medium text-gray-700">
            নাম * (যেমন: bKash, Nagad, Rocket)
          </span>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={inputClass}
            placeholder="bKash"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-gray-700">
            নাম্বার * (Merchant/Personal)
          </span>
          <input
            value={form.number}
            onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
            className={inputClass}
            placeholder="01XXXXXXXXX"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-gray-700">
            Account Type
          </span>
          <select
            value={form.accountType}
            onChange={(e) => {
              const nextType = e.target.value;
              setForm((f) => ({
                ...f,
                accountType: nextType,
                // ✅ অ্যাডমিন যদি এখনো actionLabel হাতে না বদলে থাকে,
                // তাহলে account type অনুযায়ী reasonable default suggest করা হয়
                actionLabel:
                  !editingId ||
                  f.actionLabel === suggestActionLabel(f.accountType)
                    ? suggestActionLabel(nextType)
                    : f.actionLabel,
              }));
            }}
            className={inputClass}
          >
            <option value="personal">Personal</option>
            <option value="merchant">Merchant</option>
            <option value="agent">Agent</option>
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-gray-700">
            কাস্টমারকে কোন Action করতে বলবেন? *
          </span>
          <input
            value={form.actionLabel}
            onChange={(e) =>
              setForm((f) => ({ ...f, actionLabel: e.target.value }))
            }
            className={inputClass}
            placeholder="Send Money / Payment / Cash Out"
          />
          <p className="text-[10px] text-gray-400 mt-1">
            Personal নাম্বারে সাধারণত "Send Money", Merchant নাম্বারে "Payment",
            Agent নাম্বারে "Cash Out" — checkout পেজে ঠিক এই শব্দটাই কাস্টমারকে
            দেখানো হবে।
          </p>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-gray-700">
            Instructions (কাস্টমারকে দেখাবে)
          </span>
          <textarea
            value={form.instructions}
            onChange={(e) =>
              setForm((f) => ({ ...f, instructions: e.target.value }))
            }
            className={inputClass}
            placeholder="Send Money অপশনে গিয়ে টাকা পাঠান, তারপর TrxID এখানে দিন।"
          />
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) =>
              setForm((f) => ({ ...f, active: e.target.checked }))
            }
          />
          <span className="text-xs font-medium text-gray-700">
            Active (checkout-এ দেখাবে)
          </span>
        </label>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-pink-600 hover:bg-pink-700 text-white text-sm font-bold py-2 rounded-lg disabled:opacity-50"
          >
            {saving ? "Saving..." : editingId ? "Update" : "Add Method"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-2 text-sm font-bold rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* List */}
      <div className="lg:col-span-3 space-y-3">
        {loading ? (
          <RowsSkeleton />
        ) : !methods.length ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-3xl mb-2">💳</p>
            <p className="text-sm font-medium">
              এখনো কোনো Payment Method যোগ করা হয়নি।
            </p>
          </div>
        ) : (
          methods.map((m) => (
            <div
              key={m._id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800 text-sm">
                    {m.name}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      m.active
                        ? "bg-green-50 text-green-600 border border-green-200"
                        : "bg-gray-100 text-gray-400 border border-gray-200"
                    }`}
                  >
                    {m.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {m.number} · {m.accountType} · &ldquo;
                  {m.actionLabel || "Send Money"}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(m)}
                  className="text-[11px] font-bold text-gray-600 border border-gray-300 rounded-md px-2 py-1 hover:bg-gray-50"
                >
                  {m.active ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => startEdit(m)}
                  className="text-[11px] font-bold text-pink-600 border border-pink-300 rounded-md px-2 py-1 hover:bg-pink-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteTarget(m)}
                  className="text-[11px] font-bold text-red-600 border border-red-300 rounded-md px-2 py-1 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        show={!!deleteTarget}
        title="Delete Payment Method"
        message={`"${deleteTarget?.name}" মুছে ফেলতে চান? এটি checkout থেকে সরে যাবে।`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMethod(deleteTarget._id)}
      />
    </div>
  );
}

/* =========================================================
   ✅ MAIN PAGE
========================================================= */
export default function PaymentsPage() {
  const [tab, setTab] = useState("pending"); // "pending" | "methods"
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-800">💳 Payments</h2>

        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setTab("pending")}
            className={`px-4 py-2 text-sm font-bold rounded-md transition ${
              tab === "pending"
                ? "bg-white shadow text-pink-600"
                : "text-gray-500"
            }`}
          >
            Pending Verification
          </button>
          <button
            onClick={() => setTab("methods")}
            className={`px-4 py-2 text-sm font-bold rounded-md transition ${
              tab === "methods"
                ? "bg-white shadow text-pink-600"
                : "text-gray-500"
            }`}
          >
            Payment Methods
          </button>
        </div>
      </div>

      {tab === "pending" ? (
        <PendingVerificationTab showToast={showToast} />
      ) : (
        <PaymentMethodsTab showToast={showToast} />
      )}
    </div>
  );
}
