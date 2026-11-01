import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ExternalLink, Lock, ShieldCheck, Ticket } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { TicketCategories } from "@/components/tickets/ticket-categories";
import { ActionLink, TicketLink } from "@/components/ui/buttons";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { prisma } from "@/server/db";
import { TICKET_PARTNER, TICKET_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tickets",
  description:
    "Official Atlantis The Party 4.0 tickets via Popout Tickets. December 30, 2026 at Watercress Event Center, Allen, Ikeja, Lagos.",
  alternates: { canonical: "/tickets" },
};

export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  const event = await prisma.event.findUnique({
    where: { slug: "atlantis-4" },
    include: { ticketCategories: { orderBy: { sortOrder: "asc" } } },
  });

  return (
    <>
      <PageHero
        eyebrow="Official ticketing"
        title="Tickets"
        accent="One official checkout"
        description="Every purchase on this site sends you to the official Popout Tickets event page. There is no payment form on this website, and no ticket is sold directly here."
        image={{
          src: "/media/images/atlantis-4-flyer.webp",
          alt: "Atlantis 4.0 flyer showing online and gate ticket categories",
        }}
        meta={[
          { label: "Date", value: "December 30, 2026" },
          { label: "Venue", value: "Watercress Event Center, Ikeja" },
          { label: "Official partner", value: TICKET_PARTNER },
        ]}
      >
        <TicketLink size="lg">Buy on Popout Tickets</TicketLink>
        <ActionLink href="/faq" variant="outline" size="lg">
          Ticket FAQ
        </ActionLink>
      </PageHero>

      <section className="section-pad">
        <div className="shell grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <SectionHeading
              eyebrow="The official route"
              title="Buy direct. Verify later."
              accent="No screenshots as proof"
              description="Tickets are issued by Popout Tickets. When you buy, keep the confirmation email and order reference — the same details are used for the 999 card claim review."
            />

            <div className="mt-9 border border-crimson/30 bg-gradient-to-br from-crimson/[0.08] to-transparent p-6 sm:p-8">
              <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-crimson">
                <ExternalLink size={14} aria-hidden="true" /> External checkout
              </div>
              <p className="mt-3 break-all font-display text-xl uppercase leading-tight text-bone sm:text-2xl">
                popouttickets.com/events/atpdettydecember
              </p>
              <p className="mt-3 text-[11px] leading-5 text-bone/45">
                You will leave this website and complete your purchase on {TICKET_PARTNER}. The
                event page linked here is the official checkout.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <TicketLink size="lg" className="w-full sm:w-auto">
                  Continue to Popout Tickets
                </TicketLink>
                <span className="text-[9px] uppercase tracking-[0.16em] text-bone/30">
                  Opens in a new tab
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="border border-white/10 p-5">
                <Lock size={16} className="text-crimson" aria-hidden="true" />
                <p className="mt-4 text-sm font-semibold text-bone">Nothing is charged here</p>
                <p className="mt-2 text-[11px] leading-5 text-bone/40">
                  This site does not collect card numbers, bank details or payment information.
                </p>
              </div>
              <div className="border border-white/10 p-5">
                <ShieldCheck size={16} className="text-crimson" aria-hidden="true" />
                <p className="mt-4 text-sm font-semibold text-bone">Official link only</p>
                <p className="mt-2 text-[11px] leading-5 text-bone/40">
                  Purchase only through the official event page. Do not treat old flyer QR codes as
                  the current checkout.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-5">
            <div className="sticky top-28 border border-white/10 bg-[#0d0d0d] p-6 sm:p-8">
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-bone/35">
                Official event
              </p>
              <p className="mt-4 font-display text-3xl uppercase leading-none text-chrome">
                Atlantis 4.0
              </p>
              <p className="mt-2 font-editorial text-2xl italic text-crimson">Detty December</p>
              <div className="mt-6 space-y-3 border-y border-white/10 py-5 text-xs text-bone/60">
                <p className="flex justify-between gap-4">
                  <span className="text-bone/30">Date</span> Dec 30, 2026
                </p>
                <p className="flex justify-between gap-4">
                  <span className="text-bone/30">Time</span> 1PM — 11PM
                </p>
                <p className="flex justify-between gap-4">
                  <span className="text-bone/30">Venue</span> Watercress, Ikeja
                </p>
                <p className="flex justify-between gap-4">
                  <span className="text-bone/30">Provider</span> Popout Tickets
                </p>
              </div>
              <p className="mt-5 border-l-2 border-crimson pl-3 text-[9px] leading-4 text-bone/40">
                {event?.detailsVerified
                  ? "Organizer-confirmed details."
                  : "Date, time and venue are provisional until the organizer confirms them in the admin dashboard."}
              </p>
              <TicketLink size="md" className="mt-6 w-full">
                <Ticket size={15} aria-hidden="true" /> Official tickets
              </TicketLink>
              <p className="mt-4 text-[9px] leading-4 text-bone/30">
                After purchase, submit your claim for the 999 tribute card. Eligibility is verified
                by the organizer before a card is issued.
              </p>
              <Link href="/claim" className="link-arrow mt-4 text-bone/65">
                Start a card claim <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section-pad border-y border-white/10 bg-[#0a0a0a]">
        <div className="shell">
          <Reveal>
            <SectionHeading
              eyebrow="Pricing"
              title="Regular & VIP"
              accent="as printed on the flyer"
              description="Online and gate categories are shown for information. Prices have not yet been marked as verified in the admin dashboard; confirm the current price on the official checkout."
            />
          </Reveal>
          <Reveal delay={0.08} className="mt-10">
            {event ? (
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
            ) : (
              <p className="text-sm text-bone/50">Ticket categories are being updated.</p>
            )}
          </Reveal>
        </div>
      </section>

      <section className="section-pad">
        <div className="shell">
          <Reveal>
            <SectionHeading
              eyebrow="After purchase"
              title="From ticket to 999 card"
              accent="claimed in four steps"
              description="Ticket verification protects the tribute experience. No card is issued from a screenshot or an unverified reference alone."
            />
          </Reveal>
          <div className="mt-10 grid gap-px border border-white/10 bg-white/10 md:grid-cols-4">
            {[
              ["01", "Buy officially", "Complete checkout on Popout Tickets and keep your order reference."],
              ["02", "Submit a claim", "Use the purchase email and order reference on the claim page."],
              ["03", "Organizer review", "A signed provider record or manual review confirms eligibility."],
              ["04", "Card issued", "Your personal card is issued and a private link is emailed to you."],
            ].map(([index, title, copy]) => (
              <div key={index} className="bg-ink p-6">
                <span className="font-display text-xs tracking-[0.2em] text-crimson">{index}</span>
                <p className="mt-4 font-display text-xl uppercase leading-none text-bone">{title}</p>
                <p className="mt-3 text-[11px] leading-5 text-bone/40">{copy}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-[10px] leading-5 text-bone/30">
              Provider API access has not been supplied. Until a signed purchase webhook or API is
              configured, claims are held in the organizer's manual review queue. Email delivery
              shows a setup status if the provider is not configured.
            </p>
            <Link href="/claim" className="link-arrow shrink-0 text-crimson">
              Claim page <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 py-14">
        <div className="shell text-center">
          <p className="font-editorial text-3xl italic text-bone/70">Ready when you are.</p>
          <div className="mt-6 flex justify-center">
            <TicketLink size="lg">Secure your spot</TicketLink>
          </div>
          <p className="mt-5 text-[9px] uppercase tracking-[0.18em] text-bone/25">
            Official event URL: {TICKET_URL}
          </p>
        </div>
      </section>
    </>
  );
}
