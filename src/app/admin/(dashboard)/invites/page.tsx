import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, MailCheck, MailWarning, Sparkles } from "lucide-react";
import {
  AdminButton,
  AdminEmpty,
  AdminFlash,
  AdminPanel,
  AdminTableShell,
  StatCard,
  StatusPill,
} from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { CopyField } from "@/components/admin/copy-field";
import { issueAllVerifiedAction, sendInviteAction, sendInvitesBulkAction } from "@/app/admin/actions";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";
import { getEmailConfig } from "@/server/email";
import { buildInviteLink } from "@/server/invites";
import { decryptString } from "@/lib/crypto";

export const metadata: Metadata = { title: "Invitations" };
export const dynamic = "force-dynamic";

function inviteState(item: {
  claim: unknown;
  inviteStatus: string | null;
  inviteTokenCipher: string | null;
  inviteExpiresAt: Date | null;
}) {
  if (item.claim) return "CLAIMED";
  if (
    item.inviteTokenCipher &&
    item.inviteExpiresAt &&
    item.inviteExpiresAt.getTime() <= Date.now()
  ) {
    return "EXPIRED";
  }
  if (item.inviteStatus === "SENT") return "SENT";
  if (item.inviteStatus === "FAILED") return "FAILED";
  if (item.inviteStatus === "SKIPPED") return "SKIPPED";
  if (item.inviteTokenCipher) return "SKIPPED";
  return "NOT_SENT";
}

