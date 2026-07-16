"use client";

import { useEffect, useMemo, useState } from "react";
import Toast from "../../../../components/Toast";
import TrashCard from "../../../../components/TrashCard";

const TYPE_TABS = [
  { key: "all", label: "🗂️ All" },
  { key: "Product", label: "📦 Product" },
  { key: "Category", label: "📁 Category" },
  { key: "Order", label: "🧾 Order" },
  { key: "Slider", label: "🖼️ Slider" },
  { key: "PaymentMethod", label: "💳 Payment Method" },
];

const TTL_DAYS = 3;

export default function TrashPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");

  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { mode: 'restore'|'delete'|'empty', item? }
  const [busyId, setBusyId] = useState(null);
  const [emptying, setEmptying] = useState(false);

  const loadTrash = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/trash`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setToast({ message: "⚠ Failed to load trash", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrash();
  }, []);

  const counts = useMemo(() => {
    const c = { all: items.length };
    for (const it of items) {
      c[it.collectionName] = (c[it.collectionName] || 0) + 1;
    }
    return c;
  }, [items]);

  const filteredItems =
    typeFilter === "all"
      ? items
      : items.filter((it) => it.collectionName === typeFilter);

  const handleRestore = async () => {
    if (!confirmModal?.item) return;
    const id = confirmModal.item._id;
    setBusyId(id);

    try {
      const res = await fetch(`/api/admin/trash/${id}/restore`, {
        method: "POST",
      });

      if (res.ok) {
        setToast({ message: "✅ Restored successfully!", type: "success" });
        loadTrash();
      } else {
        const data = await res.json().catch(() => ({}));
        setToast({
          message: `❌ ${data?.error || "Restore failed"}`,
          type: "error",
        });
      }
    } catch {
      setToast({ message: "🌐 Network error", type: "error" });
    }

    setBusyId(null);
    setConfirmModal(null);
  };

  const handlePermanentDelete = async () => {
    if (!confirmModal?.item) return;
    const id = confirmModal.item._id;
    setBusyId(id);

    try {
      const res = await fetch(`/api/admin/trash/${id}`, { method: "DELETE" });

      if (res.ok) {
        setToast({ message: "🗑 Permanently deleted!", type: "success" });
        loadTrash();
      } else {
        setToast({ message: "❌ Delete failed", type: "error" });
      }
    } catch {
      setToast({ message: "🌐 Network error", type: "error" });
    }

    setBusyId(null);
    setConfirmModal(null);
  };

  const handleEmptyTrash = async () => {
    setEmptying(true);
    try {
      const res = await fetch(`/api/admin/trash/empty`, { method: "DELETE" });

      if (res.ok) {
        setToast({ message: "🗑 Trash emptied!", type: "success" });
        loadTrash();
      } else {
        setToast({ message: "❌ Failed to empty trash", type: "error" });
      }
    } catch {
      setToast({ message: "🌐 Network error", type: "error" });
    }

    setEmptying(false);
    setConfirmModal(null);
  };

  return (
    <div className="p-4 sm:p-6">
      {/* ===================== HEADER ===================== */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">🗑️ Trash</h1>

        <div className="lg:ml-auto flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={() => setConfirmModal({ mode: "empty" })}
              className="bg-red-600 text-white shadow font-semibold px-3 py-1.5 rounded-md text-sm hover:bg-red-700 active:scale-[0.98] lg:px-4 lg:py-2 lg:text-base lg:rounded-lg"
            >
              Empty Trash
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Deleted items stay here for {TTL_DAYS} days before being permanently
        removed automatically. You can restore or permanently delete any item
        earlier.
      </p>

      {/* ===================== TYPE TABS ===================== */}
      <div className="flex flex-wrap gap-2 mb-5 border-b pb-3">
        {TYPE_TABS.map((tab) => {
          const active = typeFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setTypeFilter(tab.key)}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold border transition-all ${
                active
                  ? "bg-indigo-600 text-white border-indigo-600 shadow"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              {tab.label}
              <span
                className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                  active ? "bg-white/20" : "bg-gray-100"
                }`}
              >
                {counts[tab.key] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* ===================== LIST ===================== */}
      {loading ? (
        <div className="text-center text-gray-500 py-10">Loading...</div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredItems.map((it) => (
            <TrashCard
              key={it._id}
              item={it}
              busy={busyId === it._id}
              onRestore={() => setConfirmModal({ mode: "restore", item: it })}
              onDelete={() => setConfirmModal({ mode: "delete", item: it })}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-10">Trash is empty.</div>
      )}

      {/* ===================== CONFIRM MODAL ===================== */}
      {confirmModal && (
        <>
          <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-40" />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl border animate-[zoomIn_.2s_ease-out]">
              {confirmModal.mode === "restore" && (
                <>
                  <h2 className="text-xl font-bold text-green-600 mb-3">
                    ♻️ Restore Item
                  </h2>
                  <p className="text-gray-700 mb-6">
                    Restore{" "}
                    <span className="font-semibold">
                      {confirmModal.item?.label}
                    </span>{" "}
                    back to {confirmModal.item?.collectionName}?
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setConfirmModal(null)}
                      className="px-4 py-2 border rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRestore}
                      className="px-4 py-2 bg-green-600 text-white rounded shadow"
                    >
                      {busyId ? "Restoring..." : "Restore"}
                    </button>
                  </div>
                </>
              )}

              {confirmModal.mode === "delete" && (
                <>
                  <h2 className="text-xl font-bold text-red-600 mb-3">
                    ⚠ Delete Forever
                  </h2>
                  <p className="text-gray-700 mb-6">
                    <span className="font-semibold">
                      {confirmModal.item?.label}
                    </span>{" "}
                    will be permanently deleted. This cannot be undone.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setConfirmModal(null)}
                      className="px-4 py-2 border rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePermanentDelete}
                      className="px-4 py-2 bg-red-600 text-white rounded shadow"
                    >
                      {busyId ? "Deleting..." : "Delete Forever"}
                    </button>
                  </div>
                </>
              )}

              {confirmModal.mode === "empty" && (
                <>
                  <h2 className="text-xl font-bold text-red-600 mb-3">
                    ⚠ Empty Trash
                  </h2>
                  <p className="text-gray-700 mb-6">
                    All {items.length} item(s) in trash will be permanently
                    deleted. This cannot be undone.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setConfirmModal(null)}
                      className="px-4 py-2 border rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEmptyTrash}
                      className="px-4 py-2 bg-red-600 text-white rounded shadow"
                    >
                      {emptying ? "Emptying..." : "Empty Trash"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <style jsx global>{`
        @keyframes zoomIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
