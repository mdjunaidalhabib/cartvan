// Server Component data fetching — calls the backend directly (no /api proxy
// hop, since this already runs on the Next.js server) and uses Next's fetch
// cache so repeat visits within the window are served without hitting the
// backend at all. `revalidate` should stay close to the backend's own
// micro-cache TTL (see backend/src/middlewares/cacheResponse.js).
const BACKEND_API_URL = process.env.BACKEND_API_URL;

export async function serverFetch(path, { revalidate = 30, ...options } = {}) {
  if (!BACKEND_API_URL) {
    throw new Error("BACKEND_API_URL is not set");
  }

  const base = BACKEND_API_URL.replace(/\/$/, "");
  const res = await fetch(`${base}${path}`, {
    ...options,
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} → ${path}`);
  }

  return res.json();
}
