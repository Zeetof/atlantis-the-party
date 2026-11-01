import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Clock3, MapPin, Sparkles } from "lucide-react";
import { Hero } from "@/components/home/hero";
import { Marquee } from "@/components/site/marquee";
import { Countdown } from "@/components/home/countdown";
import { EditionTimeline } from "@/components/home/edition-timeline";
import { TributeArtwork } from "@/components/tribute/artwork";
import { TicketCategories } from "@/components/tickets/ticket-categories";
import { ActionLink, TicketLink } from "@/components/ui/buttons";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { prisma } from "@/server/db";
import { formatEventDate } from "@/lib/utils";
import {
  DISCLAIMER,
  EVENT_DATE_LABEL,
  EVENT_TIMEZONE,
  SOURCE_NOTE,
  TICKET_PARTNER,
  TICKET_URL,
  VENUE,
} from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [event, editions, collage, confirmedPerformers] = await Promise.all([
    prisma.event.findUnique({
      where: { slug: "atlantis-4" },
      include: { ticketCategories: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.edition.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.media.findMany({
      where: { edition: { slug: "atlantis-3" }, status: "APPROVED", type: "IMAGE" },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.performer.findMany({
      where: { edition: { slug: "atlantis-4" }, status: "CONFIRMED" },
      orderBy: { sortOrder: "asc" },
      take: 6,
    }),
  ]);

  if (!event) {
    return (
      <div className="section-pad shell">
        <h1 className="font-display text-4xl uppercase">Atlantis is being prepared.</h1>
        <p className="mt-4 text-bone/60">The event configuration is not available yet.</p>
      </div>
    );
  }

  const startISO = event.eventDate.toISOString();
  const endISO = new Date(event.eventDate.getTime() + 10 * 60 * 60 * 1000).toISOString();
  const picks = [collage[0], collage[3], collage[7]].filter(Boolean);

  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${event.title} — ${event.editionLabel}`,
    startDate: startISO,
    endDate: endISO,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.venueName,
      address: {
        "@type": "PostalAddress",
        streetAddress: "Allen",
        addressLocality: "Ikeja",
        addressRegion: "Lagos",
        addressCountry: "NG",
      },
    },
    image: ["/media/images/atlantis-4-flyer.webp"],
    description: event.description,
    organizer: { "@type": "Organization", name: "WESTHAN.ENT" },
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />
      <Hero />
      <Marquee />

      <section id="experience" className="section-pad relative overflow-hidden">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 top-16 hidden select-none font-display text-[18rem] uppercase leading-none text-white/[0.02] lg:block"
        >
          04
        </span>
        <div className="shell grid gap-14 lg:grid-cols-12 lg:items-center lg:gap-10">
          <Reveal className="lg:col-span-5">
            <SectionHeading
              eyebrow="The Atlantis experience"
              title={
                <>
                  A room built
                  <br />
                  for the moment
                </>
              }
              accent="Four editions deep"
              description="Atlantis is a Lagos party built around music, culture and the people in the room. Every edition carries its own energy — this one closes the year."
            />
            <div className="mt-9 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
              {[
                ["04", "Editions"],
                ["01", "City"],
                ["999", "Remembrance"],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="font-display text-3xl leading-none text-chrome">{value}</p>
                  <p className="mt-2 text-[8px] font-semibold uppercase tracking-[0.22em] text-bone/35">
                    {label}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-9">
              <ActionLink href="/history" variant="outline">
                Explore the history
              </ActionLink>
            </div>
          </Reveal>

          <Reveal delay={0.12} className="lg:col-span-7">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {picks[0] && (
                <div className="relative col-span-2 aspect-[16/10] overflow-hidden border border-white/10 bg-charcoal">
                  <Image
                    src={picks[0].src!}
                    alt={picks[0].caption}
                    fill
                    sizes="(min-width: 1024px) 55vw, 100vw"
                    className="object-cover object-[50%_38%]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <p className="absolute bottom-4 left-4 text-[9px] uppercase tracking-[0.18em] text-bone/60">
                    From Atlantis 3.0 · The room
                  </p>
                </div>
              )}
              {picks.slice(1).map((media, index) => (
                <div
                  key={media!.id}
                  className="relative aspect-[4/5] overflow-hidden border border-white/10 bg-charcoal"
                >
                  <Image
                    src={media!.src!}
                    alt={media!.caption}
                    fill
                    sizes="(min-width: 1024px) 27vw, 50vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <p className="absolute bottom-3 left-3 text-[8px] uppercase tracking-[0.16em] text-bone/55">
                    {index === 0 ? "Hands up" : "Detty energy"}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border border-white/10 px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.16em] text-bone/35">
                Atlantis 3.0 archive · Organizer-supplied footage
              </p>
              <Link
                href="/history/atlantis-3"
                className="link-arrow text-bone/70 hover:text-crimson"
              >
                Watch <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <Countdown
        startISO={startISO}
        endISO={endISO}
        timezone={EVENT_TIMEZONE}
        dateLabel={EVENT_DATE_LABEL}
        venue={`${event.venueName}, Ikeja`}
      />

      <section id="atlantis-4" className="section-pad relative overflow-hidden border-t border-white/10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 h-[30rem] w-[30rem] rounded-full bg-crimson/[0.06] blur-3xl"
        />
        <div className="shell">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-start lg:gap-14">
            <Reveal className="lg:col-span-6">
              <SectionHeading
                eyebrow="Atlantis 4.0"
                title={
                  <>
                    Detty December,
                    <br />
                    the main event
                  </>
                }
                accent="December 30, 2026"
                description="One final room for the year. The 4.0 flyer confirms the date, the venue and the return of the 999 remembrance experience."
              />

              <dl className="mt-10 divide-y divide-white/10 border-y border-white/10">
                {[
                  { icon: CalendarDays, label: "Date", value: "Wednesday, December 30, 2026" },
                  { icon: Clock3, label: "Time", value: "1:00 PM — 11:00 PM WAT" },
                  { icon: MapPin, label: "Venue", value: `${event.venueName}, ${event.venueAddress}` },
                  { icon: Sparkles, label: "Tickets", value: `${TICKET_PARTNER} · online & at gate` },
                ].map((row) => (
                  <div key={row.label} className="flex items-start gap-4 py-4">
                    <row.icon size={16} className="mt-0.5 shrink-0 text-crimson" aria-hidden="true" />
                    <dt className="w-20 shrink-0 text-[9px] font-semibold uppercase tracking-[0.2em] text-bone/35">
                      {row.label}
                    </dt>
                    <dd className="text-sm leading-6 text-bone/80">{row.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <TicketLink size="lg" variant="primary" className="w-full sm:w-auto">
                  Secure your spot
                </TicketLink>
                <ActionLink href="/event" variant="outline" size="lg" className="w-full sm:w-auto">
                  Event details
                </ActionLink>
              </div>
              <p className="mt-4 text-[10px] leading-5 text-bone/30">{SOURCE_NOTE}</p>
              {!event.detailsVerified && (
                <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-amber-200/70">
                  Provisional — awaiting final organizer confirmation
                </p>
              )}
            </Reveal>

            <Reveal delay={0.1} className="lg:col-span-6">
              <div className="relative mx-auto max-w-[460px] lg:mr-0">
                <div
                  aria-hidden="true"
                  className="absolute -left-3 -top-3 right-8 bottom-8 border border-white/10"
                />
                <div className="relative aspect-[4/5] overflow-hidden border border-white/15">
                  <Image
                    src="/media/images/atlantis-4-flyer.webp"
                    alt="Atlantis 4.0 flyer with ticket prices, venue and the Juice WRLD seven-year remembrance mark"
                    fill
                    sizes="(min-width: 1024px) 460px, 90vw"
                    className="object-cover object-top"
                  />
                  <span className="absolute right-4 top-4 bg-ink/70 px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.18em] text-bone/70 backdrop-blur">
                    Official artwork
                  </span>
                </div>
                <div className="mt-4 flex items-start justify-between gap-6 border-t border-white/10 pt-4">
                  <p className="max-w-[16rem] text-[10px] leading-5 text-bone/35">
                    Venue and pricing are transcribed from the flyer. Final confirmation is recorded
                    in the organizer dashboard.
                  </p>
                  <span className="chip chip-red shrink-0">Dec 30 / 26</span>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal className="mt-16">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <h3 className="font-display text-2xl uppercase tracking-[0.02em] text-bone">
                Ticket categories
              </h3>
              <Link href="/tickets" className="link-arrow text-bone/55">
                Ticket information <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-6">
              <TicketCategories
                categories={event.ticketCategories.map((category) => ({
                  id: category.id,
                  name: category.name,
                  priceNaira: category.priceNaira,
                  channel: category.channel,
                  note: category.note,
                  verified: category.verified,
                }))}
              />
            </div>
          </Reveal>

          <Reveal className="mt-10">
            <div className="flex flex-col gap-5 border border-white/10 bg-white/[0.02] p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-crimson">
                  4.0 lineup
                </p>
                <p className="mt-2 font-display text-xl uppercase text-bone">
                  {confirmedPerformers.length > 0
                    ? confirmedPerformers.map((performer) => performer.name).join(" · ")
                    : "Lineup reveal coming soon"}
                </p>
                <p className="mt-2 max-w-2xl text-[11px] leading-5 text-bone/40">
                  Only confirmed 4.0 performers appear here. The Atlantis 2.0 lineup is preserved as
                  history and is not a current lineup.
                </p>
              </div>
              <ActionLink href="/lineup" variant="outline" size="sm" className="shrink-0">
                View lineup
              </ActionLink>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="archive" className="section-pad border-y border-white/10 bg-[#0a0a0a]">
        <div className="shell">
          <Reveal>
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <SectionHeading
                eyebrow="The archive"
                title={
                  <>
                    Four chapters,
                    <br />
                    one Atlantis
                  </>
                }
                accent="1.0 to 4.0"
                description="Each edition keeps its own flyer, its own date and its own story. Nothing is reassigned."
              />
              <ActionLink href="/history" variant="outline" size="sm" className="shrink-0">
                Full history
              </ActionLink>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="mt-12">
            <EditionTimeline
              editions={editions.map((edition) => ({
                slug: edition.slug,
                name: edition.name,
                label: edition.label,
                dateDisplay: edition.dateDisplay,
                dateStatus: edition.dateStatus,
                coverImage: edition.coverImage,
              }))}
            />
          </Reveal>
          <p className="mt-8 flex max-w-3xl items-start gap-2 text-[10px] leading-5 text-bone/30">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 bg-crimson" aria-hidden="true" />
            Atlantis 3.0 is dated August 19 by the organizer, while the supplied flyer reads AUG 18.
            The discrepancy is flagged for administrator review. Earlier edition years are not
            stated on the supplied artwork.
          </p>
        </div>
      </section>

      <section id="999" className="section-pad relative overflow-hidden">
        <div className="shell grid items-center gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
          <Reveal className="order-2 lg:order-1">
            <div className="relative mx-auto max-w-[500px]">
              <div
                aria-hidden="true"
                className="absolute -inset-6 border border-crimson/15"
              />
              <TributeArtwork className="rotate-[-1.2deg] shadow-card" />
              <div className="absolute -bottom-5 -right-4 bg-crimson px-4 py-2 font-display text-sm uppercase tracking-[0.16em] text-ink">
                7 years · 999
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="order-1 lg:order-2">
            <p className="eyebrow">The 999 experience</p>
            <h2 className="mt-6 font-display text-[clamp(3.6rem,9vw,7.2rem)] uppercase leading-[0.8] tracking-[-0.01em]">
              <span className="text-chrome">999</span>
            </h2>
            <p className="mt-2 font-editorial text-[clamp(2.2rem,5vw,3.8rem)] italic leading-none text-crimson">
              Forever in the music
            </p>
            <p className="mt-7 max-w-xl text-sm leading-7 text-bone/60 sm:text-[15px]">
              Seven years since Juice WRLD's passing in December 2019. Atlantis 4.0 carries a
              remembrance experience for verified ticket holders — a personal, original digital
              card assigned an official song, made to be kept.
            </p>

            <ol className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                ["01", "Buy an official ticket", "Secure your spot through Popout Tickets."],
                ["02", "Submit your claim", "Match your purchase email and order reference."],
                ["03", "Get verified", "The organizer verifies and issues your card."],
                ["04", "Keep your 999", "Download, share and revisit your card link."],
              ].map(([index, title, copy]) => (
                <li key={index} className="border-l border-white/10 pl-4">
                  <span className="font-display text-[10px] tracking-[0.2em] text-crimson">{index}</span>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-bone/80">
                    {title}
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-bone/40">{copy}</p>
                </li>
              ))}
            </ol>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ActionLink href="/999-experience" variant="light" size="lg" className="w-full sm:w-auto">
                Discover the 999 experience
              </ActionLink>
              <ActionLink href="/claim" variant="outline" size="lg" className="w-full sm:w-auto">
                Claim your card
              </ActionLink>
            </div>
            <p className="mt-5 max-w-xl text-[10px] leading-5 text-bone/30">
              Original artwork, no album art or lyrics. For verified Atlantis 4.0 ticket holders,
              one card per ticket. This tribute is independent of Juice WRLD's estate.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden bg-bone text-ink">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -bottom-10 select-none text-center font-display text-[26vw] uppercase leading-none text-ink/[0.05]"
        >
          Atlantis
        </span>
        <div className="shell relative z-10 py-20 sm:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <p className="inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.28em] text-ink/45">
              <span className="h-px w-8 bg-crimson" aria-hidden="true" />
              Official ticketing
              <span className="h-px w-8 bg-crimson" aria-hidden="true" />
            </p>
            <h2 className="mt-7 font-display text-[clamp(3.4rem,9vw,7.5rem)] uppercase leading-[0.86] tracking-[-0.01em] text-ink">
              Secure
              <br />
              your spot
            </h2>
            <p className="mx-auto mt-6 max-w-xl font-editorial text-2xl italic text-ink/70 sm:text-3xl">
              Detty December closes with Atlantis.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <TicketLink size="lg" className="w-full sm:w-auto">
                Get tickets
              </TicketLink>
              <ActionLink href="/tickets" variant="outline" size="lg" className="w-full border-ink/20 text-ink hover:border-crimson sm:w-auto">
                Ticket information
              </ActionLink>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/45">
              <span>Dec 30, 2026</span>
              <span className="h-1 w-1 bg-crimson" aria-hidden="true" />
              <span>{VENUE}</span>
              <span className="h-1 w-1 bg-crimson" aria-hidden="true" />
              <span>1 — 11 PM</span>
            </div>
            <p className="mt-5 text-[10px] text-ink/40">
              Purchases complete on {TICKET_PARTNER}. An external checkout indicator is shown on the
              ticket page.{" "}
              <a href={TICKET_URL} target="_blank" rel="noopener noreferrer" className="underline">
                Official event page
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      <div className="shell py-8">
        <p className="text-[10px] leading-5 text-bone/25">{DISCLAIMER}</p>
        <p className="mt-1 text-[10px] leading-5 text-bone/25">
          Event date displayed as {formatEventDate(event.eventDate)} · {EVENT_TIMEZONE}.
        </p>
      </div>
    </>
  );
}
