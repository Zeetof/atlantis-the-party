import { Prisma } from "@prisma/client";
import type { AdminSession } from "@/lib/session";
import {
  encryptString,
  decryptString,
  hashToken,
  last4,
  maskEmail,
  newOpaqueToken,
} from "@/lib/crypto";
import { emailHash, ipHash, normaliseTicketRef, ticketRefHash } from "@/lib/pii";
import { makeCardNumber, makeCardPublicId, makeClaimRef, pickSongIndex } from "@/lib/card";
import { claimSchema } from "@/lib/validation";
import { prisma } from "@/server/db";
import { rateLimit } from "@/server/rate-limit";
import { recordAudit } from "@/server/audit";
import { sendCardEmail, type DeliveryResult } from "@/server/email";

const CARD_TOKEN_TTL_DAYS = 30;

export type SubmitClaimResult =
  | {
      ok: true;
      publicRef: string;
      status: "VERIFIED" | "MANUAL_REVIEW";
      matched: boolean;
      message: string;
    }
  | {
      ok: false;
      code: "INVALID" | "RATE_LIMIT" | "CLOSED" | "DUPLICATE" | "ERROR";
      message: string;
      retryAfterSeconds?: number;
    };

export async function submitClaim(input: unknown, ip: string): Promise<SubmitClaimResult> {
  const parsed = claimSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: "INVALID",
      message: parsed.error.issues[0]?.message ?? "Check the form and try again.",
    };
  }

  const claimsOpen = await prisma.siteSetting.findUnique({ where: { key: "claimsOpen" } });
  if (claimsOpen?.value === "false") {
    return {
      ok: false,
      code: "CLOSED",
      message: "Card claims are temporarily closed. Please check back shortly.",
    };
  }

  const ipKey = `claim:ip:${ip}`;
  const ipLimit = rateLimit(ipKey, 5, 60 * 60 * 1000);
  if (!ipLimit.ok) {
    return {
      ok: false,
      code: "RATE_LIMIT",
      message: "Too many claim attempts from this connection. Try again later.",
      retryAfterSeconds: ipLimit.retryAfterSeconds,
    };
  }

  const hashedEmail = emailHash(parsed.data.email);
  const emailLimit = rateLimit(`claim:email:${hashedEmail}`, 3, 24 * 60 * 60 * 1000);
  if (!emailLimit.ok) {
    return {
      ok: false,
      code: "RATE_LIMIT",
      message: "Too many attempts for this email. Try again tomorrow or contact the organizer.",
      retryAfterSeconds: emailLimit.retryAfterSeconds,
    };
  }

  try {
    const event = await prisma.event.findUnique({ where: { slug: "atlantis-4" } });
    if (!event) {
      return { ok: false, code: "ERROR", message: "Event configuration is unavailable." };
    }

    const ref = normaliseTicketRef(parsed.data.ticketRef);
    const refHash = ticketRefHash(ref);

    const verification = await prisma.ticketVerification.findFirst({
      where: {
        eventId: event.id,
        purchaserEmailHash: hashedEmail,
        orderRefHash: refHash,
        status: "VERIFIED",
      },
      include: { claim: true },
    });

    if (verification?.claim) {
      return {
        ok: false,
        code: "DUPLICATE",
        message: "A card claim already exists for this ticket. Check your email or contact the organizer.",
      };
    }

    const matched = Boolean(verification);

    if (!matched) {
      const existing = await prisma.cardClaim.findFirst({
        where: {
          eventId: event.id,
          emailHash: hashedEmail,
          status: { in: ["MANUAL_REVIEW", "VERIFIED"] },
        },
      });
      if (existing) {
        return {
          ok: false,
          code: "DUPLICATE",
          message: "A claim for this email is already in review. Please wait for the organizer's decision.",
        };
      }
    }

    let publicRef = makeClaimRef();
    let claim = null;
    for (let attempt = 0; attempt < 5 && !claim; attempt += 1) {
      try {
        claim = await prisma.cardClaim.create({
          data: {
            publicRef,
            eventId: event.id,
            verificationId: matched ? verification!.id : null,
            emailCipher: encryptString(parsed.data.email),
            emailHash: hashedEmail,
            emailMasked: maskEmail(parsed.data.email),
            displayName: parsed.data.displayName,
            ticketRefCipher: encryptString(ref),
            ticketRefLast4: last4(ref),
            status: matched ? "VERIFIED" : "MANUAL_REVIEW",
            source: matched ? "WEBHOOK_MATCH" : "MANUAL",
            ipHash: ipHash(ip),
          },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          publicRef = makeClaimRef();
          continue;
        }
        throw error;
      }
    }

    if (!claim) {
      return { ok: false, code: "ERROR", message: "Could not create the claim. Please try again." };
    }

    return {
      ok: true,
      publicRef: claim.publicRef,
      status: matched ? "VERIFIED" : "MANUAL_REVIEW",
      matched,
      message: matched
        ? "Your ticket matched our verified purchase record. The organizer will issue your card shortly."
        : "Your claim is in the organizer review queue. You will receive an email once it is approved.",
    };
  } catch (error) {
    console.error("Claim submission failed", error);
    return { ok: false, code: "ERROR", message: "Something went wrong. Please try again." };
  }
}

