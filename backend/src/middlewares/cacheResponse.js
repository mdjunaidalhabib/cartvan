// ✅ Lightweight in-memory GET response cache (micro-caching).
// Absorbs repeat traffic on public, non-personalized endpoints (home page,
// product listing/detail, categories, slider, badges) without needing Redis.
// Short TTL keeps data close to fresh while still cutting DB load sharply
// under concurrent visitors.

const store = new Map();

export const cacheResponse = (ttlMs = 30_000) => {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cached = store.get(key);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      res.setHeader("X-Cache", "HIT");
      return res.status(cached.status).json(cached.body);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        store.set(key, { body, status: res.statusCode, expiresAt: now + ttlMs });
      }
      res.setHeader("X-Cache", "MISS");
      return originalJson(body);
    };

    next();
  };
};
