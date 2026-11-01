import type { NextRequest } from "next/server";

const FALLBACK_IP = "unknown";

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || FALLBACK_IP;
}

/**
 * Lightweight cross-site guard for JSON POST routes. Browsers send Origin on
 * cross-origin writes; a mismatched host is rejected. Requests without an
 * Origin header (server-to-server, curl) still need the endpoint's own auth.
 */
export function isAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
