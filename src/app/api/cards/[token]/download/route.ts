import { NextResponse, type NextRequest } from "next/server";
import { incrementCardDownload } from "@/server/claims";
import { getClientIp, isAllowedOrigin } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } },
) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const limit = rateLimit(`card-download:${getClientIp(request)}`, 30, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  await incrementCardDownload(params.token);
  return NextResponse.json({ ok: true });
}
