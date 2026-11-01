import { Music2 } from "lucide-react";
import { TributeArtwork } from "@/components/tribute/artwork";
import { cn } from "@/lib/utils";

export type TributeCardViewProps = {
  displayName: string;
  cardNumber: string;
  songTitle?: string;
  songUrl?: string;
  linkStatus?: string;
  sample?: boolean;
  className?: string;
};

export function TributeCardView({
  displayName,
  cardNumber,
  songTitle,
  songUrl,
  linkStatus,
  sample = false,
  className,
}: TributeCardViewProps) {
  return (
    <div
      className={cn(
        "relative isolate flex aspect-[4/5] w-full flex-col overflow-hidden border border-white/20 bg-ink text-bone",
        "shadow-[0_40px_90px_-40px_rgba(0,0,0,0.95)]",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-[7px] z-10 border border-white/10"
      />
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 z-20 h-8 w-8 border-l-2 border-t-2 border-crimson"
      />
      <span
        aria-hidden="true"
        className="absolute bottom-0 right-0 z-20 h-8 w-8 border-b-2 border-r-2 border-crimson"
      />

      <div className="relative z-20 flex items-center justify-between gap-3 px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
        <div>
          <p className="text-[7px] font-semibold uppercase tracking-[0.34em] text-bone/45">
            Westhan.Ent presents
          </p>
          <p className="mt-1 font-display text-[clamp(1.3rem,4.4vw,1.75rem)] uppercase leading-none tracking-[0.02em]">
            Atlantis
          </p>
        </div>
        <div className="text-right">
          <p className="text-[7px] font-semibold uppercase tracking-[0.28em] text-crimson">
            The party
          </p>
          <p className="mt-1 text-[8px] uppercase tracking-[0.2em] text-bone/40">
            4.0 · Detty December
          </p>
        </div>
      </div>

      <div className="relative z-20 mx-5 min-h-0 flex-1 overflow-hidden border border-white/12 sm:mx-6">
        <TributeArtwork compact className="h-full w-full border-0" />

        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/45 to-transparent px-4 pb-4 pt-14 sm:px-5">
          <p className="text-[7px] font-semibold uppercase tracking-[0.3em] text-crimson">
            Assigned to
          </p>
          <p className="mt-1.5 break-words font-display text-[clamp(1.5rem,5.6vw,2.3rem)] uppercase leading-[0.94]">
            {displayName}
          </p>
        </div>

        {sample && (
          <span className="absolute right-3 top-3 z-30 border border-white/30 bg-black/60 px-2 py-1 text-[7px] font-bold uppercase tracking-[0.22em] text-bone/70 backdrop-blur">
            Sample
          </span>
        )}
      </div>

      <div className="relative z-20 px-5 pb-5 pt-3 sm:px-6 sm:pb-6">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[7px] font-semibold uppercase tracking-[0.28em] text-bone/35">
              Card number
            </p>
            <p className="mt-1 truncate font-mono text-[10px] tracking-[0.1em] text-bone/80 sm:text-[11px]">
              {cardNumber}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[7px] font-semibold uppercase tracking-[0.24em] text-bone/35">
              Dec 30
            </p>
            <p className="mt-1 font-display text-base leading-none text-bone/80">2026</p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
          <Music2 size={12} className="shrink-0 text-crimson" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-bone/70">
              {songTitle ?? "Song assigned on issuance"}
            </p>
            <p className="mt-0.5 text-[7px] uppercase tracking-[0.18em] text-bone/30">
              {songUrl
                ? linkStatus === "VERIFIED"
                  ? "Official stream"
                  : "Search the official platform"
                : "Approved tribute selection"}
            </p>
          </div>
          <p className="shrink-0 text-[7px] uppercase tracking-[0.22em] text-bone/25">
            Forever
          </p>
        </div>
      </div>
    </div>
  );
}