export async function verifyClaimManually(params: {
  claimId: string;
  providerRef: string;
  session: AdminSession;
  ipHash?: string;
}): Promise<{ ok: boolean; message: string }> {
  const ref = normaliseTicketRef(params.providerRef);
  if (ref.length < 4) return { ok: false, message: "Enter the full provider reference." };

  const claim = await prisma.cardClaim.findUnique({
    where: { id: params.claimId },
    include: { verification: true, card: true },
  });
  if (!claim) return { ok: false, message: "Claim not found." };
  if (claim.card) return { ok: false, message: "This claim already has an issued card." };
  if (claim.verification) return { ok: false, message: "This claim is already linked to a verification." };

  const refHash = ticketRefHash(ref);
  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.ticketVerification.findUnique({
        where: { providerRefHash: refHash },
        include: { claim: true },
      });

      let verificationId: string;
      if (existing) {
        if (existing.purchaserEmailHash !== claim.emailHash) {
          throw new Error("That reference belongs to a different purchaser email.");
        }
        if (existing.claim) {
          throw new Error("That reference is already linked to another claim.");
        }
        await tx.ticketVerification.update({
          where: { id: existing.id },
          data: { status: "VERIFIED", verifiedAt: new Date() },
        });
        verificationId = existing.id;
      } else {
        const created = await tx.ticketVerification.create({
          data: {
            eventId: claim.eventId,
            provider: "popout",
            providerRefHash: refHash,
            orderRefHash: refHash,
            orderRefLast4: last4(ref),
            purchaserEmailHash: claim.emailHash,
            purchaserEmailMasked: claim.emailMasked,
            status: "VERIFIED",
            source: "MANUAL",
            verifiedAt: new Date(),
          },
        });
        verificationId = created.id;
      }

      await tx.cardClaim.update({
        where: { id: claim.id },
        data: {
          verificationId,
          status: "VERIFIED",
          source: "MANUAL_VERIFIED",
        },
      });
    });
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Verification failed." };
  }

  await recordAudit({
    session: params.session,
    action: "CLAIM_PURCHASE_VERIFIED",
    entity: "CardClaim",
    entityId: claim.id,
    metadata: { referenceLast4: last4(ref) },
    ipHash: params.ipHash,
  });

  return { ok: true, message: "Purchase verified. You can now issue the card." };
}

