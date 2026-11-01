import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CalendarPlus,
  Clock3,
  MapPin,
  ShieldCheck,
  Sparkles,
  Ticket,
} from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { TicketCategories } from "@/components/tickets/ticket-categories";
import { TicketLink, ActionLink } from "@/components/ui/buttons";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { TributeArtwork } from "@/components/tribute/artwork";
import { prisma } from "@/server/db";
import { CONTACT, EVENT_TIMEZONE, SOURCE_NOTE, TICKET_PARTNER, TICKET_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Atlantis 4.0 — Event Details",
  description:
    "Atlantis The Party 4.0 — Detty December. December 30, 2026, 1–11 PM at Watercress Event Center, Allen, Ikeja, Lagos. Official tickets via Popout Tickets.",
  alternates: { canonical: "/event" },
};

export const dynamic = "force-dynamic";

const calendarUrl =
  "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  "&text=ATLANTIS+THE+PARTY+4.0+%E2%80%94+DETTY+DECEMBER" +
  "&dates=20261230T120000Z/20261230T220000Z" +
  "&details=Atlantis+4.0+Detty+December.+Official+tickets+via+Popout+Tickets." +
  "&location=Watercress+Event+Center%2C+Allen%2C+Ikeja%2C+Lagos";

export default async function EventPage() {
  const [event, confirmedPerformers, pendingPerformers] = await Promise.all([
    prisma.event.findUnique({
      where: { slug: "atlantis-4" },
      include: { ticketCategories: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.performer.findMany({
      where: { edition: { slug: "atlantis-4" }, status: "CONFIRMED" },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.performer.count({
      where: { edition: { slug: "atlantis-4" }, status: "PENDING" },
    }),
  ]);

  if (!event) {
    return (
      <div className="section-pad shell">
        <h1 className="font-display text-4xl uppercase">Event details coming soon.</h1>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${event.title} — ${event.editionLabel}`,
    startDate: event.eventDate.toISOString(),
    endDate: new Date(event.eventDate.getTime() + 10 * 3600 * 1000).toISOString(),
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
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHero
        eyebrow="Atlantis 4.0 · The main event"
        title={
          <>
            Detty
            <br />
            December
          </>
        }
        accent="December 30, 2026"
        description="The fourth Atlantis closes the year at Watercress Event Center. A day-to-night room from 1PM to 11PM, with official tickets handled by Popout Tickets."
        image={{
          src: "/media/images/atlantis-4-flyer.webp",
          alt: "Atlantis 4.0 Detty December official flyer",
          priority: true,
        }}
        meta={[
          { label: "Date", value: "Wednesday, December 30, 2026" },
          { label: "Time", value: "1PM — 11PM WAT" },
          { label: "Venue", value: event.venueName },
          { label: "Status", value: event.status.replace("_", " ").toLowerCase() },
        ]}
      >
        <TicketLink size="lg">Get tickets</TicketLink>
        <ActionLink href="/tickets" variant="outline" size="lg">
          Ticket information
        </ActionLink>
      </PageHero>

      <section className="section-pad">
        <div className="shell grid gap-14 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <SectionHeading
              eyebrow="The details"
              title={
                <>
                  Everything you
                  <br />
                  need to know
                </>
              }
              accent="from the official flyer"
              description={event.description}
            />

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: CalendarDays,
                  label: "Date",
                  value: "Wednesday, December 30, 2026",
                  note: "Date supplied by the organizer",
                },
                {
                  icon: Clock3,
                  label: "Time",
                  value: "1:00 PM — 11:00 PM",
                  note: "West Africa Time (WAT)",
                },
                {
                  icon: MapPin,
                  label: "Venue",
                  value: event.venueName,
                  note: `${event.venueAddress} · open in maps`,
                  href: CONTACT.maps,
                },
                {
                  icon: Ticket,
                  label: "Tickets",
                  value: `${TICKET_PARTNER}`,
                  note: "Online and at gate · official external checkout",
                  href: TICKET_URL,
                },
              ].map((item) => {
                const content = (
                  <>
                    <item.icon size={17} className="text-crimson" aria-hidden="true" />
                    <p className="mt-5 text-[8px] font-semibold uppercase tracking-[0.22em] text-bone/35">
                      {item.label}
                    </p>
                    <p className="mt-1.5 text-sm font-semibold text-bone">{item.value}</p>
                    <p className="mt-2 flex items-center gap-1 text-[10px] leading-4 text-bone/35">
                      {item.note}
                      {item.href && (
                        <ArrowUpRight size={10} aria-hidden="true" className="shrink-0" />
                      )}
                    </p>
                  </>
                );
                return item.href ? (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group border border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-white/20"
                  >
                    {content}
                  </a>
                ) : (
                  <div
                    key={item.label}
                    className="group border border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-white/20"
                  >
                    {content}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href={calendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-white/15 px-4 py-3 text-[9px] font-bold uppercase tracking-[0.18em] text-bone/65 transition-colors hover:border-crimson hover:text-crimson"
              >
                <CalendarPlus size={14} aria-hidden="true" /> Add to calendar
              </a>
              <a
                href={CONTACT.maps}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-white/15 px-4 py-3 text-[9px] font-bold uppercase tracking-[0.18em] text-bone/65 transition-colors hover:border-crimson hover:text-crimson"
              >
                <MapPin size={14} aria-hidden="true" /> Venue map
              </a>
            </div>

            <div className="mt-8 border-l-2 border-crimson bg-crimson/[0.04] p-5">
              <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-crimson">
                <ShieldCheck size={14} aria-hidden="true" />
                {event.detailsVerified ? "Organizer-confirmed details" : "Pending final confirmation"}
              </p>
              <p className="mt-2 max-w-xl text-[11px] leading-5 text-bone/50">
                {event.detailsVerified
                  ? "The organizer has confirmed the event details in the admin dashboard."
                  : "Venue, time and pricing are transcribed from the supplied flyer and are awaiting final organizer confirmation. Confirm at official checkout."}
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-5">
            <div className="sticky top-28 border border-white/10 bg-[#0d0d0d] p-6 sm:p-8">
              <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-bone/35">
                The essentials
              </p>
              <p className="mt-4 font-display text-4xl uppercase leading-none text-chrome">Dec 30</p>
              <p className="mt-2 font-editorial text-2xl italic text-crimson">2026</p>
              <div className="mt-6 space-y-3 border-t border-white/10 pt-6 text-sm text-bone/70">
                <p className="flex gap-3">
                  <MapPin size={15} className="mt-1 shrink-0 text-bone/30" aria-hidden="true" />
                  {event.venueName}, {event.venueAddress}
                </p>
                <p className="flex gap-3">
                  <Clock3 size={15} className="mt-1 shrink-0 text-bone/30" aria-hidden="true" />
                  1:00 PM — 11:00 PM WAT
                </p>
                <p className="flex gap-3">
                  <Ticket size={15} className="mt-1 shrink-0 text-bone/30" aria-hidden="true" />
                  Online & at gate via {TICKET_PARTNER}
                </p>
              </div>
              <div className="mt-7 space-y-3">
                <TicketLink size="md" className="w-full">
                  Get tickets
                </TicketLink>
                <Link
                  href="/claim"
                  className="flex w-full items-center justify-between border border-white/15 px-4 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-bone/70 transition-colors hover:border-crimson hover:text-crimson"
                >
                  Claim your 999 card <ArrowUpRight size={13} aria-hidden="true" />
                </Link>
              </div>
              <p className="mt-4 text-[9px] leading-4 text-bone/30">
                Purchase completes on Popout Tickets. This site never collects payment details.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section-pad border-y border-white/10 bg-[#0a0a0a]">
        <div className="shell">
          <Reveal>
            <SectionHeading
              eyebrow="Tickets"
              title="Choose your way in"
              accent="online or at the gate"
              description="Prices below are transcribed from the official flyer. Confirm the current price and availability on Popout Tickets before you buy."
            />
          </Reveal>
          <Reveal delay={0.08} className="mt-10">
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
          </Reveal>
          <p className="mt-6 text-[10px] leading-5 text-bone/30">{SOURCE_NOTE}</p>
        </div>
      </section>

      <section className="section-pad">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:items-center">
          <Reveal className="lg:col-span-7">
            <SectionHeading
              eyebrow="Lineup 4.0"
              title={
                confirmedPerformers.length > 0 ? (
                  "Confirmed for 4.0"
                ) : (
                  <>
                    Lineup reveal
                    <br />
                    coming soon
                  </>
                )
              }
              accent={confirmedPerformers.length > 0 ? "confirmed by the organizer" : "no names invented"}
              description={
                confirmedPerformers.length > 0
                  ? "Only performers confirmed in the organizer dashboard appear below."
                  : "Atlantis 4.0 performers have not been published yet. The Atlantis 2.0 lineup is kept separately in the archive and is not a current lineup."
              }
            />
            <div className="mt-8 flex flex-wrap gap-2">
              {confirmedPerformers.length > 0 ? (
                confirmedPerformers.map((performer) => (
                  <span key={performer.id} className="chip">
                    {performer.name}
                  </span>
                ))
              ) : (
                <>
                  <span className="chip chip-red">Artists · TBA</span>
                  <span className="chip">DJs · TBA</span>
                  <span className="chip">Hypemen · TBA</span>
                  {pendingPerformers > 0 && (
                    <span className="chip">{pendingPerformers} pending confirmation</span>
                  )}
                </>
              )}
            </div>
            <div className="mt-8">
              <ActionLink href="/lineup" variant="outline">
                Lineup & archive
              </ActionLink>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-5">
            <div className="relative border border-crimson/20 bg-gradient-to-br from-crimson/[0.08] to-transparent p-7">
              <Sparkles size={18} className="text-crimson" aria-hidden="true" />
              <p className="mt-5 font-display text-2xl uppercase leading-tight text-bone">
                A 999 remembrance experience
              </p>
              <p className="mt-3 text-xs leading-6 text-bone/50">
                Verified Atlantis 4.0 ticket holders can claim a personal tribute card, assigned an
                official Juice WRLD song from the organizer-approved list.
              </p>
              <Link href="/999-experience" className="link-arrow mt-6 text-crimson">
                The 999 experience <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-6 flex items-center gap-4">
              <TributeArtwork compact className="w-28 shrink-0" />
              <p className="text-[10px] leading-5 text-bone/30">
                Original abstract artwork. No album art, lyrics or recordings are hosted.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-white/10 py-12">
        <div className="shell flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="max-w-2xl text-[11px] leading-5 text-bone/35">
            Questions about entry, tickets or claiming your 999 card? Read the FAQ or contact the
            organizer directly.
          </p>
          <div className="flex gap-4">
            <Link href="/faq" className="link-arrow text-bone/70">
              FAQ <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
            <Link href="/contact" className="link-arrow text-bone/70">
              Contact <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
