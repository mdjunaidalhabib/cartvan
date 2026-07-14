"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const clearClientAuth = async () => {
    document.cookie =
      "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    localStorage.clear();
    sessionStorage.clear();

    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }
  };

  const handleLogout = async () => {
    setLoading(true);

    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      await clearClientAuth();

      window.location.replace("/login");
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      title="Logout"
      className={`flex items-center justify-center gap-1.5 rounded-full sm:rounded-lg h-9 w-9 sm:h-auto sm:w-auto sm:px-3.5 sm:py-2 text-white text-sm font-medium shadow-sm transition-all ${
        loading
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-red-500 hover:bg-red-600 active:scale-95"
      }`}
    >
      <LogOut size={16} />
      <span className="hidden sm:inline">
        {loading ? "Logging out..." : "Logout"}
      </span>
    </button>
  );
}
