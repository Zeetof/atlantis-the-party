import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  Download,
  ExternalLink,
  Link2,
  Mail,
  Music2,
  ShieldAlert,
} from "lucide-react";
import {
  AdminField,
  AdminFlash,
  AdminPanel,
  AdminTableShell,
  StatusPill,
} from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { CopyField } from "@/components/admin/copy-field";
import { retryEmailAction, rotateCardAction } from "@/app/admin/actions";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";
import { getCardLinkFromCipher } from "@/server/claims";

export const metadata: Metadata = { title: "Card panel" };
export const dynamic = "force-dynamic";

type PageProps = {
  params: { id: string };
  searchParams: { ok?: string; error?: string };
};

export default async function AdminCardDetailPage({ params, searchParams }: PageProps) {
  const session = await requireAdmin();
  const card = await prisma.tributeCard.findUnique({
    where: { id: params.id },
    include: {
      song: true,
      claim: { include: { event: true, verification: true } },
      emailDeliveries: { orderBy: { createdAt: "desc" }, take: 12 },
    },
  });

  if (!card) notFound();

  const canManage = ["OWNER", "REVIEWER"].includes(session.role);
  const returnTo = `/admin/cards/${card.id}`;
  const latestEmail = card.emailDeliveries[0];

  let cardLink: string | null = null;
  try {
    cardLink = getCardLinkFromCipher(card.accessTokenCipher);
  } catch {
    cardLink = null;
  }

  const expiryDays = Math.ceil((card.tokenExpiresAt.getTime() - Date.now()) / 86_400_000);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/cards" className="link-arrow text-bone/40">
          <ArrowLeft size={12} aria-hidden="true" /> All cards
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.24em] text-crimson">
              Card panel
            </p>
            <h1 className="mt-2 font-display text-3xl uppercase leading-none text-bone">
              {card.displayName}
            </h1>
            <p className="mt-2 font-mono text-[11px] text-bone/40">{card.cardNumber}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={card.claim.status} />
            <StatusPill status={latestEmail?.status ?? "PENDING"} />
            <span className="border border-white/15 px-2 py-1 text-[8px] uppercase tracking-[0.14em] text-bone/40">
              {card.claim.publicRef}
            </span>
          </div>
        </div>
      </div>

      <AdminFlash ok={searchParams.ok} error={searchParams.error} />

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <AdminPanel
            title="Private access link"
            description="The link is the card holder's only credential. Rotating it invalidates the previous link immediately."
          >
            <div className="space-y-4 p-5">
              {cardLink ? (
                <CopyField label="Card link" value={cardLink} secret />
              ) : (
                <div className="flex items-start gap-2 border border-crimson/30 bg-crimson/[0.06] p-3 text-[10px] leading-5 text-[#ff8a86]">
                  <ShieldAlert size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                  The stored token could not be decrypted. Check AUTH_SECRET has not changed, then
                  rotate the link to issue a fresh one.
                </div>
              )}

              <div className="flex items-start gap-2 border border-amber-400/25 bg-amber-400/[0.05] p-3 text-[9px] leading-4 text-amber-100/60">
                <ShieldAlert size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
                Never post a card link in a group chat, on social media or in a public channel. Send
                it only to the verified ticket holder.
              </div>

              {canManage ? (
                <form action={rotateCardAction} className="border-t border-white/10 pt-4">
                  <input type="hidden" name="cardId" value={card.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <ConfirmButton
                    message="Rotate this link? The current link stops working immediately."
                    className="border border-white/20 px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.16em] text-bone/70 transition-colors hover:border-crimson hover:text-crimson"
                  >
                    <Link2 size={12} aria-hidden="true" /> Rotate private link
                  </ConfirmButton>
                  <p className="mt-2 text-[9px] leading-4 text-bone/30">
                    A new 30-day token replaces the old one. Remember to send the new link to the
                    holder.
                  </p>
                </form>
              ) : (
                <p className="border-t border-white/10 pt-4 text-[10px] leading-5 text-bone/35">
                  Your role ({session.role}) can view this panel but cannot rotate links or retry
                  delivery.
                </p>
              )}
            </div>
          </AdminPanel>

          <AdminPanel title="Card record">
            <dl className="grid gap-px bg-white/5 sm:grid-cols-2">
              {[
                {
                  icon: Music2,
                  label: "Assigned song",
                  value: card.song.title,
                  meta: `${card.song.platform} · ${card.song.linkStatus.replace(/_/g, " ").toLowerCase()}`,
                },
                {
                  icon: CalendarClock,
                  label: "Issued",
                  value: card.issuedAt.toLocaleString("en-GB", { timeZone: "Africa/Lagos" }),
                },
                {
                  icon: Download,
                  label: "Downloads",
                  value: String(card.downloads),
                  meta: "PNG downloads tracked from the card page",
                },
                {
                  icon: Link2,
                  label: "Link expiry",
                  value: card.tokenExpiresAt.toLocaleDateString("en-GB"),
                  meta: expiryDays >= 0 ? `${expiryDays} days remaining` : "Expired — rotate the link",
                },
                {
                  icon: Mail,
                  label: "Holder email",
                  value: card.claim.emailMasked,
                  meta: "Decrypted values are never rendered",
                },
                {
                  icon: ArrowUpRight,
                  label: "Public card ID",
                  value: card.publicId,
                  meta: "Non-secret identifier",
                },
              ].map((row) => (
                <div key={row.label} className="bg-[#0d0d0d] px-5 py-4">
                  <dt className="flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-bone/30">
                    <row.icon size={11} aria-hidden="true" /> {row.label}
                  </dt>
                  <dd className="mt-1.5 break-words text-[12px] text-bone/75">{row.value}</dd>
                  {row.meta && <p className="mt-1 text-[8px] text-bone/25">{row.meta}</p>}
                </div>
              ))}
            </dl>
          </AdminPanel>

          <AdminPanel
            title="Email delivery log"
            description="Statuses come directly from the provider response — no delivery is assumed."
            actions={
              latestEmail ? <StatusPill status={latestEmail.status} /> : undefined
            }
          >
            {card.emailDeliveries.length === 0 ? (
              <p className="px-5 py-6 text-[11px] text-bone/35">
                No delivery records yet. Use retry to attempt the first send.
              </p>
            ) : (
              <AdminTableShell>
                <table className="w-full min-w-[620px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-[8px] uppercase tracking-[0.16em] text-bone/30">
                      <th className="px-5 py-3 font-semibold">Created</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold">Attempts</th>
                      <th className="px-5 py-3 font-semibold">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {card.emailDeliveries.map((delivery) => (
                      <tr key={delivery.id}>
                        <td className="px-5 py-3 text-[9px] tabular-nums text-bone/45">
                          {delivery.createdAt.toLocaleString("en-GB", {
                            timeZone: "Africa/Lagos",
                          })}
                        </td>
                        <td className="px-5 py-3">
                          <StatusPill status={delivery.status} />
                        </td>
                        <td className="px-5 py-3 text-[10px] tabular-nums text-bone/55">
                          {delivery.attempts}
                        </td>
                        <td className="px-5 py-3 text-[9px] leading-4 text-bone/35">
                          {delivery.messageId ? (
                            <span className="font-mono text-bone/45">
                              id {delivery.messageId}
                            </span>
                          ) : delivery.lastError ? (
                            delivery.lastError
                          ) : (
                            "Awaiting provider response"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AdminTableShell>
            )}
          </AdminPanel>
        </div>

        <div className="space-y-5">
          {canManage && (
            <AdminPanel
              title="Retry delivery"
              description="Resends the private link to the holder's verified email."
            >
              <form action={retryEmailAction} className="space-y-3 p-5">
                <input type="hidden" name="cardId" value={card.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <p className="text-[10px] leading-5 text-bone/40">
                  Delivery runs through Resend when configured. Without credentials the attempt is
                  logged as SKIPPED and you should send the private link manually.
                </p>
                <ConfirmButton
                  message="Send the card email again?"
                  className="w-full bg-crimson px-4 py-3 text-[9px] font-bold uppercase tracking-[0.18em] text-ink transition-colors hover:bg-[#ff4b46]"
                >
                  Retry email
                </ConfirmButton>
              </form>
            </AdminPanel>
          )}

          <AdminPanel title="Linked claim">
            <div className="space-y-4 p-5">
              <dl className="space-y-3 text-[11px]">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-bone/35">Reference</dt>
                  <dd className="font-mono text-bone/70">{card.claim.publicRef}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-bone/35">Claim status</dt>
                  <dd>
                    <StatusPill status={card.claim.status} />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-bone/35">Verification</dt>
                  <dd className="text-bone/70">
                    {card.claim.verification ? card.claim.verification.source : "Not linked"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-bone/35">Event</dt>
                  <dd className="text-right text-bone/70">{card.claim.event.title}</dd>
                </div>
              </dl>
              <div className="flex flex-col gap-2">
                <Link
                  href={`/admin/claims/${card.claim.id}`}
                  className="inline-flex items-center justify-center gap-2 border border-white/20 px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.16em] text-bone/70 hover:border-crimson hover:text-crimson"
                >
                  Open claim review <ArrowUpRight size={12} aria-hidden="true" />
                </Link>
                {cardLink && (
                  <a
                    href={cardLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 border border-white/12 px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.16em] text-bone/50 hover:border-white/30 hover:text-bone"
                  >
                    Preview card <ExternalLink size={12} aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          </AdminPanel>

          <AdminPanel title="Song link">
            <div className="space-y-3 p-5">
              <p className="text-[11px] text-bone/70">{card.song.title}</p>
              <p className="text-[9px] leading-4 text-bone/30">
                {card.song.approved
                  ? card.song.linkStatus === "VERIFIED"
                    ? "Verified official link."
                    : "Approved with search fallback — confirm the exact official URL."
                  : "This song is currently unapproved. Review it before issuing more cards."}
              </p>
              <a
                href={card.song.officialUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-bone/45 hover:text-crimson"
              >
                Open link <ExternalLink size={11} aria-hidden="true" />
              </a>
              <div className="border-t border-white/10 pt-3">
                <Link href="/admin/songs" className="link-arrow text-bone/40">
                  Manage songs <ArrowUpRight size={11} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </AdminPanel>

          <AdminPanel title="Handling rules">
            <ul className="space-y-2 p-5 text-[9px] leading-4 text-bone/30">
              <li>One card per verified ticket — never issue a duplicate.</li>
              <li>Never read the full token aloud or paste it into a group chat.</li>
              <li>Rotate the link if it may have been exposed.</li>
              <li>Every action here is written to the audit log.</li>
            </ul>
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}
