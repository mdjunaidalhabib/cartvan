"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../../utils/api";
import Toast from "../../../../components/Toast";
import ConfirmModal from "../../../../components/ConfirmModal";

function Skeleton() {
  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow rounded-xl mt-10">
      <div className="h-5 w-44 bg-gray-200 rounded mb-6 animate-pulse" />
      <div className="h-4 w-20 bg-gray-200 rounded mb-2 animate-pulse" />
      <div className="h-10 w-full bg-gray-200 rounded mb-5 animate-pulse" />
      <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
    </div>
  );
}

export default function AdminOrderCounterPage() {
  const [nextOrderNumber, setNextOrderNumber] = useState(1);
  const [maxUsed, setMaxUsed] = useState(0);

  const [startFrom, setStartFrom] = useState(1);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);

  function loadCounter() {
    setLoading(true);
    return apiFetch("/admin/orderCounter")
      .then((data) => {
        setNextOrderNumber(Number(data?.nextOrderNumber ?? 1));
        setMaxUsed(Number(data?.maxUsedOrderNumber ?? 0));
        setStartFrom(Number(data?.nextOrderNumber ?? 1));
      })
      .catch(() =>
        setToast({ message: "❌ Order counter লোড করা যায়নি!", type: "error" })
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCounter();
  }, []);

  async function applyStartFrom(value, { force = false } = {}) {
    if (!Number.isInteger(value) || value < 1) {
      setToast({ message: "❌ সঠিক একটি নাম্বার দিন (১ বা তার বেশি)!", type: "error" });
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/admin/orderCounter`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startFrom: value, force }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setSaving(false);
        setModal({
          title: "নাম্বার সংঘর্ষের সম্ভাবনা",
          message: `${data.error}\n\nতারপরও কি #${value} নাম্বার থেকেই শুরু করতে চান?\n\n⚠️ এতে ভবিষ্যতে নতুন কোনো অর্ডারের নাম্বার পুরনো একটি অর্ডারের নাম্বারের সাথে মিলে যেতে পারে (duplicate order number), যা ইনভয়েস/হিসাবে বিভ্রান্তি তৈরি করতে পারে।`,
          danger: true,
          confirmText: "হ্যাঁ, তারপরও করুন",
          onConfirm: () => applyStartFrom(value, { force: true }),
        });
        return;
      }

      if (!res.ok) throw new Error(data.error || "Failed");

      setNextOrderNumber(data.nextOrderNumber);
      setIsEditing(false);
      setToast({
        message: `✅ পরবর্তী অর্ডার নাম্বার হবে ${data.nextOrderNumber}`,
        type: "success",
      });
    } catch (err) {
      setToast({ message: "❌ Order counter সেট করা যায়নি!", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setStartFrom(nextOrderNumber);
    setIsEditing(false);
  }

  function resetAllOrders() {
    setModal({
      title: "⚠️ সব অর্ডার ডিলিট করবেন?",
      message: `এই অ্যাকশন ডাটাবেজের সব অর্ডার (${
        maxUsed ? `#1 থেকে #${maxUsed} পর্যন্ত` : ""
      }) স্থায়ীভাবে মুছে দেবে এবং কাউন্টার ১ থেকে শুরু হবে।\n\nএগিয়ে যেতে চান?`,
      danger: true,
      confirmText: "এগিয়ে যান",
      onConfirm: () => {
        setModal({
          title: "❗ শেষবারের নিশ্চিতকরণ",
          message:
            "এই মুছে ফেলা আর ফেরত আনা যাবে না। সত্যিই সব অর্ডার স্থায়ীভাবে ডিলিট করতে চান?",
          danger: true,
          confirmText: "হ্যাঁ, সব ডিলিট করুন",
          onConfirm: performResetAll,
        });
      },
    });
  }

  async function performResetAll() {
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/orderCounter/reset`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setNextOrderNumber(data.nextOrderNumber);
      setMaxUsed(0);
      setStartFrom(data.nextOrderNumber);
      setToast({
        message: `✅ ${data.deletedCount} টি অর্ডার ডিলিট হয়েছে। পরবর্তী অর্ডার নাম্বার হবে ${data.nextOrderNumber}`,
        type: "success",
      });
    } catch (err) {
      setToast({ message: "❌ Reset করা যায়নি!", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  const isUnchanged = startFrom === nextOrderNumber;

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmModal
        open={!!modal}
        title={modal?.title}
        message={modal?.message}
        danger={modal?.danger}
        confirmText={modal?.confirmText}
        onCancel={() => setModal(null)}
        onConfirm={() => {
          const action = modal?.onConfirm;
          setModal(null);
          action?.();
        }}
      />

      {loading ? (
        <Skeleton />
      ) : (
        <div className="max-w-md mx-auto p-6 bg-white shadow rounded-xl mt-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold mb-1">🔢 Order Number</h2>
              <p className="text-sm text-gray-500">
                পরবর্তী নতুন অর্ডার কোন নাম্বার থেকে শুরু হবে তা এখান থেকে সেট করুন।
              </p>
            </div>

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm font-semibold text-pink-600 hover:text-pink-700"
              >
                ✏️ Edit
              </button>
            ) : (
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="text-sm font-semibold text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                ❌ Cancel
              </button>
            )}
          </div>

          {!isEditing ? (
            <div className="mt-6">
              <div className="flex items-center justify-between bg-gray-50 border rounded-lg p-2">
                <span className="text-sm font-medium text-gray-700">
                  পরবর্তী অর্ডার নাম্বার
                </span>
                <span className="text-lg font-bold text-gray-900">
                  #{nextOrderNumber}
                </span>
              </div>
              <div className="flex items-center justify-between bg-gray-50 border rounded-lg p-2 mt-2">
                <span className="text-sm font-medium text-gray-700">
                  সর্বোচ্চ ব্যবহৃত অর্ডার নাম্বার
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  #{maxUsed}
                </span>
              </div>
              <p className="mt-3 text-xs text-gray-400">
                Click <span className="font-semibold">Edit</span> to update.
              </p>

              <button
                onClick={resetAllOrders}
                disabled={saving}
                className="mt-4 w-full text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 py-2 rounded-md transition disabled:opacity-50"
              >
                ⚠️ সব অর্ডার ডিলিট করে ১ থেকে শুরু করুন
              </button>
              <p className="mt-1 text-xs text-gray-400 text-center">
                এটি ডাটাবেজের সব অর্ডার স্থায়ীভাবে মুছে দেবে।
              </p>
            </div>
          ) : (
            <div className="mt-6">
              <label className="block mb-4">
                <span className="text-sm font-medium text-gray-700">
                  পরবর্তী অর্ডার নাম্বার হবে
                </span>
                <input
                  type="number"
                  value={startFrom}
                  min={1}
                  onChange={(e) => setStartFrom(Number(e.target.value))}
                  className="mt-1 w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
                <p className="mt-1 text-xs text-gray-400">
                  বর্তমানে সর্বোচ্চ ব্যবহৃত অর্ডার নাম্বার #{maxUsed}। এর চেয়ে বড় নাম্বার
                  দিলে কোনো সংঘর্ষ হবে না।
                </p>
              </label>

              <button
                onClick={() => applyStartFrom(startFrom)}
                disabled={saving || isUnchanged}
                className={`w-full text-white py-2 rounded-md font-bold transition ${
                  saving || isUnchanged
                    ? "bg-pink-400 cursor-not-allowed"
                    : "bg-pink-600 hover:bg-pink-700"
                }`}
              >
                {saving ? "Saving..." : "Save"}
              </button>

              {isUnchanged && (
                <p className="text-xs text-gray-400 mt-2 text-center">
                  No changes to save.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
