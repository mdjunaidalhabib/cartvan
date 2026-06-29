/* ================== ✅ COMMON IMAGE CONVERT UTILS ================== */

/**
 * ✅ Load Image from File
 */
export const loadImageFromFile = (file) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("এই file টি একটি valid image না। সঠিক image file দাও।"));
    };

    img.src = url;
  });

/**
 * ✅ HEIC/HEIF detect করা (iPhone-এর default photo format)
 * - Chrome/Firefox/Edge কখনো এই format <img> এ load করতে পারে না,
 *   তাই canvas pipeline-এ পাঠানোর আগেই JPEG-এ convert করে নিতে হয়।
 */
const isHeicFile = (file) => {
  const type = (file?.type || "").toLowerCase();
  const name = (file?.name || "").toLowerCase();
  return (
    type === "image/heic" ||
    type === "image/heif" ||
    type === "image/heic-sequence" ||
    type === "image/heif-sequence" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
};

/**
 * ✅ HEIC/HEIF -> JPEG (heic2any দিয়ে, WebAssembly based, browser-only)
 * dynamic import করা হয়েছে যাতে SSR/Next.js build এ সমস্যা না হয়
 */
const convertHeicToJpegFile = async (file) => {
  const heic2any = (await import("heic2any")).default;

  const result = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.92,
  });

  // ✅ কোনো কোনো multi-image HEIC ফাইলে array রিটার্ন হতে পারে — প্রথমটা নেওয়া হলো
  const jpegBlob = Array.isArray(result) ? result[0] : result;

  const newName =
    (file.name || "image").replace(/\.[^.]+$/, "").trim() + ".jpg";

  return new File([jpegBlob], newName, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
};

/**
 * ✅ Check WebP support (iOS Safari/Chrome এ false আসবে)
 */
const checkWebPSupport = () =>
  new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    canvas.toBlob((b) => resolve(b !== null && b.size > 0), "image/webp", 0.5);
  });

/**
 * ✅ Convert ANY format -> WebP (Android) or JPEG (iOS)
 * - center crop square
 * - resize to width × height
 * - quality loop to keep under maxBytes
 * - এরপরও বড় হলে dimension ধাপে ধাপে কমিয়ে আবার চেষ্টা
 * - GUARANTEE: এই ফাংশন আর কখনো error throw করবে না (image invalid হওয়া ছাড়া) —
 *   শেষ পর্যন্ত যত ভালো সম্ভব compress করে upload-ready file রিটার্ন করবে।
 */
export const convertToWebpUnderLimit = async (file, rule) => {
  if (!file) throw new Error("কোনো file select করা হয়নি।");

  // ✅ HEIC/HEIF (iPhone default) হলে আগেই JPEG-এ convert করে নেওয়া হচ্ছে,
  // কারণ Chrome/Firefox/Edge HEIC সরাসরি <img>-এ load করতে পারে না
  let workingFile = file;
  if (isHeicFile(file)) {
    try {
      workingFile = await convertHeicToJpegFile(file);
    } catch (err) {
      throw new Error(
        "এই HEIC/HEIF ছবিটি convert করা যাচ্ছে না। অনুগ্রহ করে JPG/PNG ফরম্যাটে try করো।",
      );
    }
  }

  const {
    width = 300,
    height = 300,
    maxBytes = 100 * 1024,
    startQuality = 0.88,
    minQuality = 0.2,
    qualityStep = 0.05,
  } = rule || {};

  // ✅ iOS check — WebP support না থাকলে JPEG use করো
  const supportsWebP = await checkWebPSupport();
  const outputType = supportsWebP ? "image/webp" : "image/jpeg";
  const outputExt = supportsWebP ? ".webp" : ".jpg";

  const img = await loadImageFromFile(workingFile);

  const sw = img.naturalWidth;
  const sh = img.naturalHeight;
  const side = Math.min(sw, sh);
  const sx = Math.floor((sw - side) / 2);
  const sy = Math.floor((sh - side) / 2);

  let dims = { width, height };
  let bestBlob = null;

  // ✅ প্রথমে quality কমিয়ে চেষ্টা, তারপরও বড় হলে dimension ছোট করে আবার চেষ্টা
  outer: for (let attempt = 0; attempt < 5; attempt++) {
    const canvas = document.createElement("canvas");
    canvas.width = dims.width;
    canvas.height = dims.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("তোমার browser canvas support করে না।");

    ctx.clearRect(0, 0, dims.width, dims.height);
    ctx.drawImage(img, sx, sy, side, side, 0, 0, dims.width, dims.height);

    let quality = startQuality;

    while (quality >= minQuality) {
      const blob = await new Promise((res) =>
        canvas.toBlob(res, outputType, quality),
      );

      if (blob) {
        bestBlob = blob; // ✅ সবসময় শেষ successful blob রাখি (fallback এর জন্য)
        if (blob.size <= maxBytes) break outer; // ✅ লক্ষ্যে পৌঁছে গেছি
      }

      quality -= qualityStep;
    }

    // ✅ quality কমিয়েও কাজ হয়নি — dimension আরও ছোট করে আবার চেষ্টা
    dims = {
      width: Math.max(200, Math.round(dims.width * 0.8)),
      height: Math.max(200, Math.round(dims.height * 0.8)),
    };
  }

  // ✅ guaranteed fallback (প্রায় অসম্ভব edge case): একদম ছোট সাইজে শেষ চেষ্টা
  if (!bestBlob) {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, sx, sy, side, side, 0, 0, 200, 200);
    bestBlob = await new Promise((res) => canvas.toBlob(res, outputType, 0.5));
  }

  if (!bestBlob) throw new Error("Image convert করা যাচ্ছে না।");

  // ✅ এখন থেকে আর কখনো size এর কারণে error throw হবে না —
  // যত ছোট করা সম্ভব হয়েছে, সেটাই নিয়ে upload এগিয়ে যাবে।

  // ✅ file name
  const newName =
    (workingFile.name || "image").replace(/\.[^.]+$/, "").trim() + outputExt;

  return new File([bestBlob], newName, {
    type: outputType,
    lastModified: Date.now(),
  });
};
