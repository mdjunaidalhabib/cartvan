import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import passport from "passport";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import dbConnect from "./src/lib/db.js";
import { configurePassport } from "./src/auth/passport.js";
import createSuperAdmin from "./src/config/createSuperAdmin.js";

import publicRoutes from "./src/routes/public/index.js";
import adminRoutes from "./src/routes/admin/index.js";
import { purgeExpiredTrash } from "./utils/trash/trash.helpers.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const isProd = process.env.NODE_ENV === "production";

// ✅ Required environment validation
const requiredEnv = ["MONGO_URI", "JWT_SECRET"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error(`❌ Missing required environment variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}

// ✅ Small built-in rate limiter, avoids adding another runtime dependency
const rateLimitStore = new Map();
const rateLimit = ({ windowMs = 15 * 60 * 1000, limit = 300 } = {}) => {
  return (req, res, next) => {
    const key = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const now = Date.now();
    const current = rateLimitStore.get(key) || { count: 0, resetAt: now + windowMs };

    if (current.resetAt <= now) {
      current.count = 0;
      current.resetAt = now + windowMs;
    }

    current.count += 1;
    rateLimitStore.set(key, current);

    res.setHeader("X-RateLimit-Limit", String(limit));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, limit - current.count)));

    if (current.count > limit) {
      return res.status(429).json({ message: "Too many requests. Please try again later." });
    }

    next();
  };
};

// ✅ trust nginx / proxy for secure cookies
app.set("trust proxy", 1);

app.use(cookieParser());
app.use(rateLimit());

// ✅ Helmet
app.use(
  helmet({
    contentSecurityPolicy: isProd ? undefined : false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// ✅ normalize helper
const normalize = (url = "") => url.replace(/\/$/, "").trim();

// ✅ CORS allow list
const allowedOrigins = (process.env.CLIENT_URLS || "")
  .split(",")
  .map(normalize)
  .filter(Boolean);

if (!isProd) console.log("✅ Allowed CORS Origins:", allowedOrigins);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // allow Postman/curl

      const normalizedOrigin = normalize(origin);
      if (allowedOrigins.includes(normalizedOrigin)) {
        return cb(null, true);
      }

      if (!isProd) console.log("❌ Blocked by CORS Origin:", origin);
      return cb(new Error(`Not allowed by CORS: ${origin}`), false);
    },
    credentials: true, // ✅ allow cookies
    exposedHeaders: ["Content-Disposition"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

configurePassport();
app.use(passport.initialize());

app.use("/", publicRoutes);
app.use("/admin", adminRoutes);

app.get("/", (req, res) => res.send("✅ API is running..."));
app.use("/uploads", express.static("uploads"));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "✅ cartvan api is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Uncaught error:", err);
  res.status(500).json({
    error: "Internal server error",
    details: isProd ? undefined : String(err),
  });
});
app.use(express.static("public"));

const startServer = async () => {
  try {
    await dbConnect(process.env.MONGO_URI);
    await createSuperAdmin();

    // ✅ Trash auto-purge: 3 দিনের পুরনো item গুলো boot এ একবার,
    // তারপর প্রতি ঘন্টায় check করে permanently delete করবে
    purgeExpiredTrash();
    setInterval(purgeExpiredTrash, 60 * 60 * 1000);

    app.listen(PORT, "0.0.0.0", () =>
      console.log(`🚀 Backend running on port ${PORT}`)
    );
  } catch (err) {
    console.error("❌ Failed to connect DB:", err);
    process.exit(1);
  }
};

startServer();
export default app;
