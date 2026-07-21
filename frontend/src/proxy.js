import { NextResponse } from "next/server";

const CANONICAL_HOST = "cartvan.com";
const WWW_HOST = `www.${CANONICAL_HOST}`;

function getRequestHostname(req) {
  // Reverse proxies such as Coolify/Traefik can send the public host in
  // x-forwarded-host while the internal host still contains Next's port (3007).
  const forwardedHost = req.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const rawHost = forwardedHost || req.headers.get("host") || req.nextUrl.host;

  // Remove an internal/proxy port, for example www.cartvan.com:3007.
  return String(rawHost || "")
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "");
}

export function proxy(req) {
  const hostname = getRequestHostname(req);

  // Permanent canonical redirect: www.cartvan.com -> cartvan.com.
  // Explicitly clearing the port prevents redirects to cartvan.com:3007.
  if (hostname === WWW_HOST) {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    url.hostname = CANONICAL_HOST;
    url.port = "";

    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on application routes, but skip Next.js static assets.
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)",
  ],
};
