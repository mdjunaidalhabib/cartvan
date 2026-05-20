import generateToken from "../../utils/auth/generateToken.js";
import Admin from "../../src/models/Admin.js";
import { UAParser } from "ua-parser-js";
import geoip from "geoip-lite";

/**
 * POST /admin/login
 */
export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "ইমেইল এবং পাসওয়ার্ড দুটোই দিতে হবে।",
        errorType: "MISSING_CREDENTIALS",
      });
    }

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "এই ইমেইল দিয়ে কোনো অ্যাডমিন পাওয়া যায়নি।",
        errorType: "ADMIN_NOT_FOUND",
      });
    }

    const isMatch = await admin.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "পাসওয়ার্ড ভুল হয়েছে। আবার চেষ্টা করুন।",
        errorType: "INVALID_PASSWORD",
      });
    }

    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      req.ip;

    const uaString = req.headers["user-agent"] || "";
    const parser = new UAParser(uaString);
    const ua = parser.getResult();

    const deviceType =
      ua.device.type === "mobile"
        ? "Mobile"
        : ua.device.type === "tablet"
          ? "Tablet"
          : "PC";

    const osName = ua.os.name || "Unknown OS";
    const osVersion = ua.os.version || "";
    const browserName = ua.browser.name || "Unknown Browser";
    const browserVersion = ua.browser.version || "";

    const geo = geoip.lookup(ip);
    const location = geo
      ? {
          country: geo.country,
          city: geo.city,
          region: geo.region,
          lat: geo.ll?.[0],
          lon: geo.ll?.[1],
        }
      : null;

    admin.lastLoginAt = new Date();
    admin.lastLoginIp = ip;
    admin.lastLoginDevice = deviceType;
    admin.lastLoginOS = `${osName} ${osVersion}`.trim();
    admin.lastLoginBrowser = `${browserName} ${browserVersion}`.trim();
    admin.lastLoginUA = uaString;

    if (location) {
      admin.lastLoginLocation = location;
    }

    await admin.save();

    const token = generateToken(admin);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    res.cookie("admin_token", token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "লগইন সফল হয়েছে।",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        lastLoginAt: admin.lastLoginAt,
        lastLoginIp: admin.lastLoginIp,
        lastLoginDevice: admin.lastLoginDevice,
        lastLoginOS: admin.lastLoginOS,
        lastLoginBrowser: admin.lastLoginBrowser,
        lastLoginLocation: admin.lastLoginLocation || null,
      },
    });
  } catch (err) {
    console.error("Login Error:", {
      name: err?.name,
      message: err?.message,
      stack: err?.stack,
    });

    if (err?.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "তথ্য সঠিক নয়। ইমেইল ও পাসওয়ার্ড আবার চেক করুন।",
        errorType: "VALIDATION_ERROR",
        details:
          process.env.NODE_ENV === "production" ? undefined : err.message,
      });
    }

    if (
      err?.name === "MongoServerError" ||
      err?.name === "MongoNetworkError" ||
      err?.name === "MongooseServerSelectionError"
    ) {
      return res.status(500).json({
        success: false,
        message:
          "ডাটাবেজ কানেকশনে সমস্যা হয়েছে। MongoDB connection/env check করুন।",
        errorType: "DATABASE_ERROR",
        details:
          process.env.NODE_ENV === "production" ? undefined : err.message,
      });
    }

    if (
      err?.message?.toLowerCase().includes("jwt") ||
      err?.message?.toLowerCase().includes("secret")
    ) {
      return res.status(500).json({
        success: false,
        message:
          "লগইন টোকেন তৈরি করতে সমস্যা হয়েছে। JWT_SECRET env check করুন।",
        errorType: "JWT_ERROR",
        details:
          process.env.NODE_ENV === "production" ? undefined : err.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "সার্ভারে অপ্রত্যাশিত সমস্যা হয়েছে। Backend logs check করুন।",
      errorType: "SERVER_ERROR",
      details: process.env.NODE_ENV === "production" ? undefined : err.message,
    });
  }
};
 