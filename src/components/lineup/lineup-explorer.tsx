"use client";

import { useMemo, useState } from "react";
import { PerformerCard, type PerformerView } from "@/components/lineup/performer-card";
import { CATEGORY_LABELS, cn } from "@/lib/utils";

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "ARTIST", label: "Artists" },
  { key: "DJ", label: "DJs" },
  { key: "HYPEMAN", label: "Hypemen" },
  { key: "GUEST", label: "Guests" },
] as const;

export function LineupExplorer({
  performers,
  historic = false,
}: {
  performers: PerformerView[];
  historic?: boolean;
}) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("ALL");

  const counts = useMemo(() => {
    return performers.reduce<Record<string, number>>((acc, performer) => {
      acc[performer.category] = (acc[performer.category] ?? 0) + 1;
      acc.ALL = (acc.ALL ?? 0) + 1;
      return acc;
    }, {});
  }, [performers]);

  const visible = filter === "ALL" ? performers : performers.filter((p) => p.category === filter);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter performers by category">
        {FILTERS.filter((item) => (counts[item.key] ?? 0) > 0).map((item) => {
          const active = filter === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              aria-pressed={active}
              className={cn(
                "border px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] transition-colors",
                active
                  ? "border-crimson bg-crimson text-ink"
                  : "border-white/15 text-bone/55 hover:border-white/35 hover:text-bone",
              )}
            >
              {item.label}
              <span className={cn("ml-2 text-[9px]", active ? "text-ink/60" : "text-bone/30")}>
                {counts[item.key] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-5 text-[10px] uppercase tracking-[0.2em] text-bone/30">
        Showing {visible.length} {visible.length === 1 ? "name" : "names"}
        {filter !== "ALL" ? ` · ${CATEGORY_LABELS[filter]}` : ""}
        {historic ? " · Historic Atlantis 2.0 archive" : ""}
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
        {visible.map((performer, index) => (
          <PerformerCard key={performer.id} performer={performer} index={index} historic={historic} />
        ))}
      </div>

      {visible.length === 0 && (
        <p className="mt-10 border border-white/10 p-8 text-sm text-bone/55">
          No performers in this category yet.
        </p>
      )}
    </div>
  );
}
