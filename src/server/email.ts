import { decryptString } from "@/lib/crypto";
import { prisma } from "@/server/db";

type EmailConfig = {
  configured: boolean;
  apiKey: string | null;
  from: string | null;
  replyTo: string | null;
  reason?: string;
};

export function getEmailConfig(): EmailConfig {
  const apiKey = process.env.RESEND_API_KEY?.trim() || null;
  const from = process.env.EMAIL_FROM?.trim() || null;
  const replyTo = process.env.EMAIL_REPLY_TO?.trim() || null;

  if (!apiKey) {
    return { configured: false, apiKey, from, replyTo, reason: "RESEND_API_KEY is not configured." };
  }
  if (!from || from.includes("example.com")) {
    return {
      configured: false,
      apiKey,
      from,
      replyTo,
      reason: "EMAIL_FROM is missing or still uses the example.com placeholder.",
    };
  }
  return { configured: true, apiKey, from, replyTo };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cardEmailHtml(input: {
  displayName: string;
  cardNumber: string;
  songTitle: string;
  songUrl: string;
  link: string;
}) {
  const name = escapeHtml(input.displayName);
  const song = escapeHtml(input.songTitle);
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#080808;color:#F5F2ED;font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#080808;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#101010;border:1px solid #2a2a2a;">
          <tr><td style="padding:36px 32px 8px;text-align:center;">
            <p style="margin:0 0 10px;font-size:11px;letter-spacing:4px;color:#A9A9A9;text-transform:uppercase;">WESTHAN.ENT presents</p>
            <h1 style="margin:0;font-size:44px;letter-spacing:-1px;line-height:1;color:#F5F2ED;">ATLANTIS</h1>
            <p style="margin:8px 0 0;font-size:12px;letter-spacing:6px;color:#E53935;text-transform:uppercase;">The Party</p>
          </td></tr>
          <tr><td style="padding:24px 32px;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;color:#A9A9A9;text-transform:uppercase;">999 — Forever in the music</p>
            <h2 style="margin:0 0 16px;font-size:28px;line-height:1.15;color:#F5F2ED;">${name}, your tribute card is ready.</h2>
            <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#cfcbc4;">Your Atlantis 4.0 purchase has been verified and your personal 999 collectible has been issued for December 30, 2026.</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#171717;border:1px solid #333;margin-bottom:24px;">
              <tr><td style="padding:20px 24px;">
                <p style="margin:0 0 6px;font-size:10px;letter-spacing:2px;color:#A9A9A9;text-transform:uppercase;">Card number</p>
                <p style="margin:0 0 16px;font-size:16px;color:#F5F2ED;font-family:'Courier New',monospace;">${escapeHtml(input.cardNumber)}</p>
                <p style="margin:0 0 6px;font-size:10px;letter-spacing:2px;color:#A9A9A9;text-transform:uppercase;">Assigned song</p>
                <p style="margin:0;font-size:16px;color:#F5F2ED;">${song}</p>
              </td></tr>
            </table>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
              <tr><td style="background:#E53935;">
                <a href="${input.link}" style="display:inline-block;padding:16px 28px;color:#080808;font-weight:bold;text-decoration:none;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Open your card</a>
              </td></tr>
            </table>
            <p style="margin:0 0 4px;font-size:12px;line-height:1.6;color:#8f8b85;">Private link. Do not forward publicly. The link expires in 30 days and can be reissued by the organizer.</p>
            <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#8f8b85;">Listen on the official platform: <a href="${input.songUrl}" style="color:#E53935;">${song}</a></p>
          </td></tr>
          <tr><td style="padding:20px 32px 32px;border-top:1px solid #242424;">
            <p style="margin:0;font-size:10px;line-height:1.6;color:#77736d;">ATLANTIS THE PARTY · WESTHAN.ENT · December 30, 2026 · Watercress Event Center, Allen, Ikeja, Lagos. This is an independent remembrance experience, not affiliated with Juice WRLD's estate.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export type DeliveryResult = {
  status: "SENT" | "FAILED" | "SKIPPED" | "PENDING";
  error?: string;
  messageId?: string;
};

function inviteEmailHtml(input: { link: string; expiresAt: Date }) {
  const expires = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(input.expiresAt);

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#080808;color:#F5F2ED;font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#080808;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#101010;border:1px solid #2a2a2a;">
          <tr><td style="padding:36px 32px 8px;text-align:center;">
            <p style="margin:0 0 10px;font-size:11px;letter-spacing:4px;color:#A9A9A9;text-transform:uppercase;">WESTHAN.ENT presents</p>
            <h1 style="margin:0;font-size:44px;letter-spacing:-1px;line-height:1;color:#F5F2ED;">ATLANTIS</h1>
            <p style="margin:8px 0 0;font-size:12px;letter-spacing:6px;color:#E53935;text-transform:uppercase;">The Party</p>
          </td></tr>
          <tr><td style="padding:24px 32px;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;color:#A9A9A9;text-transform:uppercase;">999 — Forever in the music</p>
            <h2 style="margin:0 0 16px;font-size:28px;line-height:1.15;color:#F5F2ED;">Your Atlantis ticket is verified.</h2>
            <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#cfcbc4;">The organizer's purchase record matches this email address. You can now choose the name for your personal 999 tribute card — no order reference is needed.</p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
              <tr><td style="background:#E53935;">
                <a href="${escapeHtml(input.link)}" style="display:inline-block;padding:16px 28px;color:#080808;font-weight:bold;text-decoration:none;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Claim your card</a>
              </td></tr>
            </table>
            <p style="margin:0 0 4px;font-size:12px;line-height:1.6;color:#8f8b85;">This private invitation is single-use and expires on ${escapeHtml(expires)}. Do not forward it. If you did not buy a ticket, you can ignore this email.</p>
            <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#8f8b85;">One card per verified purchase. The card is an independent remembrance experience and is not transferable.</p>
          </td></tr>
          <tr><td style="padding:20px 32px 32px;border-top:1px solid #242424;">
            <p style="margin:0;font-size:10px;line-height:1.6;color:#77736d;">ATLANTIS THE PARTY · WESTHAN.ENT · December 30, 2026 · Watercress Event Center, Allen, Ikeja, Lagos. Not affiliated with Juice WRLD's estate.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export async function sendInviteEmail(input: {
  to: string;
  link: string;
  expiresAt: Date;
}): Promise<DeliveryResult> {
  const config = getEmailConfig();
  if (!config.configured) {
    return { status: "SKIPPED", error: config.reason ?? "Email provider not configured." };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.from,
        to: [input.to],
        reply_to: config.replyTo || undefined,
        subject: "Claim your ATLANTIS 999 tribute card",
        html: inviteEmailHtml({ link: input.link, expiresAt: input.expiresAt }),
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 400);
      return { status: "FAILED", error: `Resend responded ${response.status}: ${detail}` };
    }

    const payload = (await response.json()) as { id?: string };
    return { status: "SENT", messageId: payload.id };
  } catch (error) {
    return {
      status: "FAILED",
      error: error instanceof Error ? error.message : "Unknown email delivery error.",
    };
  }
}

