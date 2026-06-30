export function makeImageUrl(path) {
  if (!path) return "/placeholder.png"; // fallback

  return path.startsWith("http")
    ? path
    : `/api${path}`;
}

/**
 * ✅ Cloudinary URL-এ q_auto,f_auto,dpr_auto transformation inject করে।
 * এতে বড়/রেটিনা স্ক্রিনে Cloudinary নিজে device pixel ratio অনুযায়ী
 * sharper ভার্সন সার্ভ করে, কিন্তু সাধারণ স্ক্রিনে ফাইল সাইজ অপ্রয়োজনীয় বাড়ে না।
 * Cloudinary URL না হলে original path-ই ফেরত দেয়।
 */
export function optimizeCloudinaryUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }
  // ইতিমধ্যে transformation থাকলে duplicate করব না
  if (url.includes("q_auto") || url.includes("f_auto")) return url;

  return url.replace("/upload/", "/upload/q_auto:good,f_auto,dpr_auto/");
}
