import { Prisma } from "@prisma/client";
import {
  decryptString,
  encryptString,
  hashToken,
  newOpaqueToken,
} from "@/lib/crypto";
import { ipHash as hashIp } from "@/lib/pii";
import { makeClaimRef } from "@/lib/card";
import type { AdminSession } from "@/lib/session";
import { prisma } from "@/server/db";
import { recordAudit } from "@/server/audit";
import { sendInviteEmail, type DeliveryResult } from "@/server/email";
import { rateLimit } from "@/server/rate-limit";

export const INVITE_TTL_DAYS = 30;

export function buildInviteLink(token: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${baseUrl}/claim/invite/${encodeURIComponent(token)}`;
}

type EnsureInviteResult =
  | { ok: true; token: string; link: string; expiresAt: Date; reused: boolean }
  | { ok: false; message: string };

async function ensureInvite(verificationId: string, force: boolean): Promise<EnsureInviteResult> {
  const verification = await prisma.ticketVerification.findUnique({
    where: { id: verificationId },
    include: { claim: true },
  });
  if (!verification) return { ok: false, message: "Purchase verification not found." };
  if (verification.claim) {
    return { ok: false, message: "This purchase already has a claim." };
  }
  if (verification.status !== "VERIFIED") {
    return { ok: false, message: "Only verified purchases can be invited." };
  }
  if (!verification.purchaserEmailCipher) {
    return {
      ok: false,
      message: "No purchaser email is stored for this verification. Import the buyer list first.",
    };
  }

  if (
    !force &&
    verification.inviteTokenCipher &&
    verification.inviteExpiresAt &&
    verification.inviteExpiresAt.getTime() > Date.now()
  ) {
    const token = decryptString(verification.inviteTokenCipher);
    return {
      ok: true,
      token,
      link: buildInviteLink(token),
      expiresAt: verification.inviteExpiresAt,
      reused: true,
    };
  }

  const token = newOpaqueToken();
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.ticketVerification.update({
    where: { id: verification.id },
    data: {
      inviteTokenHash: hashToken(token),
      inviteTokenCipher: encryptString(token),
      inviteExpiresAt: expiresAt,
      inviteSentAt: null,
      inviteStatus: null,
      inviteError: null,
    },
  });

  return { ok: true, token, link: buildInviteLink(token), expiresAt, reused: false };
}

export type InviteSendResult = {
  ok: boolean;
  message: string;
  status?: DeliveryResult["status"];
  link?: string;
};

export async function sendTicketInvite(params: {
  verificationId: string;
  session: AdminSession;
  ipHash?: string;
  force?: boolean;
}): Promise<InviteSendResult> {
  const invite = await ensureInvite(params.verificationId, Boolean(params.force));
  if (!invite.ok) return { ok: false, message: invite.message };

  const verification = await prisma.ticketVerification.findUnique({
    where: { id: params.verificationId },
  });
  if (!verification?.purchaserEmailCipher) {
    return { ok: false, message: "No purchaser email is stored for this verification." };
  }

  const email = decryptString(verification.purchaserEmailCipher);
  const delivery = await sendInviteEmail({
    to: email,
    link: invite.link,
    expiresAt: invite.expiresAt,
  });

  await prisma.ticketVerification.update({
    where: { id: verification.id },
    data: {
      inviteStatus: delivery.status,
      inviteSentAt: delivery.status === "SENT" ? new Date() : null,
      inviteError: delivery.error?.slice(0, 400) ?? null,
    },
  });

  await recordAudit({
    session: params.session,
    action:
      delivery.status === "SENT"
        ? "INVITE_SENT"
        : delivery.status === "SKIPPED"
          ? "INVITE_SKIPPED"
          : "INVITE_FAILED",
    entity: "TicketVerification",
    entityId: verification.id,
    metadata: {
      maskedEmail: verification.purchaserEmailMasked,
      last4: verification.orderRefLast4,
      reusedLink: invite.reused,
      status: delivery.status,
    },
    ipHash: params.ipHash,
  });

  if (delivery.status === "SENT") {
    return {
      ok: true,
      status: delivery.status,
      message: `Invitation emailed to ${verification.purchaserEmailMasked}.`,
      link: invite.link,
    };
  }
  if (delivery.status === "SKIPPED") {
    return {
      ok: true,
      status: delivery.status,
      message:
        "Invitation link created, but email is not configured. Copy the private link to send it manually.",
      link: invite.link,
    };
  }
  return {
    ok: false,
    status: delivery.status,
    message: `Invitation email failed (${delivery.error ?? "unknown error"}). You can copy the link instead.`,
    link: invite.link,
  };
}

export type BulkInviteResult = {
  sent: number;
  skipped: number;
  failed: number;
  remaining: number;
};

export async function sendPendingInvites(params: {
  session: AdminSession;
  ipHash?: string;
  limit?: number;
}): Promise<BulkInviteResult> {
  const limit = Math.min(Math.max(params.limit ?? 25, 1), 50);
  const where = {
    status: "VERIFIED",
    claim: null,
    purchaserEmailCipher: { not: null },
    OR: [{ inviteStatus: null }, { inviteStatus: { not: "SENT" } }],
  };

  const [eligible, pending] = await Promise.all([
    prisma.ticketVerification.count({ where }),
    prisma.ticketVerification.findMany({
      where,
      orderBy: { receivedAt: "asc" },
      take: limit,
      select: { id: true },
    }),
  ]);

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of pending) {
    const result = await sendTicketInvite({
      verificationId: item.id,
      session: params.session,
      ipHash: params.ipHash,
    });
    if (result.status === "SENT") sent += 1;
    else if (result.status === "SKIPPED") skipped += 1;
    else failed += 1;
  }

  await recordAudit({
    session: params.session,
    action: "INVITES_SENT_BULK",
    entity: "TicketVerification",
    metadata: { sent, skipped, failed, attempted: pending.length, eligible },
    ipHash: params.ipHash,
  });

  return { sent, skipped, failed, remaining: Math.max(0, eligible - sent - skipped) };
}

export type PublicInvite = {
  status: "VALID";
  verificationId: string;
  maskedEmail: string;
  last4: string;
  expiresAt: Date;
};

export async function getPublicInvite(token: string): Promise<
  | PublicInvite
  | { status: "INVALID" | "USED" | "EXPIRED" }
> {
  if (!token || token.length < 20) return { status: "INVALID" };
  const verification = await prisma.ticketVerification.findUnique({
    where: { inviteTokenHash: hashToken(token) },
    include: { claim: true },
  });
  if (!verification) return { status: "INVALID" };
  if (verification.claim) return { status: "USED" };
  if (verification.status !== "VERIFIED") return { status: "INVALID" };
  if (!verification.inviteExpiresAt || verification.inviteExpiresAt.getTime() <= Date.now()) {
    return { status: "EXPIRED" };
  }
  return {
    status: "VALID",
    verificationId: verification.id,
    maskedEmail: verification.purchaserEmailMasked,
    last4: verification.orderRefLast4,
    expiresAt: verification.inviteExpiresAt,
  };
}

type AcceptResult =
  | { ok: true; publicRef: string; status: "VERIFIED"; message: string }
  | {
      ok: false;
      code: "INVALID" | "USED" | "EXPIRED" | "RATE_LIMIT" | "CLOSED" | "ERROR";
      message: string;
      retryAfterSeconds?: number;
    };

export async function acceptInvite(params: {
  token: string;
  displayName: string;
  ip: string;
}): Promise<AcceptResult> {
  const limit = rateLimit(`invite:ip:${params.ip}`, 10, 60 * 60 * 1000);
  if (!limit.ok) {
    return {
      ok: false,
      code: "RATE_LIMIT",
      message: "Too many attempts. Try again later.",
      retryAfterSeconds: limit.retryAfterSeconds,
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

  const tokenHash = hashToken(params.token);
  const verification = await prisma.ticketVerification.findUnique({
    where: { inviteTokenHash: tokenHash },
    include: { claim: true },
  });
  if (!verification) return { ok: false, code: "INVALID", message: "This invitation is not valid." };
  if (verification.status !== "VERIFIED") {
    return { ok: false, code: "INVALID", message: "This invitation is not valid." };
  }
  if (verification.claim) {
    return { ok: false, code: "USED", message: "This invitation has already been used." };
  }
  if (!verification.inviteExpiresAt || verification.inviteExpiresAt.getTime() <= Date.now()) {
    return { ok: false, code: "EXPIRED", message: "This invitation has expired. Ask the organizer for a new link." };
  }
  if (!verification.purchaserEmailCipher) {
    return { ok: false, code: "INVALID", message: "This invitation is not valid." };
  }

  let publicRef = makeClaimRef();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const claim = await prisma.$transaction(async (tx) => {
        const fresh = await tx.ticketVerification.findUnique({
          where: { id: verification.id },
          include: { claim: true },
        });
        if (!fresh || fresh.status !== "VERIFIED") throw new Error("INVALID");
        if (fresh.claim) throw new Error("USED");
        if (!fresh.inviteExpiresAt || fresh.inviteExpiresAt.getTime() <= Date.now()) {
          throw new Error("EXPIRED");
        }

        const created = await tx.cardClaim.create({
          data: {
            publicRef,
            eventId: fresh.eventId,
            verificationId: fresh.id,
            emailCipher: fresh.purchaserEmailCipher!,
            emailHash: fresh.purchaserEmailHash,
            emailMasked: fresh.purchaserEmailMasked,
            displayName: params.displayName,
            ticketRefCipher: fresh.providerRefCipher,
            ticketRefLast4: fresh.orderRefLast4,
            status: "VERIFIED",
            source: "INVITE",
            ipHash: hashIp(params.ip),
          },
        });

        await tx.ticketVerification.update({
          where: { id: fresh.id },
          data: {
            inviteTokenCipher: null,
            inviteExpiresAt: null,
            inviteStatus: "CLAIMED",
            inviteError: null,
          },
        });

        return created;
      });

      await recordAudit({
        action: "CLAIM_INVITE_ACCEPTED",
        entity: "CardClaim",
        entityId: claim.id,
        metadata: { publicRef: claim.publicRef, verificationId: verification.id },
        ipHash: hashIp(params.ip),
      });

      return {
        ok: true,
        publicRef: claim.publicRef,
        status: "VERIFIED",
        message:
          "Your ticket is verified and your claim is in. The organizer will issue your card and email the private link.",
      };
    } catch (error) {
      if (error instanceof Error && ["INVALID", "USED", "EXPIRED"].includes(error.message)) {
        const code = error.message as "INVALID" | "USED" | "EXPIRED";
        return {
          ok: false,
          code,
          message:
            code === "USED"
              ? "This invitation has already been used."
              : code === "EXPIRED"
                ? "This invitation has expired. Ask the organizer for a new link."
                : "This invitation is not valid.",
        };
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const target = String(error.meta?.target ?? "");
        if (target.includes("verificationId")) {
          return { ok: false, code: "USED", message: "This invitation has already been used." };
        }
        publicRef = makeClaimRef();
        continue;
      }
      console.error("Invite claim failed", error);
      return { ok: false, code: "ERROR", message: "Something went wrong. Please try again." };
    }
  }

  return { ok: false, code: "ERROR", message: "Could not create the claim. Please try again." };
}
