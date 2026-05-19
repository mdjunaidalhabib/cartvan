import { NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL;

function getMissingBackendUrlResponse() {
  return NextResponse.json(
    {
      success: false,
      message: "Backend API URL is missing. Please set BACKEND_API_URL.",
    },
    { status: 500 },
  );
}

function buildBackendUrl(pathSegments = [], search = "") {
  if (!BACKEND_API_URL) return "";

  const base = BACKEND_API_URL.replace(/\/$/, "");
  const path = pathSegments.map(encodeURIComponent).join("/");

  return `${base}/${path}${search || ""}`;
}

function copyRequestHeaders(req) {
  const headers = new Headers();

  const contentType = req.headers.get("content-type");
  const authorization = req.headers.get("authorization");
  const accept = req.headers.get("accept");

  if (contentType) headers.set("content-type", contentType);
  if (authorization) headers.set("authorization", authorization);
  if (accept) headers.set("accept", accept);
  else headers.set("accept", "application/json");

  return headers;
}

function rewriteLocationHeader(location, req) {
  if (!location || !BACKEND_API_URL) return location;

  const backendBase = BACKEND_API_URL.replace(/\/$/, "");
  const origin = new URL(req.url).origin;

  return location.startsWith(backendBase)
    ? location.replace(backendBase, `${origin}/api`)
    : location;
}

async function proxy(req, context) {
  if (!BACKEND_API_URL) {
    return getMissingBackendUrlResponse();
  }

  const params = context?.params || {};
  const pathSegments = Array.isArray(params.path) ? params.path : [];

  const targetUrl = buildBackendUrl(pathSegments, new URL(req.url).search);
  const method = req.method.toUpperCase();

  const init = {
    method,
    headers: copyRequestHeaders(req),
    redirect: "manual",
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  };

  if (!["GET", "HEAD"].includes(method)) {
    init.body = await req.arrayBuffer();
  }

  try {
    const backendRes = await fetch(targetUrl, init);

    const headers = new Headers(backendRes.headers);

    headers.delete("content-encoding");
    headers.delete("content-length");
    headers.delete("transfer-encoding");

    const rewrittenLocation = rewriteLocationHeader(
      headers.get("location"),
      req,
    );

    if (rewrittenLocation) {
      headers.set("location", rewrittenLocation);
    }

    const body = await backendRes.arrayBuffer();

    return new NextResponse(body, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers,
    });
  } catch (error) {
    console.error("API proxy error:", {
      targetUrl,
      backendApiUrl: BACKEND_API_URL,
      error,
    });

    return NextResponse.json(
      {
        success: false,
        message: "Failed to connect to backend API.",
        targetUrl,
        backendApiUrl: BACKEND_API_URL,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
export const HEAD = proxy;
