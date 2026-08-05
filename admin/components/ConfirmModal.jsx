"use client";
import { AlertTriangle } from "lucide-react";

export default function ConfirmModal({
  open,
  title = "নিশ্চিত করুন",
  message = "",
  confirmText = "হ্যাঁ",
  cancelText = "বাতিল",
  danger = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
        <div className="flex items-start gap-3">
          <div
            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              danger ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
            }`}
          >
            <AlertTriangle size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-md transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-bold text-white rounded-md transition ${
              danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-pink-600 hover:bg-pink-700"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
