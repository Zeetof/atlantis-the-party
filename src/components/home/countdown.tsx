"use client";

import { useEffect, useState } from "react";
import { computeCountdown, pad, type CountdownState } from "@/lib/countdown";
import { cn } from "@/lib/utils";

type CountdownProps = {
  startISO: string;
  endISO: string;
  timezone: string;
  dateLabel: string;
  venue: string;
};

const UNITS = ["Days", "Hours", "Minutes", "Seconds"] as const;

export function Countdown({ startISO, endISO, timezone, dateLabel, venue }: CountdownProps) {
  const [state, setState] = useState<CountdownState | null>(null);

  useEffect(() => {
    const start = new Date(startISO);
    const end = new Date(endISO);
    const tick = () => setState(computeCountdown(new Date(), start, end));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [startISO, endISO]);

  const values = state
    ? [pad(state.days, 2), pad(state.hours), pad(state.minutes), pad(state.seconds)]
    : ["--", "--", "--", "--"];

  return (
    <section
      className="relative overflow-hidden border-y border-white/10 bg-[#0b0b0b]"
      aria-labelledby="countdown-heading"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[60rem] w-[60rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(229,57,53,0.2) 0%, rgba(229,57,53,0.04) 40%, transparent 70%)",
        }}
      />
      <div className="shell relative z-10 py-16 sm:py-20 lg:py-24">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">T-minus Detty December</p>
            <h2
              id="countdown-heading"
              className="mt-4 font-display text-[clamp(2rem,4vw,3.4rem)] uppercase leading-none tracking-[0.01em]"
            >
              {state?.status === "live"
                ? "The doors are open"
                : state?.status === "ended"
                  ? "That's a wrap"
                  : "The countdown is on"}
            </h2>
          </div>
          <div className="text-left md:text-right">
            <p className="font-display text-lg uppercase tracking-[0.12em] text-bone">{dateLabel}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-bone/40">
              {timezone.replace("_", " ")} · {venue}
            </p>
          </div>
        </div>

        {state?.status === "ended" ? (
          <div className="mt-10 border border-white/10 bg-ink/60 p-8 sm:p-12">
            <p className="font-display text-4xl uppercase leading-none text-chrome sm:text-6xl">
              Atlantis 4.0 has wrapped.
            </p>
            <p className="mt-4 max-w-xl text-sm leading-7 text-bone/60">
              Thank you to everyone who came through for Detty December. Relive the archive while we
              prepare the next chapter.
            </p>
          </div>
        ) : state?.status === "live" ? (
          <div className="mt-10 border border-crimson/40 bg-crimson/10 p-8 sm:p-12">
            <p className="font-display text-4xl uppercase leading-none text-crimson sm:text-6xl">
              Atlantis 4.0 is live.
            </p>
            <p className="mt-4 max-w-xl text-sm leading-7 text-bone/70">
              Doors are open at Watercress Event Center until 11PM. Have your ticket ready at the
              gate.
            </p>
          </div>
        ) : (
          <div
            role="timer"
            aria-live="off"
            className="mt-10 grid grid-cols-4 gap-2 sm:gap-4 lg:gap-6"
          >
            {values.map((value, index) => (
              <div
                key={UNITS[index]}
                className={cn(
                  "relative border border-white/10 bg-black/40 px-2 py-6 text-center sm:px-4 sm:py-8",
                  index === 3 && "border-crimson/30",
                )}
              >
                <span
                  className="absolute inset-x-0 top-0 h-[2px] bg-crimson"
                  aria-hidden="true"
                  style={{ opacity: index === 3 ? 1 : 0.25 }}
                />
                <span
                  className={cn(
                    "block font-display text-[clamp(2.2rem,7vw,5.5rem)] leading-none tabular-nums",
                    index === 3 ? "text-crimson" : "text-chrome",
                  )}
                >
                  {value}
                </span>
                <span className="mt-3 block text-[8px] font-semibold uppercase tracking-[0.24em] text-bone/40 sm:text-[10px]">
                  {UNITS[index]}
                </span>
              </div>
            ))}
          </div>
        )}

        <p className="mt-6 text-[10px] uppercase tracking-[0.2em] text-bone/30">
          {state?.status === "upcoming"
            ? "Live countdown to 1PM WAT, December 30, 2026"
            : state?.status === "live"
              ? "Event in progress"
              : "Event status updates automatically after the event"}
        </p>
      </div>
    </section>
  );
}
