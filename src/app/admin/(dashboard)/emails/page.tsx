import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, MailCheck, RefreshCw, ShieldAlert } from "lucide-react";
import {
  AdminEmpty,
  AdminFlash,
  AdminPanel,
  AdminTableShell,
  StatusPill,
} from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { retryEmailAction } from "@/app/admin/actions";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";
import { getEmailConfig } from "@/server/email";

export const metadata: Metadata = { title: "Email deliveries" };
export const dynamic = "force-dynamic";

export default async function AdminEmailsPage({
  searchParams,
}: {
  searchParams: { ok?: string; error?: string };
}) {
  const session = await requireAdmin();

  const [deliveries, groups] = await Promise.all([
    prisma.emailDelivery.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        card: {
          select: {
            id: true,
            cardNumber: true,
            claim: { select: { publicRef: true } },
          },
        },
      },
    }),
    prisma.emailDelivery.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const counts: Record<string, number> = Object.fromEntries(
    groups.map((group) => [group.status, group._count._all]),
  );

  const canManage = ["OWNER", "REVIEWER"].includes(session.role);
  const email = getEmailConfig();
  const returnTo = "/admin/emails";

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[8px] font-bold uppercase tracking-[0.24em] text-crimson">Delivery</p>
        <h1 className="mt-2 font-display text-3xl uppercase leading-none text-bone">Emails</h1>
        <p className="mt-2 max-w-2xl text-[11px] leading-5 text-bone/35">
          Delivery records mirror the provider response. SKIPPED means email could not be attempted —
          use the private card link instead. Nothing here is assumed to be delivered.
        </p>
      </div>

      <AdminFlash ok={searchParams.ok} error={searchParams.error} />

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Sent", counts.SENT ?? 0],
          ["Pending", counts.PENDING ?? 0],
          ["Skipped", counts.SKIPPED ?? 0],
          ["Failed", counts.FAILED ?? 0],
        ].map(([label, value]) => (
          <div key={label} className="border border-white/10 bg-[#0d0d0d] px-4 py-3">
            <p className="text-[8px] uppercase tracking-[0.18em] text-bone/30">{label}</p>
            <p className="mt-1 font-display text-2xl text-bone">{value}</p>
          </div>
        ))}
      </div>

      <div
        className={
          email.configured
            ? "flex items-start gap-2 border border-emerald-400/25 bg-emerald-400/[0.04] p-4 text-[10px] leading-5 text-emerald-200/70"
            : "flex items-start gap-2 border border-amber-400/30 bg-amber-400/[0.05] p-4 text-[10px] leading-5 text-amber-100/65"
        }
      >
        {email.configured ? (
          <MailCheck size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
        ) : (
          <ShieldAlert size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
        )}
        {email.configured ? (
          <span>
            Resend is configured. Messages send from <strong>{email.from}</strong>
            {email.replyTo ? ` with replies to ${email.replyTo}` : ""}.
          </span>
        ) : (
          <span>
            Email is not configured. {email.reason} Set RESEND_API_KEY and EMAIL_FROM to enable
            delivery; until then every attempt is logged as SKIPPED and must be sent manually.
          </span>
        )}
      </div>

      <AdminPanel
        title="Delivery log"
        description="Most recent 100 attempts."
        actions={
          <Link href="/admin/cards" className="link-arrow text-bone/45">
            Card panels <ArrowUpRight size={11} aria-hidden="true" />
          </Link>
        }
      >
        {deliveries.length === 0 ? (
          <AdminEmpty>No delivery attempts yet. Issue a card to start the log.</AdminEmpty>
        ) : (
          <AdminTableShell>
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 text-[8px] uppercase tracking-[0.16em] text-bone/30">
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 font-semibold">Card</th>
                  <th className="px-4 py-3 font-semibold">Recipient</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Attempts</th>
                  <th className="px-4 py-3 font-semibold">Detail</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {deliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 align-top text-[9px] tabular-nums text-bone/40">
                      {delivery.createdAt.toLocaleString("en-GB", { timeZone: "Africa/Lagos" })}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Link
                        href={`/admin/cards/${delivery.card.id}`}
                        className="font-mono text-[10px] text-bone/70 hover:text-crimson"
                      >
                        {delivery.card.cardNumber}
                      </Link>
                      <p className="mt-0.5 font-mono text-[8px] text-bone/25">
                        {delivery.card.claim.publicRef}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top text-[10px] text-bone/55">
                      {delivery.toEmailMasked}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <StatusPill status={delivery.status} />
                    </td>
                    <td className="px-4 py-3 align-top text-[10px] tabular-nums text-bone/55">
                      {delivery.attempts}
                    </td>
                    <td className="max-w-[260px] px-4 py-3 align-top text-[9px] leading-4 text-bone/35">
                      {delivery.messageId ? (
                        <span className="break-all font-mono text-bone/45">
                          id {delivery.messageId}
                        </span>
                      ) : delivery.lastError ? (
                        delivery.lastError
                      ) : delivery.sentAt ? (
                        `Sent ${delivery.sentAt.toLocaleString("en-GB", {
                          timeZone: "Africa/Lagos",
                        })}`
                      ) : (
                        "Awaiting provider response"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      {canManage ? (
                        <form action={retryEmailAction}>
                          <input type="hidden" name="cardId" value={delivery.card.id} />
                          <input type="hidden" name="returnTo" value={returnTo} />
                          <ConfirmButton
                            message="Resend this card email?"
                            className="inline-flex items-center gap-1.5 border border-white/15 px-2.5 py-1.5 text-[8px] font-bold uppercase tracking-[0.12em] text-bone/55 transition-colors hover:border-crimson hover:text-crimson"
                          >
                            <RefreshCw size={10} aria-hidden="true" /> Retry
                          </ConfirmButton>
                        </form>
                      ) : (
                        <span className="text-[8px] uppercase tracking-[0.12em] text-bone/20">
                          Read-only
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTableShell>
        )}
      </AdminPanel>

      <AdminPanel title="Delivery semantics">
        <div className="grid gap-px bg-white/5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["SENT", "Provider accepted the message and returned an ID."],
            ["PENDING", "Attempt started but no final response recorded."],
            ["SKIPPED", "No credentials configured — nothing was sent."],
            ["FAILED", "Provider rejected the request; see the error."],
          ].map(([status, copy]) => (
            <div key={status} className="bg-[#0d0d0d] p-5">
              <StatusPill status={status} />
              <p className="mt-2 text-[9px] leading-4 text-bone/30">{copy}</p>
            </div>
          ))}
        </div>
      </AdminPanel>
    </div>
  );
}
