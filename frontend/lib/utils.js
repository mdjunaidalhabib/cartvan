export function makeImageUrl(path) {
  if (!path) return "/placeholder.png";

  return path.startsWith("http") ? path : `/api${path}`;
}

// Cloudinary transformation logic now lives in lib/cloudinaryLoader.js,
// wired globally via next.config.js images.loaderFile — so every
// next/image usage gets it automatically, no per-component call needed.
