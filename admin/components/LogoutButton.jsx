"use client";

import { useState } from "react";

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
      className={`px-3 py-2 rounded-lg text-white transition-all ${
        loading
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-red-500 hover:bg-red-600"
      }`}
    >
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}
