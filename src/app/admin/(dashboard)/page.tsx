import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Mail,
  ShieldAlert,
  Ticket,
  Webhook,
} from "lucide-react";
import { AdminPanel, AdminEmpty, StatCard, StatusPill } from "@/components/admin/ui";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";
import { getEmailConfig } from "@/server/email";
import { getWebhookSecret } from "@/server/ticketing";
import { computeCountdown } from "@/lib/countdown";
import { formatEventDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const session = await requireAdmin();

  const [
    event,
    claimGroups,
    cardCount,
    recentClaims,
    emailGroups,
    pendingMedia,
    performerCount,
    approvedSongs,
    editionCount,
    awaitingClaim,
    invitedCount,
    latestAudit,
  ] = await Promise.all([
    prisma.event.findUnique({
      where: { slug: "atlantis-4" },
      include: { ticketCategories: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.cardClaim.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.tributeCard.count(),
    prisma.cardClaim.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { card: true } }),
    prisma.emailDelivery.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.media.count({ where: { status: "PENDING" } }),
    prisma.performer.count(),
    prisma.tributeSong.count({ where: { approved: true } }),
    prisma.edition.count(),
    prisma.ticketVerification.count({
      where: { status: "VERIFIED", claim: null, purchaserEmailCipher: { not: null } },
    }),
    prisma.ticketVerification.count({
      where: {
        status: "VERIFIED",
        claim: null,
        purchaserEmailCipher: { not: null },
        inviteStatus: "SENT",
      },
    }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  const claimsByStatus = Object.fromEntries(
    claimGroups.map((group) => [group.status, group._count._all]),
  ) as Record<string, number>;
  const emailsByStatus = Object.fromEntries(
    emailGroups.map((group) => [group.status, group._count._all]),
  ) as Record<string, number>;

  const emailConfigured = getEmailConfig().configured;
  const emailReason = getEmailConfig().reason;
  const webhookConfigured = Boolean(getWebhookSecret());
  const demoMode = process.env.DEMO_MODE === "true";
  const countdown = event
    ? computeCountdown(
        new Date(),
        event.eventDate,
        new Date(event.eventDate.getTime() + 10 * 60 * 60 * 1000),
      )
    : null;

  const manualReview = claimsByStatus.MANUAL_REVIEW ?? 0;
  const verified = claimsByStatus.VERIFIED ?? 0;
  const failedEmails = (emailsByStatus.FAILED ?? 0) + (emailsByStatus.SKIPPED ?? 0);
  const uninvited = Math.max(0, awaitingClaim - invitedCount);

  const canReview = ["OWNER", "REVIEWER"].includes(session.role);
  const canEdit = ["OWNER", "EDITOR"].includes(session.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <p className="text-[8px] font-bold uppercase tracking-[0.24em] text-crimson">Overview</p>
        <h1 className="font-display text-3xl uppercase leading-none text-bone">
          Good to see you, {session.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-[11px] text-bone/35">
          Role: {session.role} · {event ? `${event.title} · ${event.editionLabel}` : "Event not set"}
        </p>
      </div>

      {(manualReview > 0 ||
        pendingMedia > 0 ||
        failedEmails > 0 ||
        uninvited > 0 ||
        !event?.detailsVerified) && (
        <AdminPanel
          title="Needs attention"
          description="Items that need an organizer decision before the public record is complete."
        >
          <ul className="divide-y divide-white/5">
            {!event?.detailsVerified && (
              <li className="flex items-start gap-3 px-5 py-3.5">
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-300" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-[11px] text-bone/80">Event details are not marked verified</p>
                  <p className="mt-0.5 text-[9px] leading-4 text-bone/35">
                    Flyer facts are published as provisional until you confirm them.
                  </p>
                </div>
                {canEdit && (
                  <Link href="/admin/event" className="link-arrow shrink-0 text-bone/50">
                    Review <ArrowUpRight size={11} aria-hidden="true" />
                  </Link>
                )}
              </li>
            )}
            {manualReview > 0 && (
              <li className="flex items-start gap-3 px-5 py-3.5">
                <ShieldAlert size={14} className="mt-0.5 shrink-0 text-amber-300" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-[11px] text-bone/80">
                    {manualReview} claim{manualReview === 1 ? "" : "s"} in manual review
                  </p>
                  <p className="mt-0.5 text-[9px] leading-4 text-bone/35">
                    Verify against a real provider reference — never from a screenshot alone.
                  </p>
                </div>
                <Link href="/admin/claims?status=MANUAL_REVIEW" className="link-arrow shrink-0 text-bone/50">
                  Open <ArrowUpRight size={11} aria-hidden="true" />
                </Link>
              </li>
            )}
            {pendingMedia > 0 && (
              <li className="flex items-start gap-3 px-5 py-3.5">
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-300" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-[11px] text-bone/80">
                    {pendingMedia} media item{pendingMedia === 1 ? "" : "s"} awaiting review
                  </p>
                  <p className="mt-0.5 text-[9px] leading-4 text-bone/35">
                    Private files are never served until approved and copied to public storage.
                  </p>
                </div>
                {canEdit && (
                  <Link href="/admin/media?status=PENDING" className="link-arrow shrink-0 text-bone/50">
                    Review <ArrowUpRight size={11} aria-hidden="true" />
                  </Link>
                )}
              </li>
            )}
            {uninvited > 0 && (
              <li className="flex items-start gap-3 px-5 py-3.5">
                <Ticket size={14} className="mt-0.5 shrink-0 text-amber-300" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-[11px] text-bone/80">
                    {uninvited} verified purchase{uninvited === 1 ? "" : "s"} still need
                    {uninvited === 1 ? "s" : ""} an invitation
                  </p>
                  <p className="mt-0.5 text-[9px] leading-4 text-bone/35">
                    Buyers cannot claim until an invitation is sent. Invitation links are single-use
                    and expire after 30 days.
                  </p>
                </div>
                <Link href="/admin/invites" className="link-arrow shrink-0 text-bone/50">
                  Invite <ArrowUpRight size={11} aria-hidden="true" />
                </Link>
              </li>
            )}
            {failedEmails > 0 && (
              <li className="flex items-start gap-3 px-5 py-3.5">
                <Mail size={14} className="mt-0.5 shrink-0 text-amber-300" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-[11px] text-bone/80">
                    {failedEmails} card email{failedEmails === 1 ? "" : "s"} not sent
                  </p>
                  <p className="mt-0.5 text-[9px] leading-4 text-bone/35">
                    SKIPPED means the provider is not configured; FAILED means the provider rejected
                    or timed out. Cards remain accessible from the card panel.
                  </p>
                </div>
                <Link href="/admin/emails" className="link-arrow shrink-0 text-bone/50">
                  Email log <ArrowUpRight size={11} aria-hidden="true" />
                </Link>
              </li>
            )}
          </ul>
        </AdminPanel>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Claims total"
          value={claimGroups.reduce((sum, group) => sum + group._count._all, 0)}
          meta={`${manualReview} in review · ${verified} verified · ${awaitingClaim} awaiting claim`}
        />
        <StatCard label="Cards issued" value={cardCount} meta={`${approvedSongs} approved song${approvedSongs === 1 ? "" : "s"}`} accent />
        <StatCard
          label="Emails"
          value={`${emailsByStatus.SENT ?? 0} sent`}
          meta={`${emailsByStatus.SKIPPED ?? 0} skipped · ${emailsByStatus.FAILED ?? 0} failed`}
        />
        <StatCard label="Pending media" value={pendingMedia} meta={`${editionCount} editions · ${performerCount} performers`} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <AdminPanel
          className="xl:col-span-2"
          title="Recent claims"
          actions={
            <Link href="/admin/claims" className="link-arrow text-bone/45">
              All claims <ArrowUpRight size={11} aria-hidden="true" />
            </Link>
          }
        >
          {recentClaims.length === 0 ? (
            <AdminEmpty>No claims yet. Claims appear here after a ticket holder submits one.</AdminEmpty>
          ) : (
            <ul className="divide-y divide-white/5">
              {recentClaims.map((claim) => (
                <li key={claim.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] text-bone/80">{claim.displayName}</p>
                    <p className="mt-0.5 truncate font-mono text-[9px] text-bone/30">
                      {claim.publicRef} · {claim.emailMasked} · {claim.createdAt.toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <StatusPill status={claim.status} />
                  <Link
                    href={`/admin/claims/${claim.id}`}
                    className="text-[8px] font-bold uppercase tracking-[0.16em] text-bone/40 hover:text-crimson"
                  >
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>

        <div className="space-y-5">
          <AdminPanel title="Event window">
            {event ? (
              <div className="space-y-3 p-5">
                <p className="font-display text-2xl uppercase leading-none text-bone">
                  {formatEventDate(event.eventDate)}
                </p>
                <p className="text-[11px] text-bone/45">
                  {event.timeStart} — {event.timeEnd} · {event.timezone}
                </p>
                <p className="text-[11px] text-bone/45">
                  {event.venueName}, {event.venueAddress}
                </p>
                {countdown && countdown.status !== "ended" && (
                  <p className="border-t border-white/10 pt-3 text-[10px] uppercase tracking-[0.16em] text-crimson">
                    {countdown.status === "live"
                      ? "Live now"
                      : `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m to start`}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <StatusPill status={event.detailsVerified ? "CONFIRMED" : "PENDING"} />
                  <span className="text-[9px] text-bone/30">
                    {event.detailsVerified ? "Details verified" : "Provisional — not verified"}
                  </span>
                </div>
                {canEdit && (
                  <Link href="/admin/event" className="link-arrow text-bone/50">
                    Edit event <ArrowUpRight size={11} aria-hidden="true" />
                  </Link>
                )}
              </div>
            ) : (
              <AdminEmpty>No event configured.</AdminEmpty>
            )}
          </AdminPanel>

          <AdminPanel title="Integration status">
            <ul className="divide-y divide-white/5">
              <li className="flex items-center justify-between gap-3 px-5 py-3">
                <span className="flex items-center gap-2 text-[10px] text-bone/55">
                  <Mail size={13} aria-hidden="true" /> Resend email
                </span>
                <span className={emailConfigured ? "text-[9px] text-emerald-300/80" : "text-[9px] text-amber-200/70"}>
                  {emailConfigured ? "Configured" : "Not configured"}
                </span>
              </li>
              {!emailConfigured && emailReason && (
                <li className="px-5 py-2.5 text-[9px] leading-4 text-bone/30">{emailReason}</li>
              )}
              <li className="flex items-center justify-between gap-3 px-5 py-3">
                <span className="flex items-center gap-2 text-[10px] text-bone/55">
                  <Webhook size={13} aria-hidden="true" /> Ticket webhook
                </span>
                <span className={webhookConfigured ? "text-[9px] text-emerald-300/80" : "text-[9px] text-amber-200/70"}>
                  {webhookConfigured ? "Secret set" : "No secret"}
                </span>
              </li>
              <li className="flex items-center justify-between gap-3 px-5 py-3">
                <span className="flex items-center gap-2 text-[10px] text-bone/55">
                  <Ticket size={13} aria-hidden="true" /> Claim intake
                </span>
                <Link href="/admin/event" className="text-[9px] uppercase tracking-[0.14em] text-bone/40 hover:text-crimson">
                  Manage
                </Link>
              </li>
            </ul>
          </AdminPanel>
        </div>
      </div>

      <AdminPanel title="Recent activity">
        {latestAudit.length === 0 ? (
          <AdminEmpty>No audit entries yet.</AdminEmpty>
        ) : (
          <ul className="divide-y divide-white/5">
            {latestAudit.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-2.5">
                <CheckCircle2 size={11} className="shrink-0 text-bone/20" aria-hidden="true" />
                <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-bone/55">
                  {entry.action.replace(/_/g, " ")}
                </span>
                <span className="text-[9px] text-bone/25">{entry.actorEmail}</span>
                <span className="ml-auto font-mono text-[8px] text-bone/20">
                  {entry.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>

      <p className="text-[9px] leading-4 text-bone/25">
        {canReview
          ? "You can verify claims and issue cards. "
          : "Your role cannot issue cards. "}
        {canEdit
          ? "You can edit event content, lineup, media and songs."
          : "Content editing is limited to OWNER and EDITOR roles."}{" "}
        {demoMode && "DEMO_MODE is enabled — the sandbox purchase can exercise the verified flow."}
      </p>
    </div>
  );
}
