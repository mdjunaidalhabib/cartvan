import { NextResponse } from "next/server";

// Public canonical domain. The app itself runs on an internal Coolify port,
// but that port must never be exposed in browser redirects.
const CANONICAL_HOST = "cartvan.com";
const WWW_HOST = `www.${CANONICAL_HOST}`;

function getPublicHostname(req) {
  // Coolify/Traefik forwards the original public host in x-forwarded-host.
  // Use only the first value and strip any port defensively.
  const forwardedHost = req.headers.get("x-forwarded-host");
  const rawHost = forwardedHost?.split(",")[0]?.trim() || req.headers.get("host") || "";

  return rawHost.split(":")[0].toLowerCase();
}

export function middleware(req) {
  const hostname = getPublicHostname(req);

  if (hostname === WWW_HOST) {
    const url = req.nextUrl.clone();

    // Set each URL part explicitly so an internal port such as :3007
    // cannot leak into the external redirect Location header.
    url.protocol = "https:";
    url.hostname = CANONICAL_HOST;
    url.port = "";

    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on all pages except Next.js static/image assets and the favicon.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
