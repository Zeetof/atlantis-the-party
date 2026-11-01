import { NextResponse, type NextRequest } from "next/server";
import { webhookSchema } from "@/lib/validation";
import { getClientIp } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { getWebhookSecret, recordTicketPurchase, verifyWebhookSignature } from "@/server/ticketing";

export const dynamic = "force-dynamic";

/**
 * Signed purchase feed for Popout Tickets (or a forwarding integration).
 * The raw request body is verified before JSON parsing. Requests without a
 * valid signature are rejected; the endpoint is idempotent by provider ref.
 */
export async function POST(request: NextRequest) {
  const secret = getWebhookSecret();
  if (!secret) {
    return NextResponse.json(
      { ok: false, message: "Ticketing webhook is not configured." },
      { status: 503 },
    );
  }

  const limit = rateLimit(`webhook:${getClientIp(request)}`, 120, 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const rawBody = await request.text();
  if (!rawBody || rawBody.length > 20_000) {
    return NextResponse.json({ ok: false, message: "Invalid payload." }, { status: 400 });
  }

  const signature = request.headers.get("x-atlantis-signature");
  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ ok: false, message: "Invalid signature." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, message: "Payload is not JSON." }, { status: 400 });
  }

  const parsed = webhookSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid payload." },
      { status: 422 },
    );
  }

  try {
    const result = await recordTicketPurchase(parsed.data, {
      source: "WEBHOOK",
      rawPayload: rawBody,
    });
    return NextResponse.json(
      {
        ok: true,
        duplicate: result.duplicate,
        verificationId: result.verification.id,
      },
      { status: result.duplicate ? 200 : 201 },
    );
  } catch (error) {
    console.error("Ticket webhook failed", error);
    return NextResponse.json({ ok: false, message: "Webhook processing failed." }, { status: 500 });
  }
}
