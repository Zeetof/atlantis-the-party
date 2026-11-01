import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type EditionSummary = {
  slug: string;
  name: string;
  label: string;
  dateDisplay: string;
  dateStatus: string;
  coverImage: string | null;
};

function statusLabel(status: string) {
  if (status === "FLAGGED") return "Date under review";
  if (status === "YEAR_TO_CONFIRM") return "Year to be confirmed";
  return "Confirmed";
}

export function EditionTimeline({ editions }: { editions: EditionSummary[] }) {
  return (
    <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-4">
      {editions.map((edition, index) => {
        const upcoming = edition.slug === "atlantis-4";
        const href = upcoming ? "/event" : `/history/${edition.slug}`;
        return (
          <Link
            key={edition.slug}
            href={href}
            className="group relative w-[78vw] max-w-[330px] shrink-0 snap-start sm:w-auto sm:max-w-none"
          >
            <div
              className={cn(
                "relative aspect-[4/5] overflow-hidden border bg-charcoal",
                upcoming ? "border-crimson/50" : "border-white/10",
              )}
            >
              {edition.coverImage ? (
                <Image
                  src={edition.coverImage}
                  alt={`${edition.name} flyer`}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 78vw"
                  className="object-cover object-top transition-transform duration-700 ease-luxe group-hover:scale-[1.04]"
                />
              ) : (
                <div className="absolute inset-0 bg-charcoal" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
              <span className="absolute left-4 top-4 font-display text-sm tracking-[0.18em] text-bone/60">
                {String(edition.slug.slice(-1)).padStart(2, "0")}
              </span>
              {upcoming && (
                <span className="absolute right-4 top-4 bg-crimson px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.2em] text-ink">
                  Next
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-[8px] font-semibold uppercase tracking-[0.24em] text-bone/50">
                  {edition.label}
                </p>
                <h3 className="mt-1 font-display text-2xl uppercase leading-none tracking-wide text-bone">
                  {edition.name}
                </h3>
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/15 pt-3">
                  <span className="text-[9px] uppercase tracking-[0.16em] text-bone/65">
                    {edition.dateDisplay}
                  </span>
                  <ArrowUpRight
                    size={14}
                    aria-hidden="true"
                    className="text-bone/50 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-crimson"
                  />
                </div>
                <span
                  className={cn(
                    "mt-2 inline-block text-[8px] uppercase tracking-[0.14em]",
                    edition.dateStatus === "FLAGGED" ? "text-crimson/80" : "text-bone/30",
                  )}
                >
                  {statusLabel(edition.dateStatus)}
                </span>
              </div>
            </div>
            <span
              aria-hidden="true"
              className="absolute -bottom-1 left-0 h-px w-0 bg-crimson transition-all duration-500 group-hover:w-full"
            />
          </Link>
        );
      })}
    </div>
  );
}
