import type { Metadata } from "next";
import { ArrowUpRight, MapPin, MessageCircle, Phone, ShieldAlert } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { ActionLink, TicketLink } from "@/components/ui/buttons";
import { Reveal } from "@/components/ui/reveal";
import { CONTACT, EVENT_DATE_LABEL, EVENT_TIME, TICKET_PARTNER, TICKET_URL, VENUE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact WESTHAN.ENT about Atlantis 4.0, official tickets, the 999 card claim process or archive media.",
  alternates: { canonical: "/contact" },
};

const WHATSAPP_MESSAGE = encodeURIComponent(
  "Hello WESTHAN.ENT — I have a question about Atlantis 4.0.",
);

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="WESTHAN.ENT"
        title="Talk to"
        accent="the organizer"
        description="The fastest route for ticket questions is the official Popout Tickets page. For claims, archive media or event details, use the organizer channels below."
        meta={[
          { label: "Event", value: `${EVENT_DATE_LABEL} · ${EVENT_TIME}` },
          { label: "Venue", value: VENUE },
          { label: "Organizer", value: "WESTHAN.ENT" },
        ]}
        compact
      >
        <TicketLink size="lg">Official tickets</TicketLink>
        <ActionLink href="/faq" variant="outline" size="lg">
          Read the FAQ first
        </ActionLink>
      </PageHero>

      <section className="section-pad">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-7">
            <div className="grid gap-4 sm:grid-cols-2">
              {CONTACT.phones.map((phone, index) => (
                <a
                  key={phone.href}
                  href={phone.href}
                  className="group border border-white/12 bg-white/[0.02] p-6 transition-colors hover:border-crimson/40"
                >
                  <div className="flex items-center justify-between">
                    <Phone size={16} className="text-crimson" aria-hidden="true" />
                    <span className="font-display text-sm text-bone/20">0{index + 1}</span>
                  </div>
                  <p className="mt-8 text-[9px] font-semibold uppercase tracking-[0.22em] text-bone/35">
                    Call the organizer
                  </p>
                  <p className="mt-2 text-lg text-bone/85 transition-colors group-hover:text-bone">
                    {phone.label}
                  </p>
                </a>
              ))}
            </div>

            <a
              href={`${CONTACT.whatsapp}?text=${WHATSAPP_MESSAGE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-4 flex items-center justify-between gap-6 border border-white/12 bg-white/[0.02] p-6 transition-colors hover:border-crimson/40"
            >
              <div className="flex items-start gap-4">
                <MessageCircle size={18} className="mt-0.5 shrink-0 text-crimson" aria-hidden="true" />
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-bone/35">
                    WhatsApp
                  </p>
                  <p className="mt-2 text-sm text-bone/80">Message the organizer directly</p>
                  <p className="mt-1 text-[11px] leading-5 text-bone/35">
                    Opens WhatsApp with a pre-filled Atlantis 4.0 message. Do not send full ticket
                    references or payment details.
                  </p>
                </div>
              </div>
              <ArrowUpRight
                size={16}
                className="shrink-0 text-bone/35 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-crimson"
                aria-hidden="true"
              />
            </a>

            <div className="mt-4 border border-white/12 bg-white/[0.02] p-6">
              <div className="flex items-start gap-4">
                <MapPin size={18} className="mt-0.5 shrink-0 text-crimson" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-bone/35">
                    The venue
                  </p>
                  <p className="mt-2 font-display text-xl uppercase text-bone/85">
                    Watercress Event Center
                  </p>
                  <p className="mt-1 text-sm text-bone/50">Allen, Ikeja, Lagos</p>
                  <a
                    href={CONTACT.maps}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-crimson hover:underline"
                  >
                    Open in Google Maps <ArrowUpRight size={12} aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 border border-crimson/25 bg-crimson/[0.04] p-5 sm:flex-row sm:items-start">
              <ShieldAlert size={16} className="mt-0.5 shrink-0 text-crimson" aria-hidden="true" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-crimson">
                  Keeping your details safe
                </p>
                <p className="mt-2 text-[11px] leading-6 text-bone/45">
                  For a paid order, share only your claim reference or the last four characters of
                  your ticket reference. The organizer will not ask for card numbers, CVVs, bank PINs
                  or one-time payment codes. Payments happen only on {TICKET_PARTNER}.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="lg:col-span-5">
            <div className="border border-white/10 bg-[#0a0a0a]">
              <div className="border-b border-white/10 p-6">
                <p className="eyebrow">Before you message</p>
                <h2 className="mt-4 font-display text-3xl uppercase leading-none text-bone">
                  The fastest routes
                </h2>
              </div>
              <ul className="divide-y divide-white/10">
                {[
                  {
                    title: "Ticket purchase or checkout",
                    copy: `${TICKET_PARTNER} handles the transaction. Use the official event page and the platform's own support.`,
                    href: TICKET_URL,
                    label: "Official ticket page",
                  },
                  {
                    title: "999 card claim",
                    copy: "Submit through the claim form first. Check the claim status with your reference and purchase email.",
                    href: "/claim/status",
                    label: "Check claim status",
                  },
                  {
                    title: "Archive media or consent",
                    copy: "Send the edition, a short description of the clip or photo, and whether you want it reviewed or removed.",
                    href: "/gallery",
                    label: "Open the gallery",
                  },
                  {
                    title: "Accessibility or venue questions",
                    copy: "Contact the organizer directly so the team can confirm arrangements with the venue.",
                    href: "/faq",
                    label: "Read the FAQ",
                  },
                ].map((item) => (
                  <li key={item.title} className="p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-bone/80">
                      {item.title}
                    </p>
                    <p className="mt-2 text-[11px] leading-6 text-bone/40">{item.copy}</p>
                    {item.href.startsWith("http") ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-arrow mt-3 text-bone/55"
                      >
                        {item.label} <ArrowUpRight size={12} aria-hidden="true" />
                      </a>
                    ) : (
                      <a href={item.href} className="link-arrow mt-3 text-bone/55">
                        {item.label} <ArrowUpRight size={12} aria-hidden="true" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-5 text-[10px] leading-5 text-bone/25">
              WESTHAN.ENT is the organizer named in the supplied event brief. This site does not
              publish an unverified contact email; use the phone numbers and WhatsApp above.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