export async function sendCardEmail(cardId: string, options: { force?: boolean } = {}): Promise<DeliveryResult> {
  const card = await prisma.tributeCard.findUnique({
    where: { id: cardId },
    include: { claim: true, song: true, emailDeliveries: { orderBy: { createdAt: "desc" } } },
  });
  if (!card) throw new Error("Card not found.");

  const latest = card.emailDeliveries[0];
  if (latest?.status === "SENT" && !options.force) {
    return { status: "SENT", messageId: latest.messageId ?? undefined };
  }

  const delivery =
    latest ??
    (await prisma.emailDelivery.create({
      data: { cardId: card.id, toEmailMasked: card.claim.emailMasked, status: "PENDING" },
    }));

  const config = getEmailConfig();
  if (!config.configured) {
    const error = config.reason ?? "Email provider not configured.";
    await prisma.emailDelivery.update({
      where: { id: delivery.id },
      data: { status: "SKIPPED", lastError: error },
    });
    return { status: "SKIPPED", error };
  }

  const email = decryptString(card.claim.emailCipher);
  const token = decryptString(card.accessTokenCipher);
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const link = `${baseUrl}/card/${encodeURIComponent(token)}`;

  await prisma.emailDelivery.update({
    where: { id: delivery.id },
    data: { status: "PENDING", attempts: { increment: 1 }, lastError: null },
  });

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.from,
        to: [email],
        reply_to: config.replyTo || undefined,
        subject: "Your ATLANTIS 999 tribute card is ready",
        html: cardEmailHtml({
          displayName: card.displayName,
          cardNumber: card.cardNumber,
          songTitle: card.song.title,
          songUrl: card.song.officialUrl,
          link,
        }),
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 400);
      await prisma.emailDelivery.update({
        where: { id: delivery.id },
        data: { status: "FAILED", lastError: `Resend responded ${response.status}: ${detail}` },
      });
      return { status: "FAILED", error: `Resend responded ${response.status}.` };
    }

    const payload = (await response.json()) as { id?: string };
    await prisma.emailDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "SENT",
        messageId: payload.id ?? null,
        sentAt: new Date(),
        lastError: null,
      },
    });
    return { status: "SENT", messageId: payload.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email delivery error.";
    await prisma.emailDelivery.update({
      where: { id: delivery.id },
      data: { status: "FAILED", lastError: message.slice(0, 400) },
    });
    return { status: "FAILED", error: message };
  }
}