export default async function AdminInvitesPage({
  searchParams,
}: {
  searchParams: { ok?: string; error?: string; q?: string };
}) {
  const session = await requireAdmin();
  const canReview = ["OWNER", "REVIEWER"].includes(session.role);
  const email = getEmailConfig();
  const q = searchParams.q?.trim() ?? "";

  const eligibleWhere = {
    status: "VERIFIED",
    claim: null,
    purchaserEmailCipher: { not: null },
  };

  const [purchases, eligible, sent, failed, linkOnly, unclaimedClaims, issuedCount] =
    await Promise.all([
      prisma.ticketVerification.findMany({
        where: {
          ...eligibleWhere,
          ...(q ? { purchaserEmailMasked: { contains: q.toLowerCase() } } : {}),
        },
        orderBy: { receivedAt: "desc" },
        take: 100,
        include: { claim: { select: { id: true } } },
      }),
      prisma.ticketVerification.count({ where: eligibleWhere }),
      prisma.ticketVerification.count({ where: { ...eligibleWhere, inviteStatus: "SENT" } }),
      prisma.ticketVerification.count({ where: { ...eligibleWhere, inviteStatus: "FAILED" } }),
      prisma.ticketVerification.count({ where: { ...eligibleWhere, inviteStatus: "SKIPPED" } }),
      prisma.cardClaim.count({
        where: { status: "VERIFIED", card: null, verificationId: { not: null } },
      }),
      prisma.cardClaim.count({ where: { status: "ISSUED" } }),
    ]);

  const pendingInvites = Math.max(0, eligible - sent);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <p className="text-[8px] font-bold uppercase tracking-[0.24em] text-crimson">Distribution</p>
        <h1 className="font-display text-3xl uppercase leading-none text-bone">Invitations</h1>
        <p className="mt-1 max-w-2xl text-[11px] leading-5 text-bone/35">
          Send each verified purchaser a single-use link to claim their card. Invitation links
          expire after 30 days and are burned the moment a claim is created.
        </p>
      </div>

      <AdminFlash ok={searchParams.ok} error={searchParams.error} />

      {!email.configured && (
        <div className="flex items-start gap-2.5 border border-amber-400/30 bg-amber-400/[0.06] p-4 text-[11px] leading-5 text-amber-200/75">
          <MailWarning size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            Email delivery is not configured ({email.reason}). Sending an invitation still creates a
            private link; copy it from the row and send it through an official organiser channel.
          </span>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Awaiting claim" value={eligible} meta="Verified, no claim yet" />
        <StatCard label="Invite emailed" value={sent} meta="Provider accepted" />
        <StatCard
          label="Needs attention"
          value={failed + linkOnly}
          meta={`${failed} failed · ${linkOnly} link-only`}
        />
        <StatCard
          label="Verified cards to issue"
          value={unclaimedClaims}
          meta={`${issuedCount} issued overall`}
          accent
        />
      </div>

      <AdminPanel
        title="Distribution runs"
        description="Bulk actions process at most 25 invitations and 20 card issues per run."
        actions={
          canReview ? (
            <>
              <form action={sendInvitesBulkAction}>
                <input type="hidden" name="returnTo" value="/admin/invites" />
                <ConfirmButton
                  message={`Email invitations to up to 25 of the ${pendingInvites} pending purchasers?`}
                  className="inline-flex items-center justify-center gap-2 border border-white/20 px-3.5 py-2.5 text-[9px] font-bold uppercase tracking-[0.16em] text-bone/75 transition-colors hover:border-crimson hover:text-crimson"
                >
                  <MailCheck size={13} aria-hidden="true" /> Send pending invites
                </ConfirmButton>
              </form>
              <form action={issueAllVerifiedAction}>
                <input type="hidden" name="returnTo" value="/admin/invites" />
                <ConfirmButton
                  message="Issue up to 20 verified cards now? Each card is permanent and its private link is emailed when delivery is configured."
                  className="inline-flex items-center justify-center gap-2 bg-crimson px-3.5 py-2.5 text-[9px] font-bold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-[#ff4b46]"
                >
                  <Sparkles size={13} aria-hidden="true" /> Issue verified cards
                </ConfirmButton>
              </form>
            </>
          ) : (
            <span className="text-[9px] uppercase tracking-[0.14em] text-bone/30">
              Reviewer access required
            </span>
          )
        }
      >
        <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[9px] leading-4 text-bone/30">
            {pendingInvites === 0
              ? "Every verified purchase with an email has an invitation on file."
              : `${pendingInvites} purchases still need an invitation.`}
          </p>
          <form method="GET" action="/admin/invites" className="flex gap-2">
            <label className="sr-only" htmlFor="invite-search">
              Search by masked email
            </label>
            <input
              id="invite-search"
              name="q"
              defaultValue={q}
              placeholder="Search masked email"
              className="w-full border border-white/12 bg-ink px-3 py-2 text-[10px] text-bone placeholder:text-bone/25 focus:border-crimson sm:w-52"
            />
            <button
              type="submit"
              className="border border-white/15 px-3 text-[8px] font-bold uppercase tracking-[0.14em] text-bone/55 hover:border-crimson hover:text-crimson"
            >
              Search
            </button>
          </form>
        </div>

        {purchases.length === 0 ? (
          <AdminEmpty>
            No unclaimed verified purchases match this view.{" "}
            <Link href="/admin/import" className="underline decoration-white/20 hover:text-bone">
              Import a buyer list
            </Link>{" "}
            to get started.
          </AdminEmpty>
        ) : (
          <AdminTableShell>
            <table className="w-full min-w-[980px] border-collapse text-left align-top">
              <thead>
                <tr className="border-b border-white/10 text-[8px] uppercase tracking-[0.16em] text-bone/30">
                  <th className="px-4 py-3 font-semibold">Purchaser</th>
                  <th className="px-4 py-3 font-semibold">Purchase</th>
                  <th className="px-4 py-3 font-semibold">Invite</th>
                  <th className="px-4 py-3 font-semibold">Expires</th>
                  <th className="px-4 py-3 font-semibold">Private link</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {purchases.map((item) => {
                  const state = inviteState(item);
                  const validLink =
                    item.inviteTokenCipher &&
                    item.inviteExpiresAt &&
                    item.inviteExpiresAt.getTime() > Date.now()
                      ? buildInviteLink(decryptString(item.inviteTokenCipher))
                      : null;

                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <p className="text-[11px] text-bone/75">{item.purchaserEmailMasked}</p>
                        <p className="mt-0.5 text-[8px] uppercase tracking-[0.12em] text-bone/25">
                          {item.source.replace(/_/g, " ")}
                          {item.importBatch ? ` · ${item.importBatch}` : ""}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-[10px] text-bone/55">
                          •••• {item.orderRefLast4}
                        </p>
                        <p className="mt-0.5 text-[8px] uppercase tracking-[0.12em] text-bone/25">
                          {item.quantity} ticket{item.quantity === 1 ? "" : "s"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={state} />
                        {item.inviteError && (
                          <p className="mt-1 max-w-[150px] truncate text-[8px] text-[#ff8a86]/70">
                            {item.inviteError}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[9px] tabular-nums text-bone/35">
                        {item.inviteExpiresAt
                          ? item.inviteExpiresAt.toLocaleDateString("en-GB")
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {validLink ? (
                          <CopyField label="Invite link" value={validLink} secret />
                        ) : (
                          <span className="text-[9px] text-bone/25">Generate to create</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-end gap-2">
                          <form action={sendInviteAction}>
                            <input type="hidden" name="verificationId" value={item.id} />
                            <input type="hidden" name="returnTo" value="/admin/invites" />
                            <AdminButton
                              type="submit"
                              variant={state === "SENT" ? "outline" : "primary"}
                              disabled={!canReview}
                            >
                              {state === "SENT"
                                ? "Email again"
                                : state === "FAILED"
                                  ? "Retry email"
                                  : validLink
                                    ? "Email link"
                                    : "Create & email"}
                            </AdminButton>
                          </form>
                          {validLink && (
                            <form action={sendInviteAction}>
                              <input type="hidden" name="verificationId" value={item.id} />
                              <input type="hidden" name="force" value="true" />
                              <input type="hidden" name="returnTo" value="/admin/invites" />
                              <ConfirmButton
                                message="Replace the current invite link? The previous link will stop working immediately."
                                disabled={!canReview}
                                className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.14em] text-bone/35 hover:text-crimson disabled:opacity-40"
                              >
                                New link
                              </ConfirmButton>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </AdminTableShell>
        )}
      </AdminPanel>

      <AdminPanel title="How the claim loop works">
        <ol className="grid gap-5 px-5 py-5 text-[11px] leading-6 text-bone/45 sm:grid-cols-2 lg:grid-cols-4">
          <li>
            <span className="block text-[8px] font-bold uppercase tracking-[0.18em] text-crimson">
              01 · Import
            </span>
            Verified purchase records enter the queue from the provider export or webhook.
          </li>
          <li>
            <span className="block text-[8px] font-bold uppercase tracking-[0.18em] text-crimson">
              02 · Invite
            </span>
            Each purchaser receives a single-use link. Nothing is revealed on the public lookup.
          </li>
          <li>
            <span className="block text-[8px] font-bold uppercase tracking-[0.18em] text-crimson">
              03 · Claim
            </span>
            The attendee adds their display name and consents to the privacy notice.
          </li>
          <li>
            <span className="block text-[8px] font-bold uppercase tracking-[0.18em] text-crimson">
              04 · Issue
            </span>
            A card is minted per verified order, emailed privately, and never posted publicly.
          </li>
        </ol>
        <p className="border-t border-white/10 px-5 py-3 text-[9px] leading-4 text-bone/25">
          One card per verified order record. Copying a link exposes it — only share through the
          purchaser&apos;s own email address or an official organiser channel.
        </p>
      </AdminPanel>

      <p className="flex items-center gap-1.5 text-[9px] text-bone/25">
        <ArrowUpRight size={11} aria-hidden="true" />
        All invite, rotation and issuance events are written to the audit log.
      </p>
    </div>
  );
}
