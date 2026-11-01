import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ScrollText, ShieldAlert } from "lucide-react";
import {
  AdminEmpty,
  AdminFlash,
  AdminPanel,
  AdminTableShell,
} from "@/components/admin/ui";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Audit log" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 40;

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: { ok?: string; error?: string; page?: string; q?: string };
}) {
  const session = await requireAdmin();

  if (session.role !== "OWNER") {
    return (
      <div className="space-y-5">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.24em] text-crimson">Security</p>
          <h1 className="mt-2 font-display text-3xl uppercase leading-none text-bone">Audit log</h1>
        </div>
        <AdminPanel title="Owner access only">
          <div className="flex items-start gap-2 p-5 text-[11px] leading-5 text-bone/40">
            <ShieldAlert size={14} className="mt-0.5 shrink-0 text-crimson/70" aria-hidden="true" />
            The audit log records every administrator action and is restricted to OWNER accounts.
            Your role ({session.role}) does not include audit visibility.
          </div>
        </AdminPanel>
      </div>
    );
  }

  const q = (searchParams.q ?? "").trim();
  const requestedPage = Number.parseInt(searchParams.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const where = q
    ? {
        OR: [
          { action: { contains: q } },
          { entity: { contains: q } },
          { actorEmail: { contains: q } },
          { entityId: { contains: q } },
        ],
      }
    : {};

  const [total, entries] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const buildHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    return query ? `/admin/audit?${query}` : "/admin/audit";
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[8px] font-bold uppercase tracking-[0.24em] text-crimson">Security</p>
        <h1 className="mt-2 font-display text-3xl uppercase leading-none text-bone">Audit log</h1>
        <p className="mt-2 max-w-2xl text-[11px] leading-5 text-bone/35">
          Append-only record of administrator actions. Ticket references and email addresses are
          stored only as hashes, masks or the last four characters.
        </p>
      </div>

      <AdminFlash ok={searchParams.ok} error={searchParams.error} />

      <form action="/admin/audit" className="flex flex-wrap items-end gap-3">
        <label className="min-w-[240px] flex-1">
          <span className="block text-[8px] font-semibold uppercase tracking-[0.18em] text-bone/35">
            Search action, entity, actor or ID
          </span>
          <input
            name="q"
            defaultValue={q}
            placeholder="e.g. CARD_ISSUED or CardClaim"
            className="mt-1.5 w-full border border-white/12 bg-ink px-3 py-2.5 text-[12px] text-bone placeholder:text-bone/20 focus:border-crimson"
          />
        </label>
        <button
          type="submit"
          className="bg-bone px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-white"
        >
          Search
        </button>
        {q && (
          <Link href="/admin/audit" className="text-[9px] uppercase tracking-[0.14em] text-bone/40 hover:text-crimson">
            Clear
          </Link>
        )}
      </form>

      <AdminPanel
        title="Entries"
        description={`${total} record${total === 1 ? "" : "s"}${q ? ` matching “${q}”` : ""}.`}
        actions={
          <span className="flex items-center gap-1.5 text-[8px] uppercase tracking-[0.14em] text-bone/25">
            <ScrollText size={11} aria-hidden="true" /> Page {page} of {totalPages}
          </span>
        }
      >
        {entries.length === 0 ? (
          <AdminEmpty>No audit entries match this view.</AdminEmpty>
        ) : (
          <AdminTableShell>
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 text-[8px] uppercase tracking-[0.16em] text-bone/30">
                  <th className="px-4 py-3 font-semibold">When</th>
                  <th className="px-4 py-3 font-semibold">Actor</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Entity</th>
                  <th className="px-4 py-3 font-semibold">Metadata</th>
                  <th className="px-4 py-3 font-semibold">IP hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-white/[0.02]">
                    <td className="whitespace-nowrap px-4 py-3 align-top text-[9px] tabular-nums text-bone/40">
                      {entry.createdAt.toLocaleString("en-GB", { timeZone: "Africa/Lagos" })}
                    </td>
                    <td className="px-4 py-3 align-top text-[9px] text-bone/55">
                      {entry.actorEmail}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={cn(
                          "font-mono text-[9px]",
                          /FAIL|REJECT|DELET/.test(entry.action)
                            ? "text-crimson/80"
                            : /ISSUE|VERIF|CREATE|UPLOAD/.test(entry.action)
                              ? "text-emerald-300/70"
                              : "text-bone/65",
                        )}
                      >
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-[9px] text-bone/45">
                      {entry.entity}
                      {entry.entityId && (
                        <p className="mt-0.5 max-w-[200px] truncate font-mono text-[8px] text-bone/25">
                          {entry.entityId}
                        </p>
                      )}
                    </td>
                    <td className="max-w-[280px] px-4 py-3 align-top">
                      {entry.metadata ? (
                        <code
                          title={entry.metadata}
                          className="block max-h-12 overflow-hidden break-all font-mono text-[8px] leading-4 text-bone/30"
                        >
                          {entry.metadata}
                        </code>
                      ) : (
                        <span className="text-[8px] text-bone/20">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top font-mono text-[8px] text-bone/25">
                      {entry.ipHash ? `${entry.ipHash.slice(0, 12)}…` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTableShell>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
          {page > 1 ? (
            <Link href={buildHref(page - 1)} className="link-arrow text-bone/45">
              <ArrowLeft size={11} aria-hidden="true" /> Newer
            </Link>
          ) : (
            <span className="text-[8px] uppercase tracking-[0.14em] text-bone/15">Newest</span>
          )}
          {page < totalPages ? (
            <Link href={buildHref(page + 1)} className="link-arrow text-bone/45">
              Older <ArrowRight size={11} aria-hidden="true" />
            </Link>
          ) : (
            <span className="text-[8px] uppercase tracking-[0.14em] text-bone/15">End</span>
          )}
        </div>
      </AdminPanel>

      <AdminPanel title="What is recorded">
        <ul className="grid gap-2 p-5 text-[9px] leading-4 text-bone/30 sm:grid-cols-2">
          <li>Sign-in successes, failures and sign-outs.</li>
          <li>Claim verification and rejection decisions.</li>
          <li>Card issuance, link rotation and email retries.</li>
          <li>Event, ticket, lineup, media and song changes.</li>
          <li>Uploads and media approval or hiding.</li>
          <li>IP addresses are stored only as an HMAC hash.</li>
        </ul>
      </AdminPanel>
    </div>
  );
}
