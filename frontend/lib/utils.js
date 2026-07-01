export function makeImageUrl(path) {
  if (!path) return "/placeholder.png";

  return path.startsWith("http") ? path : `/api${path}`;
}

export function optimizeCloudinaryUrl(url) {
  if (!url || typeof url !== "string") return url;

  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }

  // ইতিমধ্যে transformation থাকলে duplicate করব না
  if (
    url.includes("q_auto") ||
    url.includes("f_auto") ||
    url.includes("c_limit")
  ) {
    return url;
  }

  return url.replace(
    "/upload/",
    "/upload/c_limit,w_1200,h_1200,q_auto:best,f_auto,dpr_auto/",
  );
}
