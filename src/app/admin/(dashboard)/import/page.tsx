import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, ShieldCheck } from "lucide-react";
import { AdminFlash, AdminPanel, StatCard } from "@/components/admin/ui";
import { CsvImport } from "@/components/admin/csv-import";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";

export const metadata: Metadata = { title: "Buyer import" };
export const dynamic = "force-dynamic";

export default async function AdminImportPage({
  searchParams,
}: {
  searchParams: { ok?: string; error?: string };
}) {
  const session = await requireAdmin();
  const canWrite = ["OWNER", "REVIEWER"].includes(session.role);

  const event = await prisma.event.findUnique({ where: { slug: "atlantis-4" } });
  const [total, imported, invited, claimed, batches] = await Promise.all([
    prisma.ticketVerification.count({ where: { eventId: event?.id ?? "" } }),
    prisma.ticketVerification.count({ where: { source: "IMPORT" } }),
    prisma.ticketVerification.count({ where: { inviteStatus: "SENT" } }),
    prisma.ticketVerification.count({ where: { claim: { isNot: null } } }),
    prisma.ticketVerification.groupBy({
      by: ["importBatch"],
      where: { importBatch: { not: null } },
      _count: { _all: true },
      _max: { receivedAt: true },
      orderBy: { _max: { receivedAt: "desc" } },
      take: 6,
    }),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <p className="text-[8px] font-bold uppercase tracking-[0.24em] text-crimson">Distribution</p>
        <h1 className="font-display text-3xl uppercase leading-none text-bone">Buyer import</h1>
        <p className="mt-1 max-w-2xl text-[11px] leading-5 text-bone/35">
          Upload the official Popout Tickets export so verified purchasers can claim their 999
          card. Only import records you can reconcile with the provider.
        </p>
      </div>

      <AdminFlash ok={searchParams.ok} error={searchParams.error} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Verified purchases" value={total} meta="All sources" />
        <StatCard label="Imported" value={imported} meta="From buyer CSV" />
        <StatCard label="Invitations sent" value={invited} meta="Email accepted by provider" />
        <StatCard label="Claims created" value={claimed} meta="Any source" accent />
      </div>

      <AdminPanel
        title="Import buyer list"
        description="The file is parsed in your browser. Only validated rows are submitted."
      >
        <div className="p-5">
          {canWrite ? (
            <CsvImport canWrite={canWrite} />
          ) : (
            <p className="border border-amber-400/30 bg-amber-400/[0.06] p-4 text-[11px] leading-5 text-amber-200/70">
              Your role can view purchase records but cannot import buyer data. Ask an owner or
              reviewer to run the import.
            </p>
          )}
        </div>
      </AdminPanel>

      <div className="grid gap-5 lg:grid-cols-2">
        <AdminPanel title="Recent import batches">
          {batches.length === 0 ? (
            <p className="px-5 py-8 text-center text-[11px] text-bone/35">
              No CSV imports yet. Webhook and manual verifications still appear in the invites
              queue.
            </p>
          ) : (
            <ul className="divide-y divide-white/5">
              {batches.map((batch) => (
                <li
                  key={batch.importBatch}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div>
                    <p className="font-mono text-[10px] text-bone/70">{batch.importBatch}</p>
                    <p className="mt-0.5 text-[9px] text-bone/30">
                      {batch._max.receivedAt
                        ? batch._max.receivedAt.toLocaleString("en-GB", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </p>
                  </div>
                  <span className="border border-white/15 px-2 py-1 text-[9px] tabular-nums text-bone/55">
                    {batch._count._all} rows
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>

        <AdminPanel title="Before you import">
          <ul className="space-y-4 px-5 py-5 text-[11px] leading-6 text-bone/45">
            <li className="flex items-start gap-2.5">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-300/60" aria-hidden="true" />
              Use the provider&apos;s own export. Do not type buyer details from screenshots or
              social messages.
            </li>
            <li className="flex items-start gap-2.5">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-300/60" aria-hidden="true" />
              Each reference becomes a verified purchase record. The raw reference and email are
              encrypted; matching uses keyed hashes.
            </li>
            <li className="flex items-start gap-2.5">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-300/60" aria-hidden="true" />
              One card is issued per verified order record. If an order contains multiple tickets,
              confirm the intended policy with the organizer before splitting orders.
            </li>
          </ul>
          <div className="border-t border-white/10 px-5 py-4">
            <Link href="/admin/invites" className="link-arrow text-bone/60">
              Send invitations <ArrowUpRight size={12} aria-hidden="true" />
            </Link>
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
