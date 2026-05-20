// frontend/utils/api.js

export async function apiFetch(path, options = {}) {
  const baseUrl = "/api";
  const url = `${baseUrl}${path}`;

  try {
    const res = await fetch(url, {
      credentials: "include",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    // 🔒 Unauthorized / token expired
    if (res.status === 401) {
      try {
        // backend logout → cookie clear
        await fetch(`${baseUrl}/admin/logout`, {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });
      } catch {
        // ignore
      }

      // ✅ client-side full cleanup
      if (typeof window !== "undefined") {
        document.cookie =
          "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch {}

        try {
          if ("caches" in window) {
            const cacheNames = await caches.keys();

            await Promise.all(
              cacheNames.map((cacheName) => caches.delete(cacheName)),
            );
          }
        } catch {}

        // ✅ hard redirect
        window.location.replace("/login");
      }

      throw new Error("Session expired");
    }

    // ❌ Other API errors
    if (!res.ok) {
      let errorText = "";

      try {
        errorText = await res.text();
      } catch {
        errorText = "Unknown error";
      }

      throw new Error(
        `API error: ${res.status} ${res.statusText} → ${errorText}`,
      );
    }

    // ✅ Success
    return await res.json();
  } catch (err) {
    throw err;
  }
}
