import { cn } from "@/lib/utils";

const ITEMS = [
  "December 30, 2026",
  "Detty December",
  "Watercress Event Center",
  "Allen · Ikeja · Lagos",
  "1PM — 11PM",
  "999",
];

export function Marquee({ className }: { className?: string }) {
  const row = (
    <div className="flex shrink-0 items-center gap-8 pr-8">
      {ITEMS.map((item) => (
        <span key={item} className="flex items-center gap-8 whitespace-nowrap">
          <span>{item}</span>
          <span aria-hidden="true" className="text-[0.55em] text-ink/60">
            ◆
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden border-y border-black/20 bg-crimson py-3.5 text-ink",
        className,
      )}
      aria-label="Event highlights: December 30, 2026, Detty December, Watercress Event Center, Allen Ikeja Lagos, 1PM to 11PM"
    >
      <div className="flex w-max animate-marquee font-display text-sm uppercase tracking-[0.18em] motion-reduce:animate-none sm:text-base">
        {row}
        <div aria-hidden="true" className="contents">
          {row}
        </div>
      </div>
    </div>
  );
}
