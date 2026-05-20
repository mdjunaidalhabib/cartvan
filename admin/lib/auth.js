// lib/auth.js

// 🔹 বর্তমানে লগইন করা admin আনবে
export async function getAdmin() {
  try {
    const API_BASE = "/api";

    const res = await fetch(`${API_BASE}/admin/verify`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    // ❌ token invalid / expired / unauthorized
    if (!res.ok) {
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();

        document.cookie =
          "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      }

      return null;
    }

    const data = await res.json();

    return data.admin || null;
  } catch (error) {
    console.error("⚠️ Auth check failed:", error);

    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();

      document.cookie =
        "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }

    return null;
  }
}

// 🔹 লগআউট ফাংশন
export async function logoutAdmin() {
  try {
    const API_BASE = "/api";

    await fetch(`${API_BASE}/admin/logout`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });

    // ✅ সব auth/cache remove
    if (typeof window !== "undefined") {
      document.cookie =
        "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      localStorage.clear();
      sessionStorage.clear();

      if ("caches" in window) {
        const cacheNames = await caches.keys();

        await Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName)),
        );
      }

      window.location.replace("/login");
    }

    return true;
  } catch (error) {
    console.error("⚠️ Logout error:", error);

    return false;
  }
}
