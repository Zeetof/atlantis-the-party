import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Fingerprint,
  Mail,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import {
  AdminField,
  AdminFlash,
  AdminPanel,
  AdminTextarea,
  StatusPill,
} from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { CopyField } from "@/components/admin/copy-field";
import { issueCardAction, rejectClaimAction, verifyClaimAction } from "@/app/admin/actions";
import { getCardLinkFromCipher } from "@/server/claims";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";
import { CLAIM_STATUS_LABELS, truncate } from "@/lib/utils";

export const metadata: Metadata = { title: "Claim review" };
export const dynamic = "force-dynamic";

type PageProps = {
  params: { id: string };
  searchParams: { ok?: string; error?: string };
};

export default async function AdminClaimDetailPage({ params, searchParams }: PageProps) {
  const session = await requireAdmin();
  const claim = await prisma.cardClaim.findUnique({
    where: { id: params.id },
    include: {
      verification: true,
      event: true,
      card: {
        include: {
          song: true,
          emailDeliveries: { orderBy: { createdAt: "desc" }, take: 3 },
        },
      },
    },
  });

  if (!claim) notFound();

  const canReview = ["OWNER", "REVIEWER"].includes(session.role);
  const returnTo = `/admin/claims/${claim.id}`;
  const latestEmail = claim.card?.emailDeliveries[0];

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/claims" className="link-arrow text-bone/40">
          <ArrowLeft size={12} aria-hidden="true" /> All claims
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.24em] text-crimson">
              Claim review
            </p>
            <h1 className="mt-2 font-display text-3xl uppercase leading-none text-bone">
              {claim.displayName}
            </h1>
            <p className="mt-2 font-mono text-[11px] text-bone/40">{claim.publicRef}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={claim.status} />
            <span className="border border-white/15 px-2 py-1 text-[8px] uppercase tracking-[0.14em] text-bone/40">
              {CLAIM_STATUS_LABELS[claim.status] ?? claim.status}
            </span>
          </div>
        </div>
      </div>

      <AdminFlash ok={searchParams.ok} error={searchParams.error} />

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <AdminPanel title="Claim details">
            <dl className="grid gap-px bg-white/5 sm:grid-cols-2">
              {[
                {
                  icon: UserRound,
                  label: "Display name",
                  value: claim.displayName,
                },
                {
                  icon: Mail,
                  label: "Purchase email",
                  value: claim.emailMasked,
                  meta: "Encrypted at rest · masked display",
                },
                {
                  icon: Fingerprint,
                  label: "Ticket reference",
                  value: claim.ticketRefLast4 ? `•••• ${claim.ticketRefLast4}` : "Not recorded",
                  meta: "Full reference is never rendered",
                },
                {
                  icon: BadgeCheck,
                  label: "Source",
                  value: claim.source.replace(/_/g, " "),
                },
              ].map((row) => (
                <div key={row.label} className="bg-[#0d0d0d] px-5 py-4">
                  <dt className="flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-bone/30">
                    <row.icon size={11} aria-hidden="true" /> {row.label}
                  </dt>
                  <dd className="mt-1.5 text-[12px] text-bone/75">{row.value}</dd>
                  {row.meta && <p className="mt-1 text-[8px] text-bone/25">{row.meta}</p>}
                </div>
              ))}
              <div className="bg-[#0d0d0d] px-5 py-4">
                <dt className="text-[8px] font-semibold uppercase tracking-[0.16em] text-bone/30">
                  Submitted
                </dt>
                <dd className="mt-1.5 text-[12px] text-bone/75">
                  {claim.createdAt.toLocaleString("en-GB", { timeZone: "Africa/Lagos" })}
                </dd>
              </div>
              <div className="bg-[#0d0d0d] px-5 py-4">
                <dt className="text-[8px] font-semibold uppercase tracking-[0.16em] text-bone/30">
                  Decision
                </dt>
                <dd className="mt-1.5 text-[12px] text-bone/75">
                  {claim.decidedAt
                    ? claim.decidedAt.toLocaleString("en-GB", { timeZone: "Africa/Lagos" })
                    : "Pending"}
                </dd>
              </div>
            </dl>
            {claim.adminNote && (
              <div className="border-t border-white/10 px-5 py-3">
                <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-bone/30">
                  Admin note
                </p>
                <p className="mt-1 text-[11px] leading-5 text-bone/55">{claim.adminNote}</p>
              </div>
            )}
          </AdminPanel>

          <AdminPanel
            title="Linked verification"
            description={
              claim.verification
                ? "The purchase record this claim is matched to."
                : "No verified purchase is linked yet."
            }
          >
            {claim.verification ? (
              <dl className="grid gap-px bg-white/5 sm:grid-cols-2">
                <div className="bg-[#0d0d0d] px-5 py-4">
                  <dt className="text-[8px] uppercase tracking-[0.16em] text-bone/30">Provider</dt>
                  <dd className="mt-1.5 text-[12px] text-bone/75">{claim.verification.provider}</dd>
                </div>
                <div className="bg-[#0d0d0d] px-5 py-4">
                  <dt className="text-[8px] uppercase tracking-[0.16em] text-bone/30">Source</dt>
                  <dd className="mt-1.5 text-[12px] text-bone/75">
                    {claim.verification.source}
                  </dd>
                </div>
                <div className="bg-[#0d0d0d] px-5 py-4">
                  <dt className="text-[8px] uppercase tracking-[0.16em] text-bone/30">
                    Order (last 4)
                  </dt>
                  <dd className="mt-1.5 font-mono text-[12px] text-bone/75">
                    •••• {claim.verification.orderRefLast4}
                  </dd>
                </div>
                <div className="bg-[#0d0d0d] px-5 py-4">
                  <dt className="text-[8px] uppercase tracking-[0.16em] text-bone/30">
                    Purchaser email
                  </dt>
                  <dd className="mt-1.5 text-[12px] text-bone/75">
                    {claim.verification.purchaserEmailMasked}
                  </dd>
                </div>
                <div className="bg-[#0d0d0d] px-5 py-4">
                  <dt className="text-[8px] uppercase tracking-[0.16em] text-bone/30">Quantity</dt>
                  <dd className="mt-1.5 text-[12px] text-bone/75">{claim.verification.quantity}</dd>
                </div>
                <div className="bg-[#0d0d0d] px-5 py-4">
                  <dt className="text-[8px] uppercase tracking-[0.16em] text-bone/30">
                    Verified at
                  </dt>
                  <dd className="mt-1.5 text-[12px] text-bone/75">
                    {claim.verification.verifiedAt
                      ? claim.verification.verifiedAt.toLocaleString("en-GB", {
                          timeZone: "Africa/Lagos",
                        })
                      : "—"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="px-5 py-5 text-[11px] leading-5 text-bone/35">
                The claim did not match a signed purchase feed. Check the official provider record,
                then enter the reference below. Do not verify from a screenshot.
              </p>
            )}
          </AdminPanel>

          {claim.card && (
            <AdminPanel
              title="Issued card"
              actions={
                <Link href={`/admin/cards/${claim.card.id}`} className="link-arrow text-bone/45">
                  Card panel <ArrowUpRight size={11} aria-hidden="true" />
                </Link>
              }
            >
              <dl className="grid gap-px bg-white/5 sm:grid-cols-2">
                <div className="bg-[#0d0d0d] px-5 py-4">
                  <dt className="text-[8px] uppercase tracking-[0.16em] text-bone/30">Card number</dt>
                  <dd className="mt-1.5 font-mono text-[12px] text-bone/75">
                    {claim.card.cardNumber}
                  </dd>
                </div>
                <div className="bg-[#0d0d0d] px-5 py-4">
                  <dt className="text-[8px] uppercase tracking-[0.16em] text-bone/30">
                    Assigned song
                  </dt>
                  <dd className="mt-1.5 text-[12px] text-bone/75">{claim.card.song.title}</dd>
                </div>
                <div className="bg-[#0d0d0d] px-5 py-4">
                  <dt className="text-[8px] uppercase tracking-[0.16em] text-bone/30">Issued</dt>
                  <dd className="mt-1.5 text-[12px] text-bone/75">
                    {claim.card.issuedAt.toLocaleDateString("en-GB")}
                  </dd>
                </div>
                <div className="bg-[#0d0d0d] px-5 py-4">
                  <dt className="text-[8px] uppercase tracking-[0.16em] text-bone/30">Downloads</dt>
                  <dd className="mt-1.5 text-[12px] text-bone/75">{claim.card.downloads}</dd>
                </div>
                <div className="bg-[#0d0d0d] px-5 py-4">
                  <dt className="text-[8px] uppercase tracking-[0.16em] text-bone/30">
                    Latest email
                  </dt>
                  <dd className="mt-1.5 flex items-center gap-2 text-[12px] text-bone/75">
                    <StatusPill status={latestEmail?.status ?? "PENDING"} />
                    {latestEmail?.lastError && (
                      <span className="text-[8px] text-bone/30">
                        {truncate(latestEmail.lastError, 60)}
                      </span>
                    )}
                  </dd>
                </div>
                <div className="bg-[#0d0d0d] px-5 py-4">
                  <dt className="text-[8px] uppercase tracking-[0.16em] text-bone/30">
                    Link expiry
                  </dt>
                  <dd className="mt-1.5 text-[12px] text-bone/75">
                    {claim.card.tokenExpiresAt.toLocaleDateString("en-GB")}
                  </dd>
                </div>
              </dl>
              {canReview && (
                <div className="border-t border-white/10 p-5">
                  <CopyField
                    label="Private card link"
                    value={getCardLinkFromCipher(claim.card.accessTokenCipher)}
                    secret
                  />
                  <p className="mt-2 text-[9px] leading-4 text-bone/25">
                    Only send this link to the verified purchaser. Rotate it from the card panel if
                    it has been exposed.
                  </p>
                </div>
              )}
            </AdminPanel>
          )}
        </div>

        <div className="space-y-5">
          {canReview ? (
            <>
              {!claim.verification && !claim.card && claim.status !== "REJECTED" && (
                <AdminPanel
                  title="Verify purchase"
                  description="Only after checking the official provider record."
                  tone="danger"
                >
                  <form action={verifyClaimAction} className="space-y-3 p-5">
                    <input type="hidden" name="claimId" value={claim.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <AdminField
                      label="Provider / order reference"
                      name="providerRef"
                      required
                      placeholder="Exact reference from Popout or gate record"
                      hint="Stored hashed. The console only displays the last four characters."
                      spellCheck={false}
                      autoComplete="off"
                    />
                    <div className="flex items-start gap-2 border border-amber-400/25 bg-amber-400/[0.05] p-3 text-[9px] leading-4 text-amber-100/60">
                      <ShieldAlert size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
                      Verifying creates or links a purchase record for this email. Never approve from
                      a screenshot or an unconfirmed number.
                    </div>
                    <ConfirmButton
                      message="Confirm the reference was checked against the official provider record."
                      className="w-full bg-crimson px-4 py-3 text-[9px] font-bold uppercase tracking-[0.18em] text-ink transition-colors hover:bg-[#ff4b46]"
                    >
                      Mark purchase verified
                    </ConfirmButton>
                  </form>
                </AdminPanel>
              )}

              {claim.status === "VERIFIED" && !claim.card && (
                <AdminPanel title="Issue card" description="Assigns the next card number and a song.">
                  <form action={issueCardAction} className="space-y-3 p-5">
                    <input type="hidden" name="claimId" value={claim.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <p className="text-[10px] leading-5 text-bone/40">
                      The claim is verified. Issuing creates a unique card number, selects an approved
                      song deterministically and attempts email delivery.
                    </p>
                    <ConfirmButton
                      message="Issue this card now? A unique card number will be created."
                      className="w-full bg-crimson px-4 py-3 text-[9px] font-bold uppercase tracking-[0.18em] text-ink transition-colors hover:bg-[#ff4b46]"
                    >
                      Issue card
                    </ConfirmButton>
                  </form>
                </AdminPanel>
              )}

              {claim.status !== "REJECTED" && claim.status !== "ISSUED" && (
                <AdminPanel title="Reject claim" description="Record a reason for the attendee." tone="danger">
                  <form action={rejectClaimAction} className="space-y-3 p-5">
                    <input type="hidden" name="claimId" value={claim.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <AdminTextarea
                      label="Reason"
                      name="note"
                      rows={3}
                      required
                      hint="Shown to the organizer; keep it factual and short."
                    />
                    <ConfirmButton
                      message="Reject this claim? This cannot be undone from the console."
                      className="w-full border border-crimson/45 px-4 py-3 text-[9px] font-bold uppercase tracking-[0.18em] text-crimson transition-colors hover:bg-crimson hover:text-ink"
                    >
                      Reject claim
                    </ConfirmButton>
                  </form>
                </AdminPanel>
              )}

              {claim.card && (
                <AdminPanel title="Card controls">
                  <div className="space-y-3 p-5">
                    <p className="text-[10px] leading-5 text-bone/40">
                      Download counts, private link rotation and email retry are on the card panel.
                    </p>
                    <Link
                      href={`/admin/cards/${claim.card.id}`}
                      className="inline-flex w-full items-center justify-center gap-2 border border-white/20 px-4 py-3 text-[9px] font-bold uppercase tracking-[0.18em] text-bone/70 hover:border-crimson hover:text-crimson"
                    >
                      Open card panel <ArrowUpRight size={12} aria-hidden="true" />
                    </Link>
                  </div>
                </AdminPanel>
              )}

              {claim.status === "ISSUED" && !claim.card && (
                <AdminPanel title="Card reference missing">
                  <p className="p-5 text-[11px] leading-5 text-red-300/70">
                    The claim is marked issued but no card record is linked. Investigate the audit log
                    before making changes.
                  </p>
                </AdminPanel>
              )}

              {claim.status === "REJECTED" && (
                <AdminPanel title="Rejected">
                  <p className="p-5 text-[11px] leading-5 text-bone/40">
                    This claim was rejected. Rejected claims cannot be issued from the console.
                  </p>
                </AdminPanel>
              )}
            </>
          ) : (
            <AdminPanel title="Read-only role">
              <p className="p-5 text-[11px] leading-5 text-bone/40">
                Your role ({session.role}) can view claims but cannot verify, reject or issue cards.
                Sign in as an OWNER or REVIEWER to make decisions.
              </p>
            </AdminPanel>
          )}

          <AdminPanel title="Role note">
            <div className="space-y-2 p-5 text-[9px] leading-4 text-bone/30">
              <p>OWNER — full access.</p>
              <p>REVIEWER — claims and cards only.</p>
              <p>EDITOR — content only, no claim decisions.</p>
              <p className="pt-1 text-bone/20">Every decision is written to the audit log.</p>
            </div>
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}