export async function rejectClaim(params: {
  claimId: string;
  note: string;
  session: AdminSession;
  ipHash?: string;
}): Promise<{ ok: boolean; message: string }> {
  const claim = await prisma.cardClaim.findUnique({ where: { id: params.claimId } });
  if (!claim) return { ok: false, message: "Claim not found." };
  if (claim.status === "ISSUED") return { ok: false, message: "Issued cards cannot be rejected." };

  await prisma.cardClaim.update({
    where: { id: claim.id },
    data: {
      status: "REJECTED",
      decidedAt: new Date(),
      adminNote: params.note.slice(0, 500) || "Rejected by organizer.",
    },
  });

  await recordAudit({
    session: params.session,
    action: "CLAIM_REJECTED",
    entity: "CardClaim",
    entityId: claim.id,
    metadata: { note: params.note.slice(0, 200) },
    ipHash: params.ipHash,
  });

  return { ok: true, message: "Claim rejected." };
}

export async function issueCard(params: {
  claimId: string;
  session: AdminSession;
  ipHash?: string;
}): Promise<{ ok: boolean; message: string; email?: DeliveryResult; cardId?: string }> {
  const claim = await prisma.cardClaim.findUnique({
    where: { id: params.claimId },
    include: { verification: true, card: true },
  });
  if (!claim) return { ok: false, message: "Claim not found." };
  if (claim.card) return { ok: false, message: "A card has already been issued for this claim." };
  if (claim.status === "REJECTED") return { ok: false, message: "Rejected claims cannot be issued." };
  if (!claim.verification || claim.verification.status !== "VERIFIED") {
    return { ok: false, message: "Verify the purchase before issuing a card." };
  }

  const songs = await prisma.tributeSong.findMany({
    where: { approved: true },
    orderBy: { sortOrder: "asc" },
  });
  if (songs.length === 0) {
    return { ok: false, message: "Approve at least one tribute song before issuing cards." };
  }

  const token = newOpaqueToken();
  const selectedSong = songs[pickSongIndex(claim.id, songs.length)];
  const expiresAt = new Date(Date.now() + CARD_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  let cardId: string | null = null;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 5 && !cardId; attempt += 1) {
    try {
      const card = await prisma.$transaction(async (tx) => {
        const fresh = await tx.cardClaim.findUnique({
          where: { id: claim.id },
          include: { card: true, verification: true },
        });
        if (!fresh || fresh.card) throw new Error("A card has already been issued for this claim.");
        if (!fresh.verification || fresh.verification.status !== "VERIFIED") {
          throw new Error("The linked purchase is no longer verified.");
        }

        const count = await tx.tributeCard.count();
        const created = await tx.tributeCard.create({
          data: {
            publicId: makeCardPublicId(),
            cardNumber: makeCardNumber(count + 1 + attempt),
            claimId: fresh.id,
            displayName: fresh.displayName,
            songId: selectedSong.id,
            accessTokenHash: hashToken(token),
            accessTokenCipher: encryptString(token),
            tokenExpiresAt: expiresAt,
          },
        });

        await tx.cardClaim.update({
          where: { id: fresh.id },
          data: { status: "ISSUED", decidedAt: new Date() },
        });

        await tx.emailDelivery.create({
          data: {
            cardId: created.id,
            toEmailMasked: fresh.emailMasked,
            status: "PENDING",
          },
        });

        return created;
      });
      cardId = card.id;
    } catch (error) {
      lastError = error;
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
        break;
      }
    }
  }

  if (!cardId) {
    console.error("Card issuance failed", lastError);
    return { ok: false, message: "Could not issue the card. Check server logs." };
  }

  await recordAudit({
    session: params.session,
    action: "CARD_ISSUED",
    entity: "TributeCard",
    entityId: cardId,
    metadata: { claimId: claim.id, songId: selectedSong.id },
    ipHash: params.ipHash,
  });

  const email = await sendCardEmail(cardId);
  return {
    ok: true,
    message:
      email.status === "SENT"
        ? "Card issued and emailed."
        : email.status === "SKIPPED"
          ? "Card issued. Email delivery is not configured — copy the private link from the card panel."
          : "Card issued, but email delivery failed. Review the delivery log and retry.",
    email,
    cardId,
  };
}

export type BulkIssueResult = {
  issued: number;
  failed: number;
  remaining: number;
  emailed: number;
  queued: number;
};

