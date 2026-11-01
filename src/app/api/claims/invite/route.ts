import { NextResponse, type NextRequest } from "next/server";
import { inviteClaimSchema } from "@/lib/validation";
import { acceptInvite } from "@/server/invites";
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

  const parsed = inviteClaimSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form and try again." },
      { status: 400 },
    );
  }

  const result = await acceptInvite({
    token: parsed.data.token,
    displayName: parsed.data.displayName,
    ip: getClientIp(request),
  });

  if (!result.ok) {
    const status =
      result.code === "INVALID"
        ? 400
        : result.code === "USED"
          ? 409
          : result.code === "EXPIRED"
            ? 410
            : result.code === "RATE_LIMIT"
              ? 429
              : result.code === "CLOSED"
                ? 503
                : 500;
    return NextResponse.json(result, {
      status,
      headers: {
        "Cache-Control": "no-store",
        ...(result.retryAfterSeconds
          ? { "Retry-After": String(result.retryAfterSeconds) }
          : {}),
      },
    });
  }

  return NextResponse.json(result, { status: 201, headers: { "Cache-Control": "no-store" } });
}
