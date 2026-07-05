"use client";
import { useEffect, useState } from "react";
import Toast from "../../../../components/Toast";

const ICON_OPTIONS = [
  { value: "truck", label: "🚚 Truck" },
  { value: "bag", label: "🛍️ Bag" },
  { value: "gift", label: "🎁 Gift" },
  { value: "tag", label: "🏷️ Tag" },
  { value: "fire", label: "🔥 Fire" },
  { value: "star", label: "⭐ Star" },
  { value: "percent", label: "％ Percent" },
];

const FIELD_LABELS = {
  freeDelivery: "Free Delivery (per-product ✅ ফ্রি ডেলিভারি ফ্ল্যাগ)",
  bestDiscount: "Best Discount",
  cartvanBox: "Gift Box (জেনেরিক বক্স — নিজস্ব কোনো ফিক্সড নাম নেই)",
};

// Short labels for the dropdown itself so it doesn't overflow on mobile
const FIELD_SHORT_LABELS = {
  freeDelivery: "Free Delivery",
  bestDiscount: "Best Discount",
  cartvanBox: "Gift Box",
};

function Skeleton() {
  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

export default function HomeBadgesPage() {
  const [badges, setBadges] = useState([]);
  const [availableFields, setAvailableFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({
    name: "",
    icon: "gift",
    order: 0,
  });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [addDraft, setAddDraft] = useState({
    field: "",
    name: "",
    icon: "gift",
  });
  const [adding, setAdding] = useState(false);

  const showToast = (message, type = "info") => setToast({ message, type });

  const load = async () => {
    try {
      setLoading(true);
      const [bRes, fRes] = await Promise.all([
        fetch(`/api/admin/homeBadges`).then((r) => r.json()),
        fetch(`/api/admin/homeBadges/available-fields`).then((r) => r.json()),
      ]);
      setBadges(Array.isArray(bRes?.badges) ? bRes.badges : []);
      setAvailableFields(Array.isArray(fRes?.available) ? fRes.available : []);
    } catch (err) {
      showToast("❌ Failed to load badges", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (badge) => {
    setEditingId(badge._id);
    setEditDraft({
      name: badge.name,
      icon: badge.icon,
      order: badge.order ?? 0,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id) => {
    if (!editDraft.name.trim()) {
      showToast("❌ নাম খালি রাখা যাবে না", "error");
      return;
    }
    setSaving(true);
    try {
      const newOrder = Number(editDraft.order) || 0;

      // ✅ if another badge already holds this order number, swap it
      // with the order this badge is giving up — so no two badges
      // ever end up with the same serial.
      const currentBadge = badges.find((b) => b._id === id);
      const oldOrder = currentBadge?.order ?? 0;
      const conflicting = badges.find(
        (b) => b._id !== id && (b.order ?? 0) === newOrder,
      );

      if (conflicting) {
        await fetch(`/api/admin/homeBadges/${conflicting._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: oldOrder }),
        });
      }

      const res = await fetch(`/api/admin/homeBadges/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editDraft.name.trim(),
          icon: editDraft.icon,
          order: newOrder,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");
      setBadges(data.badges || []);
      setEditingId(null);
      showToast("✅ Badge updated", "success");
    } catch (err) {
      showToast(`❌ ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (badge) => {
    try {
      const res = await fetch(`/api/admin/homeBadges/${badge._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !badge.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");
      setBadges(data.badges || []);
      showToast(
        data.badge?.isActive
          ? "✅ Shown on homepage"
          : "🙈 Hidden from homepage",
        "success",
      );
    } catch (err) {
      showToast(`❌ ${err.message}`, "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/homeBadges/${deleteTarget._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");
      setBadges(data.badges || []);
      setAvailableFields((prev) => [...prev, deleteTarget.field]);
      showToast("✅ Badge deleted", "success");
      setDeleteTarget(null);
    } catch (err) {
      showToast(`❌ ${err.message}`, "error");
    } finally {
      setDeleting(false);
    }
  };

  const submitAdd = async () => {
    if (!addDraft.field) {
      showToast("❌ কোন ধরনের badge — সিলেক্ট করুন", "error");
      return;
    }
    if (!addDraft.name.trim()) {
      showToast("❌ নাম দিন", "error");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch(`/api/admin/homeBadges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: addDraft.field,
          name: addDraft.name.trim(),
          icon: addDraft.icon,
          order: badges.length + 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");
      setBadges(data.badges || []);
      setAvailableFields((prev) => prev.filter((f) => f !== addDraft.field));
      setShowAdd(false);
      setAddDraft({ field: "", name: "", icon: "gift" });
      showToast("✅ Badge created", "success");
    } catch (err) {
      showToast(`❌ ${err.message}`, "error");
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <Skeleton />;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ✅ Header: stacks on mobile, row on larger screens */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-6">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">
            🏷️ হোমপেজ অফার ব্যাজ
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            হোমপেজে স্লাইডারের নিচে যে ৩টা বাটন দেখা যায় (Free Delivery / Best
            Discount / Gift Box) — এখান থেকে নাম, আইকন, ক্রম এবং visibility
            control করুন।
          </p>
        </div>

        {availableFields.length > 0 && (
          <button
            onClick={() => setShowAdd((s) => !s)}
            className="w-full sm:w-auto shrink-0 px-4 py-2.5 sm:py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 active:bg-indigo-800"
          >
            + নতুন
          </button>
        )}
      </div>

      {/* ✅ Add Form */}
      {showAdd && (
        <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-bold text-indigo-800">
            নতুন Badge যোগ করুন
          </p>

          <div>
            <label className="text-xs font-medium text-gray-600">
              ধরন (Field)
            </label>
            <select
              value={addDraft.field}
              onChange={(e) =>
                setAddDraft((p) => ({ ...p, field: e.target.value }))
              }
              className="w-full mt-1 border rounded-md p-2.5 sm:p-2 text-sm truncate"
            >
              <option value="">-- সিলেক্ট করুন --</option>
              {availableFields.map((f) => (
                <option key={f} value={f}>
                  {FIELD_SHORT_LABELS[f] || f}
                </option>
              ))}
            </select>
            {addDraft.field && FIELD_LABELS[addDraft.field] && (
              <p className="text-xs text-gray-400 mt-1">
                {FIELD_LABELS[addDraft.field]}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">নাম</label>
            <input
              type="text"
              value={addDraft.name}
              onChange={(e) =>
                setAddDraft((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="যেমন: Gift Box"
              className="w-full mt-1 border rounded-md p-2.5 sm:p-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">আইকন</label>
            <select
              value={addDraft.icon}
              onChange={(e) =>
                setAddDraft((p) => ({ ...p, icon: e.target.value }))
              }
              className="w-full mt-1 border rounded-md p-2.5 sm:p-2 text-sm"
            >
              {ICON_OPTIONS.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </select>
          </div>

          {/* ✅ Buttons stack full-width on mobile */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <button
              onClick={() => setShowAdd(false)}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100 active:bg-gray-200"
            >
              বাতিল
            </button>
            <button
              onClick={submitAdd}
              disabled={adding}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-md text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50"
            >
              {adding ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
            </button>
          </div>
        </div>
      )}

      {/* ✅ Badge List */}
      <div className="space-y-3">
        {badges.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-10">
            কোনো badge নেই।
          </p>
        )}

        {badges.map((badge) => {
          const isEditing = editingId === badge._id;
          const iconLabel =
            ICON_OPTIONS.find((i) => i.value === badge.icon)?.label ||
            badge.icon;

          return (
            <div
              key={badge._id}
              className={`border rounded-xl p-3.5 sm:p-4 ${
                badge.isActive ? "bg-white" : "bg-gray-50 opacity-70"
              }`}
            >
              {!isEditing ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 truncate">
                      {iconLabel?.split(" ")[0]} {badge.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Field: {badge.field} • Order: {badge.order ?? 0} •{" "}
                      {badge.isActive ? "✅ Visible" : "🙈 Hidden"}
                    </p>
                  </div>

                  {/* ✅ Action buttons: wrap and grow evenly on mobile */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleActive(badge)}
                      className="flex-1 sm:flex-none text-xs font-semibold px-2.5 py-2 sm:py-1.5 rounded-md border text-gray-600 hover:bg-gray-100 active:bg-gray-200"
                    >
                      {badge.isActive ? "Hide" : "Show"}
                    </button>
                    <button
                      onClick={() => startEdit(badge)}
                      className="flex-1 sm:flex-none text-xs font-semibold px-2.5 py-2 sm:py-1.5 rounded-md border text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(badge)}
                      className="flex-1 sm:flex-none text-xs font-semibold px-2.5 py-2 sm:py-1.5 rounded-md border text-red-600 hover:bg-red-50 active:bg-red-100"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      নাম
                    </label>
                    <input
                      type="text"
                      value={editDraft.name}
                      onChange={(e) =>
                        setEditDraft((p) => ({ ...p, name: e.target.value }))
                      }
                      className="w-full mt-1 border rounded-md p-2.5 sm:p-2 text-sm"
                    />
                  </div>

                  {/* ✅ Icon + order: stack on very small screens */}
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600">
                        আইকন
                      </label>
                      <select
                        value={editDraft.icon}
                        onChange={(e) =>
                          setEditDraft((p) => ({ ...p, icon: e.target.value }))
                        }
                        className="w-full mt-1 border rounded-md p-2.5 sm:p-2 text-sm"
                      >
                        {ICON_OPTIONS.map((i) => (
                          <option key={i.value} value={i.value}>
                            {i.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">
                        ক্রম (Order)
                      </label>
                      <select
                        value={editDraft.order}
                        onChange={(e) =>
                          setEditDraft((p) => ({
                            ...p,
                            order: Number(e.target.value),
                          }))
                        }
                        className="w-full mt-1 border rounded-md p-2.5 sm:p-2 text-sm"
                      >
                        {badges.map((_, idx) => {
                          const serial = idx + 1;
                          return (
                            <option key={serial} value={serial}>
                              {serial}
                            </option>
                          );
                        })}
                      </select>
                      <p className="text-xs text-gray-400 mt-1">
                        এই ক্রম আগে থেকেই অন্য badge-এ থাকলে, সেই badge-টা অটো
                        এই badge-এর আগের ক্রমে চলে যাবে।
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                    <button
                      onClick={cancelEdit}
                      className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100 active:bg-gray-200"
                    >
                      বাতিল
                    </button>
                    <button
                      onClick={() => saveEdit(badge._id)}
                      disabled={saving}
                      className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-md text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50"
                    >
                      {saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ✅ Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full">
            <p className="font-bold text-gray-800 mb-2">Badge Delete করবেন?</p>
            <p className="text-sm text-gray-500 mb-4">
              "{deleteTarget.name}" badge টি হোমপেজ থেকে সম্পূর্ণ মুছে যাবে। পরে
              চাইলে আবার নতুন করে যোগ করতে পারবেন।
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100 active:bg-gray-200"
              >
                বাতিল
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-md text-sm text-white bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50"
              >
                {deleting ? "মুছে ফেলা হচ্ছে..." : "হ্যাঁ, Delete করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