export async function issueAllVerified(params: {
  session: AdminSession;
  ipHash?: string;
  limit?: number;
}): Promise<BulkIssueResult> {
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 25);
  const where: Prisma.CardClaimWhereInput = {
    status: "VERIFIED",
    card: null,
    verificationId: { not: null },
  };

  const [eligible, pending] = await Promise.all([
    prisma.cardClaim.count({ where }),
    prisma.cardClaim.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: limit,
      select: { id: true },
    }),
  ]);

  let issued = 0;
  let failed = 0;
  let emailed = 0;
  let queued = 0;

  for (const item of pending) {
    const result = await issueCard({
      claimId: item.id,
      session: params.session,
      ipHash: params.ipHash,
    });
    if (!result.ok) {
      failed += 1;
      continue;
    }
    issued += 1;
    if (result.email?.status === "SENT") emailed += 1;
    else queued += 1;
  }

  await recordAudit({
    session: params.session,
    action: "CARDS_BULK_ISSUED",
    entity: "CardClaim",
    metadata: { issued, failed, emailed, queued, attempted: pending.length, eligible },
    ipHash: params.ipHash,
  });

  return { issued, failed, remaining: Math.max(0, eligible - issued), emailed, queued };
}

export async function rotateCardToken(params: {
  cardId: string;
  session: AdminSession;
  ipHash?: string;
}): Promise<{ ok: boolean; message: string }> {
  const card = await prisma.tributeCard.findUnique({ where: { id: params.cardId } });
  if (!card) return { ok: false, message: "Card not found." };

  const token = newOpaqueToken();
  await prisma.tributeCard.update({
    where: { id: card.id },
    data: {
      accessTokenHash: hashToken(token),
      accessTokenCipher: encryptString(token),
      tokenExpiresAt: new Date(Date.now() + CARD_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  await recordAudit({
    session: params.session,
    action: "CARD_LINK_ROTATED",
    entity: "TributeCard",
    entityId: card.id,
    ipHash: params.ipHash,
  });

  return { ok: true, message: "A new private link was generated. Send it only to the card holder." };
}

export async function retryCardEmail(params: {
  cardId: string;
  session: AdminSession;
  ipHash?: string;
}): Promise<{ ok: boolean; message: string; email?: DeliveryResult }> {
  const card = await prisma.tributeCard.findUnique({ where: { id: params.cardId } });
  if (!card) return { ok: false, message: "Card not found." };

  const email = await sendCardEmail(card.id, { force: true });
  await recordAudit({
    session: params.session,
    action: "CARD_EMAIL_RETRIED",
    entity: "TributeCard",
    entityId: card.id,
    metadata: { status: email.status },
    ipHash: params.ipHash,
  });

  return {
    ok: email.status === "SENT",
    message:
      email.status === "SENT"
        ? "Email sent."
        : email.status === "SKIPPED"
          ? email.error ?? "Email provider is not configured."
          : `Email failed: ${email.error ?? "unknown error"}`,
    email,
  };
}

export function getCardLinkFromCipher(cipher: string) {
  const token = decryptString(cipher);
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${baseUrl}/card/${encodeURIComponent(token)}`;
}

export async function getCardByToken(token: string) {
  if (!token || token.length < 20) return { status: "not_found" as const };
  const card = await prisma.tributeCard.findUnique({
    where: { accessTokenHash: hashToken(token) },
    include: { song: true, claim: { include: { event: true } } },
  });
  if (!card) return { status: "not_found" as const };
  if (card.tokenExpiresAt.getTime() < Date.now()) return { status: "expired" as const };
  return { status: "ok" as const, card };
}

export async function incrementCardDownload(token: string) {
  if (!token || token.length < 20) return;
  try {
    await prisma.tributeCard.update({
      where: { accessTokenHash: hashToken(token) },
      data: { downloads: { increment: 1 } },
    });
  } catch {
    // Download telemetry is best-effort and must never block the card.
  }
}
