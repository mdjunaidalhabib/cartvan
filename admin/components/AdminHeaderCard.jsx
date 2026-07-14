"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import AdminHeaderCardSkeleton from "./Skeleton/AdminHeaderCardSkeleton";

export default function AdminHeaderCard({ collapsed = false }) {
  const API_BASE = "/api";
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdmin = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/admin/verify`, {
          withCredentials: true,
        });
        setAdmin(res.data.admin);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };

    loadAdmin();
  }, [API_BASE]);

  // ✅ Skeleton while loading
  if (loading) return <AdminHeaderCardSkeleton />;

  // if still no admin after load
  if (!admin) return <AdminHeaderCardSkeleton />;

  // ✅ Collapsed: neat, centered avatar-only mini card
  if (collapsed) {
    return (
      <div className="flex justify-center py-1">
        <img
          src={admin.avatar || "/default-avatar.png"}
          alt="avatar"
          title={admin.name}
          className={`w-10 h-10 rounded-full object-cover border-2 shrink-0 ${
            admin.status === "suspended" ? "border-red-400" : "border-green-400"
          }`}
        />
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-2xl p-2">
      {/* ✅ Top row: logo left, role+status right (upore-niche) */}
      <div className="flex items-start justify-between gap-2">
        <img
          src={admin.avatar || "/default-avatar.png"}
          alt="avatar"
          className="w-14 h-14 rounded-full object-cover border shrink-0"
        />

        <div className="flex flex-col items-end gap-1">
          <span className="px-1 py-1 rounded-md text-[11px] font-medium bg-violet-50 text-violet-700 border border-violet-200">
            Role: Super Admin
          </span>

          <span
            className={`px-2 py-0.5 rounded text-[11px] font-medium ${
              admin.status === "suspended"
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {admin.status || "active"}
          </span>
        </div>
      </div>

      {/* ✅ Bottom row: name & email full width */}
      <div className="mt-1">
        <h1 className="text-base font-bold truncate">{admin.name}</h1>
        <p className="text-xs text-gray-600 truncate">{admin.email}</p>
      </div>
    </div>
  );
}
