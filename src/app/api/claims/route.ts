import { NextResponse, type NextRequest } from "next/server";
import { submitClaim } from "@/server/claims";
import { getClientIp, isAllowedOrigin } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ ok: false, message: "Cross-site request rejected." }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Send the claim as JSON." }, { status: 400 });
  }

  const result = await submitClaim(payload, getClientIp(request));

  if (!result.ok) {
    const status =
      result.code === "INVALID"
        ? 400
        : result.code === "RATE_LIMIT"
          ? 429
          : result.code === "DUPLICATE"
            ? 409
            : result.code === "CLOSED"
              ? 503
              : 500;
    return NextResponse.json(result, {
      status,
      headers: result.retryAfterSeconds
        ? { "Retry-After": String(result.retryAfterSeconds) }
        : undefined,
    });
  }

  return NextResponse.json(result, { status: 201 });
}
