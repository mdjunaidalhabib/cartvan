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
    url.includes("c_pad")
  ) {
    return url;
  }

  return url.replace(
    "/upload/",
    "/upload/c_pad,b_white,w_900,h_900,q_auto:good,f_auto,dpr_auto/",
  );
}
