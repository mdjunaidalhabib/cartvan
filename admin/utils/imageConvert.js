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
 * - strictLimit: true → error, false → warning only
 */
export const convertToWebpUnderLimit = async (file, rule) => {
  if (!file) throw new Error("কোনো file select করা হয়নি।");

  const {
    width = 300,
    height = 300,
    maxBytes = 100 * 1024,
    startQuality = 0.88,
    minQuality = 0.2,
    qualityStep = 0.05,
    strictLimit = true,
  } = rule || {};

  // ✅ iOS check — WebP support না থাকলে JPEG use করো
  const supportsWebP = await checkWebPSupport();
  const outputType = supportsWebP ? "image/webp" : "image/jpeg";
  const outputExt = supportsWebP ? ".webp" : ".jpg";

  const img = await loadImageFromFile(file);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("তোমার browser canvas support করে না।");

  // ✅ center crop to square
  const sw = img.naturalWidth;
  const sh = img.naturalHeight;
  const side = Math.min(sw, sh);
  const sx = Math.floor((sw - side) / 2);
  const sy = Math.floor((sh - side) / 2);

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, sx, sy, side, side, 0, 0, width, height);

  // ✅ quality loop
  let quality = startQuality;
  let blob = await new Promise((res) =>
    canvas.toBlob(res, outputType, quality),
  );

  if (!blob) throw new Error("Image convert করা যাচ্ছে না।");

  while (blob.size > maxBytes && quality > minQuality) {
    quality -= qualityStep;
    blob = await new Promise((res) => canvas.toBlob(res, outputType, quality));
    if (!blob) throw new Error("Compression এর সময় সমস্যা হয়েছে।");
  }

  // ✅ তারপরও বেশি হলে
  if (blob.size > maxBytes) {
    const kb = Math.ceil(blob.size / 1024);
    const maxKB = Math.floor(maxBytes / 1024);

    if (strictLimit) {
      throw new Error(
        `এই image টি ${kb}KB — সর্বোচ্চ ${maxKB}KB allowed। ছোট বা সহজ image দাও।`,
      );
    } else {
      console.warn(`Image ${kb}KB — max ${maxKB}KB এর বেশি, তবুও upload হবে।`);
    }
  }

  // ✅ file name
  const newName =
    (file.name || "image").replace(/\.[^.]+$/, "").trim() + outputExt;

  return new File([blob], newName, {
    type: outputType,
    lastModified: Date.now(),
  });
};
