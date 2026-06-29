import multer from "multer";
import path from "path";

/* ================== ✅ STORAGE ================== */
// ⚠️ আগে শুধু Date.now() দিয়ে filename বানানো হতো — কিন্তু একই request-এ
// (যেমন multi-variant এ ৮টা image একসাথে) একাধিক file একই millisecond-এ
// আসলে তাদের filename একই হয়ে যেত, ফলে একটা file আরেকটার temp path
// overwrite/delete করে দিতো এবং পরে sharp() গিয়ে "Input file is missing"
// error দিতো। এখন Date.now() + random suffix দিয়ে guaranteed-unique filename।
const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

/* ================== ✅ DEFAULT UPLOAD (GENERIC) ================== */
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 }, // ✅ 100KB
});

/* ================== ✅ CATEGORY UPLOAD ================== */
export const categoryUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // ✅ input can be larger (server will compress)
  fileFilter: (req, file, cb) => {
    const allowed = ["image/webp", "image/jpeg", "image/png"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only jpeg/png/webp allowed"), false);
    }
    cb(null, true);
  },
});

/* ================== ✅ PRODUCT UPLOAD ================== */
export const productUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // ✅ input can be larger (server will compress)
    files: 40,
  },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/webp", "image/jpeg", "image/png"];
    if (!allowed.includes(file.mimetype)) {
      return cb(
        new Error("Only jpeg/png/webp allowed (Auto convert to 600×600 WEBP)"),
        false
      );
    }
    cb(null, true);
  },
});

/* ================== ✅ SLIDER UPLOAD ==================
   ✅ UPDATED RULE:
   INPUT : jpeg/png/webp allowed
   OUTPUT: controller will convert to 1500×500 WEBP under 100KB
================================================== */
export const sliderUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // ✅ input can be larger
  fileFilter: (req, file, cb) => {
    const allowed = ["image/webp", "image/jpeg", "image/png"];
    if (!allowed.includes(file.mimetype)) {
      return cb(
        new Error("Only jpeg/png/webp allowed (Auto convert to 1500×500 WEBP)"),
        false
      );
    }
    cb(null, true);
  },
});

export default upload;
