"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { ActionLink, TicketLink } from "@/components/ui/buttons";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const } },
};

export function Hero() {
  const reduceMotion = useReducedMotion();
  const animate = reduceMotion ? undefined : "show";

  return (
    <section
      className="grain relative isolate flex min-h-[100svh] flex-col justify-center overflow-hidden pb-16 pt-28 sm:pt-32 lg:pb-24 lg:pt-36"
      aria-labelledby="hero-title"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute -left-[10%] top-[8%] h-[46rem] w-[46rem] rounded-full opacity-60 blur-[110px]"
          style={{
            background:
              "radial-gradient(circle, rgba(229,57,53,0.2) 0%, rgba(229,57,53,0.03) 45%, transparent 70%)",
          }}
        />
        <div className="absolute inset-y-0 left-[6%] hidden w-px bg-white/[0.05] lg:block" />
        <div className="absolute inset-y-0 right-[8%] hidden w-px bg-white/[0.05] lg:block" />
        <span className="absolute -right-6 top-[14%] hidden select-none font-display text-[23vw] leading-none text-white/[0.025] lg:block">
          04
        </span>
      </div>

      <div className="shell relative z-10 grid items-center gap-14 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10">
        <motion.div variants={container} initial={reduceMotion ? false : "hidden"} animate={animate}>
          <motion.div variants={item} className="flex items-center gap-4">
            <span className="h-px w-10 bg-crimson" aria-hidden="true" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-bone/60">
              Westhan.ent presents
            </p>
            <span className="border border-crimson/40 bg-crimson/10 px-2 py-1 text-[9px] font-bold tracking-[0.18em] text-crimson">
              4.0
            </span>
          </motion.div>

          <motion.h1
            variants={item}
            id="hero-title"
            className="mt-7 font-display uppercase leading-[0.78] tracking-[-0.015em]"
          >
            <span className="block text-chrome text-[clamp(4rem,16.5vw,11.6rem)] drop-shadow-[0_18px_40px_rgba(0,0,0,0.55)]">
              Atlantis
            </span>
            <span className="mt-3 flex items-center gap-4 sm:gap-6">
              <span className="h-px flex-1 bg-bone/20" aria-hidden="true" />
              <span className="text-[clamp(0.72rem,1.5vw,1.1rem)] font-normal tracking-[0.4em] text-bone/75">
                The Party
              </span>
              <span className="h-px flex-1 bg-bone/20" aria-hidden="true" />
            </span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-4 font-editorial text-[clamp(2.2rem,5vw,3.6rem)] italic leading-none text-crimson"
          >
            Detty December
          </motion.p>

          <motion.p variants={item} className="mt-6 max-w-xl text-sm leading-7 text-bone/62 sm:text-[15px]">
            The fourth chapter closes the year in Lagos. One room, full energy, and a night built to
            be remembered.
          </motion.p>

          <motion.dl variants={item} className="mt-8 grid max-w-xl grid-cols-3 gap-4 border-y border-white/10 py-5">
            <div>
              <dt className="text-[8px] font-semibold uppercase tracking-[0.24em] text-bone/35">Date</dt>
              <dd className="mt-1.5 font-display text-base uppercase tracking-wide sm:text-lg">Dec 30, 2026</dd>
            </div>
            <div className="border-l border-white/10 pl-4">
              <dt className="text-[8px] font-semibold uppercase tracking-[0.24em] text-bone/35">Venue</dt>
              <dd className="mt-1.5 font-display text-base uppercase tracking-wide sm:text-lg">Ikeja, Lagos</dd>
            </div>
            <div className="border-l border-white/10 pl-4">
              <dt className="text-[8px] font-semibold uppercase tracking-[0.24em] text-bone/35">Time</dt>
              <dd className="mt-1.5 font-display text-base uppercase tracking-wide sm:text-lg">1 — 11 PM</dd>
            </div>
          </motion.dl>

          <motion.div variants={item} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <TicketLink size="lg" className="w-full sm:w-auto">
              Get tickets
            </TicketLink>
            <ActionLink href="#experience" size="lg" variant="outline" className="w-full sm:w-auto">
              Explore Atlantis
            </ActionLink>
          </motion.div>

          <motion.p variants={item} className="mt-4 text-[10px] uppercase tracking-[0.16em] text-bone/30">
            Official ticketing via Popout Tickets · secure external checkout
          </motion.p>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 40, rotate: 1.5 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 1.1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-[340px] sm:max-w-[420px] lg:ml-auto lg:max-w-[480px]"
        >
          <div
            aria-hidden="true"
            className="absolute -bottom-3 -right-3 left-8 top-8 border border-crimson/45"
          />
          <div className="relative aspect-[4/5] overflow-hidden border border-white/15 bg-charcoal shadow-card">
            <Image
              src="/media/images/atlantis-4-flyer.webp"
              alt="Official Atlantis 4.0 Detty December flyer: December 30, 1–11PM, Watercress Event Center, Allen, Ikeja"
              fill
              priority
              sizes="(min-width: 1024px) 480px, (min-width: 640px) 420px, 340px"
              className="object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
              <div className="border-l-2 border-crimson pl-3">
                <p className="text-[8px] font-semibold uppercase tracking-[0.24em] text-bone/60">
                  The official flyer
                </p>
                <p className="font-display text-lg uppercase leading-none tracking-wide text-bone">
                  Atlantis 4.0
                </p>
              </div>
              <span className="chip chip-red">Dec 30</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[9px] uppercase tracking-[0.2em] text-bone/35">
            <span>Detty December</span>
            <span>Lagos · NG</span>
          </div>
        </motion.div>
      </div>

      <a
        href="#experience"
        className="shell absolute inset-x-0 bottom-6 hidden items-center gap-3 text-[9px] uppercase tracking-[0.24em] text-bone/35 transition-colors hover:text-bone lg:flex"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15">
          <ArrowDown size={13} aria-hidden="true" />
        </span>
        Scroll to explore
      </a>
    </section>
  );
}
