import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  Download,
  Fingerprint,
  Info,
  Mail,
  Music2,
  ShieldCheck,
  Sparkles,
  Ticket,
} from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { TributeArtwork } from "@/components/tribute/artwork";
import { TributeCardView } from "@/components/tribute/tribute-card";
import { ActionLink, TicketLink } from "@/components/ui/buttons";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { DISCLAIMER } from "@/lib/site";

export const metadata: Metadata = {
  title: "The 999 experience",
  description:
    "Atlantis 4.0's 999 remembrance experience: an original digital tribute card for verified ticket holders, assigned an approved Juice WRLD song. Independent of the artist's estate.",
  alternates: { canonical: "/999-experience" },
  openGraph: {
    title: "999 — Forever in the music",
    description:
      "A personal, original 999 tribute card for verified Atlantis 4.0 ticket holders. One card per verified ticket.",
    images: [{ url: "/og-atlantis.jpg" }],
  },
};

const STEPS = [
  {
    index: "01",
    icon: Ticket,
    title: "Buy through the official link",
    copy: "Your ticket must be purchased through the official Popout Tickets event page. Gate tickets can be verified manually by the organizer.",
  },
  {
    index: "02",
    icon: Fingerprint,
    title: "Submit your claim",
    copy: "Open the claim form with the email used at checkout and the order or ticket reference from your confirmation. No card details are requested or stored.",
  },
  {
    index: "03",
    icon: BadgeCheck,
    title: "Purchase verification",
    copy: "Claims are matched against verified purchase records where available. Anything that cannot be matched automatically goes to the organizer's manual review queue.",
  },
  {
    index: "04",
    icon: Download,
    title: "Receive your card",
    copy: "A unique card number and an approved song are assigned. Your private card link is delivered by email when configured, and downloads and shares are available from the card itself.",
  },
];

const INCLUDED = [
  { icon: Fingerprint, title: "A unique card number", copy: "Every card is individually numbered — ATP-999-2026-XXXXXX." },
  { icon: Music2, title: "An assigned song", copy: "One approved Juice WRLD track is assigned per card, with a link to the official platform." },
  { icon: Download, title: "A keepable file", copy: "Download your card as a high-resolution image to keep or share." },
  { icon: Mail, title: "A private link", copy: "A personal link lets you revisit the card; it can be rotated by the organizer if compromised." },
];

