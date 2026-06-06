import generateToken from "../../utils/auth/generateToken.js";
import Admin from "../../src/models/Admin.js";
import { UAParser } from "ua-parser-js";
import geoip from "geoip-lite";

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    console.log("========== ADMIN LOGIN ==========");
    console.log("EMAIL:", email);
    console.log("PASSWORD RECEIVED:", password);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "ইমেইল এবং পাসওয়ার্ড দুটোই দিতে হবে।",
        errorType: "MISSING_CREDENTIALS",
      });
    }

    const admin = await Admin.findOne({
      email: email.toLowerCase().trim(),
    });

    console.log("ADMIN FOUND:", !!admin);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "এই ইমেইল দিয়ে কোনো অ্যাডমিন পাওয়া যায়নি।",
        errorType: "ADMIN_NOT_FOUND",
      });
    }

    console.log("ADMIN ID:", admin._id);
    console.log("ADMIN EMAIL:", admin.email);
    console.log("DB HASH:", admin.password);

    const isMatch = await admin.matchPassword(password);

    console.log("PASSWORD MATCH:", isMatch);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "পাসওয়ার্ড ভুল হয়েছে। আবার চেষ্টা করুন।",
        errorType: "INVALID_PASSWORD",
      });
    }

    console.log("LOGIN SUCCESS");

    const token = generateToken(admin);

    res.cookie("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    try {
      const ip =
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        req.ip ||
        "";

      const uaString = req.headers["user-agent"] || "";
      const parser = new UAParser(uaString);
      const ua = parser.getResult();

      const deviceType =
        ua.device.type === "mobile"
          ? "Mobile"
          : ua.device.type === "tablet"
          ? "Tablet"
          : "PC";

      const geo = ip ? geoip.lookup(ip) : null;

      admin.lastLoginAt = new Date();
      admin.lastLoginIp = ip;
      admin.lastLoginDevice = deviceType;
      admin.lastLoginOS =
        `${ua.os.name || ""} ${ua.os.version || ""}`.trim();
      admin.lastLoginBrowser =
        `${ua.browser.name || ""} ${ua.browser.version || ""}`.trim();
      admin.lastLoginUA = uaString;

      if (geo) {
        admin.lastLoginLocation = {
          country: geo.country,
          city: geo.city,
          region: geo.region,
          lat: geo.ll?.[0],
          lon: geo.ll?.[1],
        };
      }

      await admin.save();
    } catch (trackingError) {
      console.error("TRACKING ERROR:", trackingError);
    }

    return res.status(200).json({
      success: true,
      message: "লগইন সফল হয়েছে।",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "সার্ভারে অপ্রত্যাশিত সমস্যা হয়েছে।",
      errorType: "SERVER_ERROR",
      details:
        process.env.NODE_ENV === "production"
          ? undefined
          : err.message,
    });
  }
};