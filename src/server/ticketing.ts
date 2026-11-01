import {
  encryptString,
  hashPII,
  hmacSha256,
  last4,
  maskEmail,
  safeEqualHex,
} from "@/lib/crypto";
import { emailHash, normaliseTicketRef, ticketRefHash } from "@/lib/pii";
import type { WebhookPayload } from "@/lib/validation";
import { prisma } from "@/server/db";
import { recordAudit } from "@/server/audit";

export function verifyWebhookSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const cleaned = signature.startsWith("sha256=") ? signature.slice(7) : signature;
  const expected = hmacSha256(rawBody, secret);
  return safeEqualHex(expected, cleaned);
}

export function getWebhookSecret(): string | null {
  const secret = process.env.TICKETING_WEBHOOK_SECRET;
  if (!secret || secret.length < 16) return null;
  return secret;
}

export async function recordTicketPurchase(
  input: WebhookPayload,
  options: { source: "WEBHOOK" | "SANDBOX" | "MANUAL"; rawPayload?: string } = { source: "WEBHOOK" },
) {
  const event = await prisma.event.findUnique({ where: { slug: input.eventSlug } });
  if (!event) throw new Error("Unknown event slug.");

  const ref = normaliseTicketRef(input.providerRef);
  const refHash = ticketRefHash(ref);
  const piiEmailHash = emailHash(input.email);

  const existing = await prisma.ticketVerification.findUnique({ where: { providerRefHash: refHash } });
  if (existing) {
    return { verification: existing, duplicate: true };
  }

  const verification = await prisma.ticketVerification.create({
    data: {
      eventId: event.id,
      provider: "popout",
      providerRefHash: refHash,
      providerRefCipher: encryptString(ref),
      orderRefHash: refHash,
      orderRefLast4: last4(ref),
      purchaserEmailHash: piiEmailHash,
      purchaserEmailMasked: maskEmail(input.email),
      purchaserEmailCipher: encryptString(input.email),
      quantity: input.quantity,
      status: "VERIFIED",
      source: options.source,
      purchasedAt: input.purchasedAt ? new Date(input.purchasedAt) : null,
      verifiedAt: new Date(),
      rawPayload: options.rawPayload ? options.rawPayload.slice(0, 10_000) : null,
    },
  });

  await recordAudit({
    action: "TICKET_VERIFICATION_RECEIVED",
    entity: "TicketVerification",
    entityId: verification.id,
    metadata: {
      source: options.source,
      provider: verification.provider,
      last4: verification.orderRefLast4,
      quantity: verification.quantity,
      payloadHash: hashPII(options.rawPayload ?? ref),
    },
  });

  return { verification, duplicate: false };
}
