import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Info } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { ActionLink } from "@/components/ui/buttons";
import { Reveal } from "@/components/ui/reveal";
import { prisma } from "@/server/db";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "History",
  description:
    "The Atlantis archive: 1.0, 2.0 and 3.0, plus the upcoming 4.0. Original flyers, dates and media kept with their correct editions.",
  alternates: { canonical: "/history" },
};

export const dynamic = "force-dynamic";

function statusText(status: string) {
  if (status === "FLAGGED") return "Date under review";
  if (status === "YEAR_TO_CONFIRM") return "Year to be confirmed";
  return "Confirmed";
}

export default async function HistoryPage() {
  const editions = await prisma.edition.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <>
      <PageHero
        eyebrow="The archive"
        title="Our history"
        accent="four editions, one city"
        description="Every Atlantis edition keeps its own flyer, its own date and its own room. This is the record — preserved, not rewritten."
        meta={[
          { label: "Editions", value: "1.0 — 4.0" },
          { label: "Home", value: "Lagos, Nigeria" },
          { label: "Next", value: "4.0 · December 30, 2026" },
        ]}
      >
        <ActionLink href="#chapter-1" variant="outline" size="lg">
          Start at 1.0
        </ActionLink>
        <ActionLink href="/gallery" size="lg" variant="light">
          Open the gallery
        </ActionLink>
      </PageHero>

      <section className="section-pad">
        <div className="shell space-y-16 sm:space-y-24">
          {editions.map((edition, index) => {
            const upcoming = edition.slug === "atlantis-4";
            const href = upcoming ? "/event" : `/history/${edition.slug}`;
            return (
              <Reveal key={edition.slug}>
                <article
                  id={`chapter-${edition.number}`}
                  className={cn(
                    "grid items-center gap-8 lg:grid-cols-12 lg:gap-14",
                    index % 2 === 1 && "lg:[&>*:first-child]:order-2",
                  )}
                >
                  <div className="lg:col-span-5">
                    <Link href={href} className="group relative block">
                      <span
                        aria-hidden="true"
                        className="absolute -left-2 -top-6 z-10 font-display text-6xl leading-none text-outline opacity-50 sm:text-7xl"
                      >
                        {String(edition.number).padStart(2, "0")}
                      </span>
                      <div
                        className={cn(
                          "relative aspect-[4/5] overflow-hidden border bg-charcoal",
                          upcoming ? "border-crimson/40" : "border-white/12",
                        )}
                      >
                        {edition.coverImage && (
                          <Image
                            src={edition.coverImage}
                            alt={`${edition.name} official flyer`}
                            fill
                            sizes="(min-width: 1024px) 42vw, 90vw"
                            className="object-cover object-top transition-transform duration-700 ease-luxe group-hover:scale-[1.03]"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5">
                          <p className="font-display text-2xl uppercase tracking-wide text-bone">
                            {edition.name}
                          </p>
                          <span
                            className={cn(
                              "px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.16em]",
                              upcoming ? "bg-crimson text-ink" : "bg-black/60 text-bone/65 backdrop-blur",
                            )}
                          >
                            {upcoming ? "Next" : "Archive"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>

                  <div className="lg:col-span-7">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="eyebrow">{edition.label}</span>
                      <span
                        className={cn(
                          "border px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.14em]",
                          edition.dateStatus === "FLAGGED"
                            ? "border-crimson/40 text-crimson"
                            : "border-white/15 text-bone/40",
                        )}
                      >
                        {statusText(edition.dateStatus)}
                      </span>
                    </div>
                    <h2 className="mt-5 font-display text-[clamp(2.6rem,5vw,4.6rem)] uppercase leading-[0.88] text-bone">
                      {edition.name}
                    </h2>
                    <p className="mt-3 font-editorial text-3xl italic text-crimson">
                      {edition.dateDisplay}
                    </p>
                    <p className="mt-5 max-w-xl text-sm leading-7 text-bone/55">{edition.description}</p>
                    {edition.note && (
                      <p className="mt-4 flex max-w-xl items-start gap-2 text-[10px] leading-5 text-bone/35">
                        <Info
                          size={12}
                          className={cn(
                            "mt-0.5 shrink-0",
                            edition.dateStatus === "FLAGGED" ? "text-crimson" : "text-bone/30",
                          )}
                          aria-hidden="true"
                        />
                        {edition.note}
                      </p>
                    )}
                    <div className="mt-7">
                      <Link href={href} className="link-arrow text-bone/75">
                        {upcoming ? "Event details" : `Enter ${edition.name}`}
                        <ArrowUpRight size={14} aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0a0a0a] py-10">
        <div className="shell flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-crimson">
            <Info size={14} aria-hidden="true" /> Archive notes
          </div>
          <p className="max-w-4xl text-[11px] leading-6 text-bone/40">
            Atlantis 3.0 is dated August 19 by the organizer while its supplied flyer reads AUG 18.
            The conflict is flagged for administrator review. The years of earlier editions are not
            printed on the supplied artwork and have not been assumed. Media is assigned strictly by
            the organizer-supplied folder structure.
          </p>
        </div>
      </section>
    </>
  );
}
