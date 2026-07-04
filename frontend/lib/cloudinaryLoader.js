/**
 * Custom next/image loader — Cloudinary URL গুলোর জন্য।
 *
 * সমস্যা: DB-তে থাকা image URL গুলো ইতিমধ্যেই Cloudinary-তে optimized
 * (resize + f_auto,q_auto)। কিন্তু next/image ডিফল্টভাবে সেগুলোকে আবার নিজের
 * server-side optimizer দিয়ে re-process করে ফেলছিল — একই কাজ দুইবার হচ্ছিল,
 * ফলে extra CPU/bandwidth খরচ হচ্ছিল নিজেদের server-এই (next start, self-hosted)।
 *
 * সমাধান: প্রতিটা <Image> কম্পোনেন্টে সরাসরি `loader={cloudinaryLoader}` prop
 * দিয়ে ব্যবহার করো। (next.config.js-এ global `images.loaderFile` দিয়ে সেট করার
 * চেষ্টা করা হয়েছিল, কিন্তু Turbopack dev mode-এ এটার একটা known bug আছে —
 * "is missing loader prop" error দেয় — তাই per-component prop-ই safe approach।
 * ref: vercel/next.js issues #85726, #85429, #60097)
 *
 * Cloudinary URL হলে Next নিজে resize না করে, বরং সরাসরি Cloudinary-র
 * transformation URL বানিয়ে দেয় (দরকারি width সহ) — কাজটা Cloudinary-র CDN-এই হয়।
 * অন্য কোনো host (Google avatar, backend /uploads/**, local /public assets) হলে
 * URL অপরিবর্তিত রেখে দেওয়া হয় — Next কোনো re-processing করে না, as-is serve হয়।
 */
export default function cloudinaryLoader({ src, width }) {
  if (!src) return src;

  // Cloudinary URL না হলে touch করি না — as-is চলে যাবে।
  if (!src.includes("res.cloudinary.com") || !src.includes("/upload/")) {
    return src;
  }

  const [prefix, rest] = src.split("/upload/");
  const segments = rest.split("/");

  // প্রথম segment যদি আগে থেকেই transformation string হয়ে থাকে
  // (যেমন backend থেকে আসা f_auto,q_auto:good), সেটা ফেলে দিয়ে নতুন করে বানাচ্ছি,
  // যাতে duplicate/stacked transformation তৈরি না হয়।
  const firstLooksLikeTransform =
    /[,_]/.test(segments[0]) && !/^v\d+$/.test(segments[0]);
  const cleanRest = firstLooksLikeTransform
    ? segments.slice(1).join("/")
    : rest;

  // ⚠️ next/image নিজে থেকে সবসময় একটা numeric quality পাঠায় (default 75),
  // সেটা ব্যবহার করলে Cloudinary-র নিজের "auto:good" perceptual algorithm-এর
  // চেয়ে বড় ফাইল তৈরি হচ্ছিল (admin panel-এ ≤100KB, frontend-এ 100KB+)।
  // তাই quality সবসময় Cloudinary-কেই ঠিক করতে দিচ্ছি — Next-এর quality prop ignore করা হচ্ছে।
  const transform = `f_auto,q_auto:good,c_limit,w_${width}`;

  return `${prefix}/upload/${transform}/${cleanRest}`;
}
