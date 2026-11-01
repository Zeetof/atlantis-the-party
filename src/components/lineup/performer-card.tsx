import Image from "next/image";
import { ArrowUpRight, BadgeCheck, Clock3 } from "lucide-react";
import { CATEGORY_SINGULAR, cn, initials } from "@/lib/utils";

export type PerformerView = {
  id: string;
  name: string;
  category: string;
  imagePath: string | null;
  bio: string | null;
  socials: string | null;
  status: string;
  featured: boolean;
};

export function PerformerCard({
  performer,
  index,
  historic = false,
}: {
  performer: PerformerView;
  index: number;
  historic?: boolean;
}) {
  const isConfirmed = performer.status === "CONFIRMED";
  const isPending = performer.status === "PENDING";

  return (
    <article className="group relative">
      <div className="relative aspect-[3/4] overflow-hidden border border-white/10 bg-[#0f0f0f]">
        {performer.imagePath ? (
          <Image
            src={performer.imagePath}
            alt={`${performer.name} — ${CATEGORY_SINGULAR[performer.category] ?? "performer"}`}
            fill
            sizes="(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 50vw"
            className="object-cover object-center grayscale-[35%] transition-all duration-700 ease-luxe group-hover:scale-[1.03] group-hover:grayscale-0"
          />
        ) : (
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 50% 30%, rgba(229,57,53,0.16), transparent 60%), linear-gradient(160deg, #181818, #0a0a0a)",
              }}
            />
            <span
              className="absolute inset-0 flex items-center justify-center font-display text-[8rem] uppercase leading-none text-outline opacity-70 transition-transform duration-700 group-hover:scale-105"
              aria-hidden="true"
            >
              {initials(performer.name)}
            </span>
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />
          </div>
        )}

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <span className="bg-black/55 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.18em] text-bone/70 backdrop-blur">
            {CATEGORY_SINGULAR[performer.category] ?? "Performer"}
          </span>
          {isConfirmed && (
            <span className="inline-flex items-center gap-1 bg-crimson px-2 py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-ink">
              <BadgeCheck size={10} aria-hidden="true" /> Confirmed
            </span>
          )}
          {isPending && (
            <span className="inline-flex items-center gap-1 bg-bone/10 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.14em] text-bone/60 backdrop-blur">
              <Clock3 size={10} aria-hidden="true" /> Pending
            </span>
          )}
          {historic && (
            <span className="border border-white/20 bg-black/40 px-2 py-1 text-[8px] uppercase tracking-[0.14em] text-bone/50 backdrop-blur">
              Archive
            </span>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <span className="font-display text-[10px] tracking-[0.2em] text-crimson/70">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="mt-1 font-display text-[clamp(1.35rem,2.2vw,2rem)] uppercase leading-none tracking-[0.02em] text-bone">
            {performer.name}
          </h3>
          {performer.bio && (
            <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-bone/55">{performer.bio}</p>
          )}
          {performer.socials && (
            <a
              href={performer.socials}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-bone/55 transition-colors hover:text-crimson"
            >
              Profile <ArrowUpRight size={11} aria-hidden="true" />
            </a>
          )}
        </div>
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-crimson transition-transform duration-500 group-hover:scale-x-100",
          )}
        />
      </div>
    </article>
  );
}
