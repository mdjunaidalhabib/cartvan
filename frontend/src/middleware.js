import { NextResponse } from "next/server";

// ✅ www.cartvan.com → cartvan.com (canonical, non-www)
// এটা না থাকলে একই ইউজার দুই আলাদা origin (www vs non-www) এ ঘোরাফেরা করলে
// localStorage token আলাদা থাকে — Google login করার পরও কিছু পেজে "logged out" দেখাতে পারে।
const WWW_PREFIX = "www.";

export function middleware(req) {
  const host = req.headers.get("host") || "";

  if (host.startsWith(WWW_PREFIX)) {
    const url = req.nextUrl.clone();
    url.host = host.slice(WWW_PREFIX.length);

    // 308: permanent redirect, method/body অক্ষুণ্ণ রাখে (301 এর মডার্ন সমতুল্য)
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // সব route এ চলবে, শুধু static assets/_next বাদে
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
