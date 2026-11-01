import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { emailHash, normaliseEmail } from "@/lib/pii";
import { CLAIM_STATUS_LABELS } from "@/lib/utils";
import { prisma } from "@/server/db";
import { getClientIp, isAllowedOrigin } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";

export const dynamic = "force-dynamic";

const lookupSchema = z.object({
  publicRef: z.string().trim().min(6).max(20),
  email: z.string().trim().email().max(160).transform(normaliseEmail),
});

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ ok: false, message: "Cross-site request rejected." }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Send the lookup as JSON." }, { status: 400 });
  }

  const parsed = lookupSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: parsed.error.issues[0]?.message ?? "Check the details and try again." },
      { status: 400 },
    );
  }

  const ipLimit = rateLimit(`status:ip:${getClientIp(request)}`, 12, 60 * 60 * 1000);
  if (!ipLimit.ok) {
    return NextResponse.json(
      { ok: false, message: "Too many lookups. Try again later." },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) } },
    );
  }

  const ref = parsed.data.publicRef.trim().toUpperCase();
  const claim = await prisma.cardClaim.findUnique({
    where: { publicRef: ref },
    include: { card: { select: { cardNumber: true, issuedAt: true } } },
  });

  if (!claim || claim.emailHash !== emailHash(parsed.data.email)) {
    return NextResponse.json(
      { ok: false, message: "No claim matches that reference and email. Check both and try again." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    claim: {
      publicRef: claim.publicRef,
      status: claim.status,
      statusLabel: CLAIM_STATUS_LABELS[claim.status] ?? claim.status,
      emailMasked: claim.emailMasked,
      createdAt: claim.createdAt.toISOString(),
      decidedAt: claim.decidedAt?.toISOString() ?? null,
      card: claim.card
        ? {
            last4: claim.card.cardNumber.slice(-4),
            issuedAt: claim.card.issuedAt.toISOString(),
          }
        : null,
    },
  });
}
