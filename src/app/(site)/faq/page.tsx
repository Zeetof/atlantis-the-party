import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Info } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { ActionLink, TicketLink } from "@/components/ui/buttons";
import { Reveal } from "@/components/ui/reveal";
import {
  CONTACT,
  EVENT_DATE_LABEL,
  EVENT_TIME,
  TICKET_PARTNER,
  TICKET_URL,
  VENUE,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Atlantis 4.0 frequently asked questions — tickets, venue, lineup, the 999 tribute card, verification and archive details.",
  alternates: { canonical: "/faq" },
};

const GROUPS = [
  {
    title: "Tickets and entry",
    items: [
      {
        q: "Where do I buy tickets?",
        a: `All ticket purchases complete on ${TICKET_PARTNER} at popouttickets.com/events/atpdettydecember. Every purchase button on this site opens that official event page in a new tab. This website does not process payments or create a second checkout.`,
      },
      {
        q: "Are the ticket prices on this site final?",
        a: "The online and gate prices shown are transcribed from the official Atlantis 4.0 flyer. Prices are marked unverified in the organizer dashboard and should be confirmed on the official checkout page before paying. Historic edition prices are archive information only.",
      },
      {
        q: "Can I buy a ticket at the gate?",
        a: "The flyer lists gate prices as well as online prices. Gate availability is controlled by the organizer and the venue; buying online through the official link is the most reliable option.",
      },
      {
        q: "Do I need to bring anything to the door?",
        a: "Bring your official ticket confirmation from Popout Tickets and a valid ID if requested. The organizer may verify the name on the purchase at entry. Never share your full order reference publicly.",
      },
      {
        q: "Is there a dress code?",
        a: "No dress code has been published by the organizer. Dress for a December night in Lagos and follow any final guidance shared on the official channels.",
      },
    ],
  },
  {
    title: "The event",
    items: [
      {
        q: "When and where is Atlantis 4.0?",
        a: `Atlantis 4.0 — Detty December is dated ${EVENT_DATE_LABEL}, running ${EVENT_TIME}, at ${VENUE}. These details are transcribed from the official flyer and are recorded for final confirmation in the organizer dashboard.`,
      },
      {
        q: "Who is performing at Atlantis 4.0?",
        a: "The 4.0 lineup has not been announced. Only confirmed performers will be published on the lineup page. The Atlantis 2.0 lineup supplied with the archive belongs to the second edition only and is never presented as a 4.0 lineup.",
      },
      {
        q: "Is Atlantis a water or pool party?",
        a: "No. Atlantis is the name of the party series; it is not water-themed. The design uses black, bone, chrome and crimson — not aquatic imagery.",
      },
      {
        q: "Is there an age restriction?",
        a: "The organizer has not published an age policy in the supplied materials. Check the official ticket page and ask the organizer before purchasing if age is a concern.",
      },
    ],
  },
  {
    title: "The 999 experience",
    items: [
      {
        q: "What is the 999 experience?",
        a: "999 is an independent remembrance space at Atlantis 4.0 marking seven years since Juice WRLD's passing in December 2019. Verified ticket holders can claim a personal digital card with an original design and one approved song. It is not affiliated with or endorsed by the artist's estate.",
      },
      {
        q: "How do I claim a card?",
        a: "Buy an official ticket, then submit the purchase email and ticket or order reference on the claim page. If the purchase matches a verified record, the claim is marked verified; otherwise it enters the organizer's manual review queue. No card is issued from a screenshot alone.",
      },
      {
        q: "How many cards can I get?",
        a: "One card per verified ticket. Duplicate claims for the same ticket or the same email are blocked. Each card has a unique card number and a private access link.",
      },
      {
        q: "Does the card include Juice WRLD artwork, lyrics or music?",
        a: "No. The card uses original Atlantis artwork. It contains no album art, lyrics, recordings or artist likeness. The assigned song is linked through an official streaming platform rather than hosted here.",
      },
      {
        q: "How long does review take?",
        a: "Automatic matches can be verified immediately after the provider feed is connected. Manual review depends on the organizer. A claim never becomes verified solely because a screenshot was submitted.",
      },
      {
        q: "What happens if my card link expires?",
        a: "Private card links are time-limited. The organizer can rotate the link from the dashboard, which invalidates the old one and creates a new private link for the ticket holder.",
      },
      {
        q: "What data do you store for the claim?",
        a: "The display name, an encrypted purchase email, an encrypted ticket reference, a hashed lookup value and rate-limit data. Full references are never displayed publicly and card data is never collected. See the privacy notice for details.",
      },
    ],
  },
  {
    title: "The archive",
    items: [
      {
        q: "Why does Atlantis 3.0 show a date under review?",
        a: "The organizer dates Atlantis 3.0 August 19, while the supplied flyer reads AUG 18. Both records are preserved and the conflict is flagged for administrator review. No date has been silently chosen.",
      },
      {
        q: "Why are the years of earlier editions missing?",
        a: "The supplied Atlantis 1.0 and 2.0 flyers do not print a year. The month and day are transcribed exactly and the year is marked to be confirmed rather than guessed.",
      },
      {
        q: "Can I use archive photos or videos?",
        a: "All archive media is supplied by the organizer. If you appear in a clip and want it reviewed, contact the organizer with the edition and a description. One short 3.0 clip is held privately pending review and is not published.",
      },
    ],
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: GROUPS.flatMap((group) =>
    group.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  ),
};

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <PageHero
        eyebrow="Need to know"
        title="Questions,"
        accent="answered plainly"
        description="Tickets, verification, the 999 card and the archive — with the limits of the supplied information stated honestly."
        compact
      >
        <TicketLink size="lg">Official tickets</TicketLink>
        <ActionLink href="/contact" variant="outline" size="lg">
          Contact the organizer
        </ActionLink>
      </PageHero>

      <section className="section-pad">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-3">
            <div className="sticky top-28 space-y-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-bone/30">
                On this page
              </p>
              {GROUPS.map((group) => (
                <a
                  key={group.title}
                  href={`#${group.title.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                  className="block border-l border-white/10 py-1.5 pl-4 text-[11px] text-bone/45 transition-colors hover:border-crimson hover:text-bone"
                >
                  {group.title}
                </a>
              ))}
              <div className="mt-6 border border-white/10 bg-white/[0.02] p-4">
                <p className="text-[9px] uppercase tracking-[0.18em] text-bone/30">Official tickets</p>
                <a
                  href={TICKET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-semibold text-bone/70 hover:text-crimson"
                >
                  {TICKET_PARTNER} <ArrowUpRight size={11} aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-14 lg:col-span-9">
            {GROUPS.map((group, groupIndex) => (
              <Reveal
                key={group.title}
                className="scroll-mt-28"
                delay={groupIndex * 0.03}
              >
                <section id={group.title.toLowerCase().replace(/[^a-z]+/g, "-")}>
                  <h2 className="font-display text-[clamp(1.9rem,4vw,3rem)] uppercase leading-none text-bone">
                    {group.title}
                  </h2>
                  <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
                    {group.items.map((item) => (
                      <details key={item.q} className="group">
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 transition-colors hover:text-bone">
                          <span className="text-sm font-medium leading-6 text-bone/80">{item.q}</span>
                          <span
                            aria-hidden="true"
                            className="relative mt-1 h-3 w-3 shrink-0 before:absolute before:left-0 before:top-1/2 before:h-px before:w-3 before:-translate-y-1/2 before:bg-crimson after:absolute after:left-1/2 after:top-0 after:h-3 after:w-px after:-translate-x-1/2 after:bg-crimson after:transition-transform group-open:after:scale-y-0"
                          />
                        </summary>
                        <div className="max-w-3xl pb-6 pr-8 text-[12px] leading-7 text-bone/50">
                          {item.a}
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              </Reveal>
            ))}

            <Reveal>
              <div className="flex flex-col gap-5 border border-crimson/25 bg-crimson/[0.04] p-6 sm:flex-row sm:items-start">
                <Info size={16} className="mt-0.5 shrink-0 text-crimson" aria-hidden="true" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-crimson">
                    Still unanswered?
                  </p>
                  <p className="mt-2 max-w-2xl text-[11px] leading-6 text-bone/45">
                    The organizer can confirm details not printed on the flyer. For phone contact,
                    use the numbers on the contact page. Do not send full ticket references or card
                    details by message.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link href="/contact" className="link-arrow text-bone/70">
                      Contact page <ArrowUpRight size={12} aria-hidden="true" />
                    </Link>
                    <a
                      href={CONTACT.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-arrow text-bone/50"
                    >
                      WhatsApp <ArrowUpRight size={12} aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
