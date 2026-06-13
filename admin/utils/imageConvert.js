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

export const convertToWebpUnderLimit = async (file, rule) => {
  if (!file) throw new Error("কোনো file select করা হয়নি।");

  const {
    type = "image/webp",
    width = 300,
    height = 300,
    maxBytes = 100 * 1024,
    startQuality = 0.88,
    minQuality = 0.3,
    qualityStep = 0.08,
  } = rule || {};

  // ✅ allowedInputTypes check নেই — যেকোনো format চলবে

  const img = await loadImageFromFile(file);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("তোমার browser canvas support করে না।");

  const sw = img.naturalWidth;
  const sh = img.naturalHeight;
  const side = Math.min(sw, sh);
  const sx = Math.floor((sw - side) / 2);
  const sy = Math.floor((sh - side) / 2);

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, sx, sy, side, side, 0, 0, width, height);

  let quality = startQuality;
  let blob = await new Promise((res) => canvas.toBlob(res, type, quality));
  if (!blob) throw new Error("Image টি WebP format এ convert করা যাচ্ছে না।");

  while (blob.size > maxBytes && quality > minQuality) {
    quality -= qualityStep;
    blob = await new Promise((res) => canvas.toBlob(res, type, quality));
    if (!blob) throw new Error("Compression এর সময় সমস্যা হয়েছে।");
  }

  // ✅ তারপরও বেশি হলে — error দাও কিন্তু স্পষ্ট কারণ বলো
  if (blob.size > maxBytes) {
    const kb = Math.ceil(blob.size / 1024);
    throw new Error(
      `সর্বোচ্চ compress করার পরেও ${kb}KB হয়েছে। ছোট বা সহজ image দাও।`,
    );
  }

  const newName =
    (file.name || "image").replace(/\.[^.]+$/, "").trim() + ".webp";

  return new File([blob], newName, { type, lastModified: Date.now() });
};
