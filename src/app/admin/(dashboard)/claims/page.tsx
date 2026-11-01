import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { AdminFlash, AdminPanel, AdminTableShell, StatusPill, AdminEmpty } from "@/components/admin/ui";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";
import { CLAIM_STATUS_LABELS } from "@/lib/utils";

export const metadata: Metadata = { title: "Claims" };
export const dynamic = "force-dynamic";

const STATUSES = ["MANUAL_REVIEW", "VERIFIED", "ISSUED", "REJECTED"] as const;

export default async function AdminClaimsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string; ok?: string; error?: string };
}) {
  const session = await requireAdmin();
  const status = STATUSES.includes(searchParams.status as (typeof STATUSES)[number])
    ? searchParams.status
    : undefined;
  const q = searchParams.q?.trim() ?? "";

  const [claims, groups] = await Promise.all([
    prisma.cardClaim.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { publicRef: { contains: q.toUpperCase() } },
                { displayName: { contains: q } },
                { emailMasked: { contains: q.toLowerCase() } },
                { ticketRefLast4: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { card: true },
    }),
    prisma.cardClaim.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const counts: Record<string, number> = Object.fromEntries(
    groups.map((group) => [group.status, group._count._all]),
  );
  const total = groups.reduce((sum, group) => sum + group._count._all, 0);
  const canReview = ["OWNER", "REVIEWER"].includes(session.role);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <p className="text-[8px] font-bold uppercase tracking-[0.24em] text-crimson">Tribute</p>
        <h1 className="font-display text-3xl uppercase leading-none text-bone">Card claims</h1>
        <p className="mt-1 max-w-2xl text-[11px] leading-5 text-bone/35">
          Verify a claim only against a real provider reference. Names and emails are PII — keep
          screenshots out of shared channels.
        </p>
      </div>

      <AdminFlash ok={searchParams.ok} error={searchParams.error} />

      <div className="flex flex-col gap-3 border border-white/10 bg-[#0d0d0d] p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-1 overflow-x-auto">
          <Link
            href={q ? `/admin/claims?q=${encodeURIComponent(q)}` : "/admin/claims"}
            className={`shrink-0 border px-3 py-2 text-[8px] font-bold uppercase tracking-[0.14em] transition-colors ${
              !status
                ? "border-crimson bg-crimson text-ink"
                : "border-white/15 text-bone/50 hover:text-bone"
            }`}
          >
            All <span className="ml-1 opacity-60">{total}</span>
          </Link>
          {STATUSES.map((item) => (
            <Link
              key={item}
              href={`/admin/claims?status=${item}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`shrink-0 border px-3 py-2 text-[8px] font-bold uppercase tracking-[0.14em] transition-colors ${
                status === item
                  ? "border-crimson bg-crimson text-ink"
                  : "border-white/15 text-bone/50 hover:text-bone"
              }`}
            >
              {CLAIM_STATUS_LABELS[item] ?? item}
              <span className="ml-1 opacity-60">{counts[item] ?? 0}</span>
            </Link>
          ))}
        </div>

        <form method="GET" action="/admin/claims" className="flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <label className="relative flex-1 lg:w-56">
            <span className="sr-only">Search claims</span>
            <Search
              size={13}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-bone/25"
              aria-hidden="true"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="Reference, name, email, last 4"
              className="w-full border border-white/12 bg-ink py-2 pl-8 pr-3 text-[11px] text-bone placeholder:text-bone/25 focus:border-crimson"
            />
          </label>
          <button
            type="submit"
            className="border border-white/15 px-3 text-[8px] font-bold uppercase tracking-[0.14em] text-bone/55 hover:border-crimson hover:text-crimson"
          >
            Search
          </button>
        </form>
      </div>

      <AdminPanel>
        {claims.length === 0 ? (
          <AdminEmpty>
            No claims match this view. {q && "Try a different search or clear the filter."}
          </AdminEmpty>
        ) : (
          <AdminTableShell>
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 text-[8px] uppercase tracking-[0.16em] text-bone/30">
                  <th className="px-4 py-3 font-semibold">Claim</th>
                  <th className="px-4 py-3 font-semibold">Attendee</th>
                  <th className="px-4 py-3 font-semibold">Purchase</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <p className="font-mono text-[10px] text-bone/75">{claim.publicRef}</p>
                      {claim.card && (
                        <p className="mt-0.5 font-mono text-[8px] text-bone/25">
                          {claim.card.cardNumber}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[11px] text-bone/80">{claim.displayName}</p>
                      <p className="mt-0.5 text-[9px] text-bone/30">{claim.emailMasked}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-[10px] text-bone/55">
                        {claim.ticketRefLast4 ? `•••• ${claim.ticketRefLast4}` : "—"}
                      </p>
                      <p className="mt-0.5 text-[8px] uppercase tracking-[0.12em] text-bone/25">
                        {claim.verificationId ? "Linked to verification" : "No verification linked"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-[9px] uppercase tracking-[0.12em] text-bone/40">
                      {claim.source.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={claim.status} />
                    </td>
                    <td className="px-4 py-3 text-[9px] tabular-nums text-bone/35">
                      {claim.createdAt.toLocaleDateString("en-GB")}
                      <br />
                      {claim.createdAt.toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/claims/${claim.id}`}
                        className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.14em] text-bone/45 hover:text-crimson"
                      >
                        {canReview ? "Review" : "View"} <ArrowUpRight size={10} aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTableShell>
        )}
      </AdminPanel>

      <p className="text-[9px] leading-4 text-bone/25">
        Showing up to 100 claims. Public references are intentionally short; full ticket references
        are never rendered in this console.
      </p>
    </div>
  );
}
