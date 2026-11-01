import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AdminEmpty, AdminPanel, AdminTableShell, StatusPill } from "@/components/admin/ui";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";

export const metadata: Metadata = { title: "Cards" };
export const dynamic = "force-dynamic";

export default async function AdminCardsPage() {
  await requireAdmin();

  const [cards, counts] = await Promise.all([
    prisma.tributeCard.findMany({
      orderBy: { issuedAt: "desc" },
      take: 100,
      include: {
        claim: { select: { displayName: true, emailMasked: true, publicRef: true } },
        song: true,
        emailDeliveries: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    prisma.emailDelivery.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const emailCounts: Record<string, number> = Object.fromEntries(
    counts.map((group) => [group.status, group._count._all]),
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <p className="text-[8px] font-bold uppercase tracking-[0.24em] text-crimson">Tribute</p>
        <h1 className="font-display text-3xl uppercase leading-none text-bone">Issued cards</h1>
        <p className="mt-1 max-w-2xl text-[11px] leading-5 text-bone/35">
          Private links, rotation and email retry live on each card panel. Never post a card link in
          a public or group channel.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Cards issued", cards.length],
          ["Emails sent", emailCounts.SENT ?? 0],
          ["Email issues", (emailCounts.FAILED ?? 0) + (emailCounts.SKIPPED ?? 0)],
        ].map(([label, value]) => (
          <div key={label} className="border border-white/10 bg-[#0d0d0d] px-4 py-3">
            <p className="text-[8px] uppercase tracking-[0.18em] text-bone/30">{label}</p>
            <p className="mt-1 font-display text-2xl text-bone">{value}</p>
          </div>
        ))}
      </div>

      <AdminPanel title="Cards" description="Most recent 100 issuances.">
        {cards.length === 0 ? (
          <AdminEmpty>No cards have been issued yet. Issue one from a verified claim.</AdminEmpty>
        ) : (
          <AdminTableShell>
            <table className="w-full min-w-[880px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 text-[8px] uppercase tracking-[0.16em] text-bone/30">
                  <th className="px-4 py-3 font-semibold">Card</th>
                  <th className="px-4 py-3 font-semibold">Holder</th>
                  <th className="px-4 py-3 font-semibold">Song</th>
                  <th className="px-4 py-3 font-semibold">Issued</th>
                  <th className="px-4 py-3 font-semibold">Downloads</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 text-right font-semibold">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {cards.map((card) => (
                  <tr key={card.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <p className="font-mono text-[10px] text-bone/75">{card.cardNumber}</p>
                      <p className="mt-0.5 font-mono text-[8px] text-bone/25">{card.claim.publicRef}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[11px] text-bone/80">{card.claim.displayName}</p>
                      <p className="mt-0.5 text-[9px] text-bone/30">{card.claim.emailMasked}</p>
                    </td>
                    <td className="px-4 py-3 text-[10px] text-bone/55">{card.song.title}</td>
                    <td className="px-4 py-3 text-[9px] tabular-nums text-bone/40">
                      {card.issuedAt.toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-4 py-3 text-[10px] tabular-nums text-bone/55">
                      {card.downloads}
                      <span className="ml-2 text-[8px] text-bone/25">
                        exp {card.tokenExpiresAt.toLocaleDateString("en-GB")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={card.emailDeliveries[0]?.status ?? "PENDING"} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/cards/${card.id}`}
                        className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.14em] text-bone/45 hover:text-crimson"
                      >
                        Panel <ArrowUpRight size={10} aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTableShell>
        )}
      </AdminPanel>
    </div>
  );
}