export default function NineNineNinePage() {
  return (
    <>
      <PageHero
        eyebrow="The 999 experience"
        title="Forever in"
        accent="the music"
        description="Seven years since Juice WRLD's passing in December 2019. Atlantis 4.0 holds a remembrance space for verified ticket holders — a personal, original card made to be kept, not a product endorsement."
        meta={[
          { label: "Edition", value: "Atlantis 4.0" },
          { label: "Eligibility", value: "Verified ticket holders" },
          { label: "Per ticket", value: "One card" },
        ]}
      >
        <ActionLink href="/claim" variant="light" size="lg">
          Claim your card
        </ActionLink>
        <ActionLink href="#how" variant="outline" size="lg">
          How it works
        </ActionLink>
      </PageHero>

      <section className="section-pad">
        <div className="shell grid gap-14 lg:grid-cols-12 lg:items-center lg:gap-16">
          <Reveal className="lg:col-span-6">
            <SectionHeading
              eyebrow="Why 999"
              title={
                <>
                  A number,
                  <br />
                  a memory
                </>
              }
              accent="Not a water theme"
              description="999 is a remembrance, not a spectacle. The number is carried through original geometry, chrome type and a single red mark — no album covers, no artist likeness, no lyrics, no recordings."
            />
            <div className="mt-8 space-y-4">
              <div className="border-l-2 border-crimson pl-5">
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-crimson">
                  What this is
                </p>
                <p className="mt-2 text-sm leading-7 text-bone/60">
                  An independent tribute designed by and for the Atlantis community. It lives
                  alongside the party as a quiet moment — one card, one song, one name.
                </p>
              </div>
              <div className="border-l-2 border-white/15 pl-5">
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-bone/45">
                  What this is not
                </p>
                <p className="mt-2 text-sm leading-7 text-bone/50">
                  It is not affiliated with, endorsed by, or sponsored by Juice WRLD's estate. It
                  contains no copyrighted album artwork, lyrics or audio, and no claim of official
                  merchandise.
                </p>
              </div>
            </div>
            <p className="mt-8 flex items-start gap-2 text-[10px] leading-5 text-bone/30">
              <Info size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
              {DISCLAIMER}
            </p>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-6">
            <div className="relative mx-auto max-w-[420px]">
              <div aria-hidden="true" className="absolute -inset-5 border border-crimson/15" />
              <TributeCardView
                displayName="Your Name"
                cardNumber="ATP-999-2026-000000"
                songTitle="Assigned on issuance"
                sample
              />
              <div className="pointer-events-none absolute -bottom-4 -right-3 bg-crimson px-3 py-1.5 font-display text-[11px] uppercase tracking-[0.18em] text-ink">
                Sample card
              </div>
            </div>
            <p className="mx-auto mt-8 max-w-sm text-center text-[10px] leading-5 text-bone/30">
              A sample of the card layout. Names and card numbers are issued only after purchase
              verification.
            </p>
          </Reveal>
        </div>
      </section>

      <section id="how" className="section-pad border-y border-white/10 bg-[#0a0a0a]">
        <div className="shell">
          <Reveal>
            <SectionHeading
              eyebrow="How it works"
              title="Four steps"
              accent="verify, then issue"
              description="The tribute is tied to a verified Atlantis 4.0 purchase. Nothing is issued from a screenshot alone, and no payment details are ever collected on this site."
            />
          </Reveal>

          <div className="mt-12 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <Reveal key={step.index} delay={index * 0.06}>
                <div className="h-full bg-ink p-6 lg:p-7">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-3xl leading-none text-outline">
                      {step.index}
                    </span>
                    <step.icon size={18} className="text-crimson" aria-hidden="true" />
                  </div>
                  <h3 className="mt-6 font-display text-lg uppercase leading-tight text-bone">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-[11px] leading-6 text-bone/45">{step.copy}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-10">
            <div className="grid gap-4 border border-white/10 bg-white/[0.02] p-5 sm:grid-cols-2 lg:grid-cols-4">
              {INCLUDED.map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <item.icon size={15} className="mt-0.5 shrink-0 text-crimson" aria-hidden="true" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-bone/80">
                      {item.title}
                    </p>
                    <p className="mt-1 text-[11px] leading-5 text-bone/40">{item.copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal className="mt-10">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-xl text-[11px] leading-6 text-bone/40">
                Claiming is open while the organizer keeps it enabled. Duplicate claims for the same
                ticket or email are blocked, and one verified ticket issues one card.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <ActionLink href="/claim" variant="light" size="md">
                  Start your claim
                </ActionLink>
                <ActionLink href="/claim/status" variant="outline" size="md">
                  Check claim status
                </ActionLink>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section-pad">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-5">
            <div className="relative overflow-hidden border border-white/10">
              <TributeArtwork />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 border border-white/15 bg-black/55 px-3 py-2 backdrop-blur">
                <p className="text-[8px] uppercase tracking-[0.24em] text-bone/60">
                  Original Atlantis artwork
                </p>
                <Sparkles size={12} className="text-crimson" aria-hidden="true" />
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-7">
            <SectionHeading
              eyebrow="Privacy and trust"
              title="Built to protect"
              accent="the person behind the ticket"
              description="The tribute asks for the minimum needed to verify a purchase. Personal data is encrypted at rest, ticket references are hashed for lookup, and full references are never published."
            />

            <ul className="mt-8 space-y-4">
              {[
                {
                  icon: ShieldCheck,
                  title: "No card data, ever",
                  copy: "Payment happens on Popout Tickets. This site never asks for or stores card numbers, CVVs or banking details.",
                },
                {
                  icon: Fingerprint,
                  title: "Ticket references are protected",
                  copy: "References are normalised and HMAC-hashed for matching. Displays show only the last four characters.",
                },
                {
                  icon: Mail,
                  title: "Email is encrypted",
                  copy: "Your purchase email is encrypted at rest and only shown masked in the organizer dashboard.",
                },
                {
                  icon: BadgeCheck,
                  title: "No verification by screenshot",
                  copy: "Claims are never approved solely from an image or an unverified number. Unmatched claims wait for organizer review.",
                },
              ].map((item) => (
                <li key={item.title} className="flex items-start gap-4 border-b border-white/10 pb-4">
                  <item.icon size={16} className="mt-0.5 shrink-0 text-crimson" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-bone/80">
                      {item.title}
                    </p>
                    <p className="mt-1.5 text-[11px] leading-6 text-bone/45">{item.copy}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <ActionLink href="/privacy" variant="outline" size="sm">
                Privacy notice
              </ActionLink>
              <Link href="/faq" className="link-arrow px-1 py-3 text-bone/55">
                Read the FAQ
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#0a0a0a]">
        <div className="shell py-16 sm:py-20">
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <p className="font-editorial text-[clamp(2rem,4.5vw,3.6rem)] italic leading-none text-crimson">
                One card. One song.
              </p>
              <h2 className="mt-4 font-display text-[clamp(2.4rem,6vw,4.6rem)] uppercase leading-[0.9] text-bone">
                Yours to keep
              </h2>
              <p className="mt-4 max-w-xl text-[11px] leading-6 text-bone/40">
                Verified Atlantis 4.0 ticket holders can claim one 999 card. Claims remain open for
                the period set by the organizer.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <ActionLink href="/claim" variant="light" size="lg">
                Claim your card
              </ActionLink>
              <TicketLink size="lg">Get a ticket first</TicketLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
