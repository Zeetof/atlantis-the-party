import type { Metadata } from "next";
import Link from "next/link";
import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { ActionLink } from "@/components/ui/buttons";
import { Reveal } from "@/components/ui/reveal";
import { CONTACT, TICKET_PARTNER } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy notice",
  description:
    "How Atlantis The Party handles personal data for ticket verification, the 999 tribute card, email delivery and organizer administration.",
  alternates: { canonical: "/privacy" },
};

const SECTIONS = [
  {
    id: "what-we-collect",
    title: "What we collect",
    body: [
      "When you submit a 999 card claim, we collect the display name you want printed on the card, the email address used for your ticket purchase, and the ticket or order reference from your official purchase. We also derive a hashed form of your IP address for rate limiting and abuse prevention.",
      "When a purchase is verified, we record the verification status, the time it was received and the source (a signed provider feed, a manual organizer check, or the local sandbox demo). We never collect card numbers, CVVs, bank credentials or one-time payment codes.",
      "The organizer dashboard records administrative actions in an audit log: who acted, what they changed and when. Admin sessions use a signed, http-only cookie. This website does not include advertising or third-party analytics scripts.",
    ],
  },
  {
    id: "why",
    title: "Why we use it",
    body: [
      "To match a claim to a real purchase and prevent duplicate or fraudulent claims. To issue a numbered card and assign an approved song. To deliver the private card link by email when email delivery is configured. To answer support messages and keep an accountable record of administrative decisions.",
      "Rate-limit counters are used only to stop abuse of the claim and lookup endpoints. They are not used for profiling or marketing.",
    ],
  },
  {
    id: "how-protected",
    title: "How it is protected",
    body: [
      "Purchase emails and ticket references are encrypted at rest with AES-256-GCM. Lookup values are derived with HMAC-SHA256 so the database can match a claim without storing the original reference in a searchable form. Card access tokens are stored as SHA-256 hashes; the organizer can rotate a token so an exposed link stops working.",
      "Administrator passwords are hashed with bcrypt. Admin routes require an authenticated session and role checks, and sensitive actions are written to the audit log. Public pages never display a full ticket reference, and claim lookups require both a reference and the matching email.",
    ],
  },
  {
    id: "sharing",
    title: "Sharing and processors",
    body: [
      `${TICKET_PARTNER} processes ticket purchases on its own platform under its own privacy terms. This website links to that checkout and does not receive card data. When configured, Resend is used to deliver the private card email; the recipient address and card details are passed to that provider solely for delivery. Hosting and database providers process data on the organizer's behalf.`,
      "We do not sell personal data. We do not publish ticket holders' names, emails or references. A card is shown only through its private link.",
    ],
  },
  {
    id: "retention",
    title: "Retention",
    body: [
      "Claims and verification records are kept while the organizer administers the 999 tribute and for a reasonable period afterwards to resolve disputes and preserve audit integrity. Private card links expire 30 days after issuance, but the organizer may reissue a link for a verified ticket holder.",
      "You can ask the organizer to correct or delete claim data. Some records may be retained where needed to prevent fraud or meet legal obligations, and audit entries may be kept in a form that no longer identifies you.",
    ],
  },
  {
    id: "your-choices",
    title: "Your choices",
    body: [
      "You choose whether to submit a claim; the card is optional. You can ask what claim data is held, request a correction, or ask for deletion. To protect the ticket holder, requests may require confirmation through the purchase email. Use the contact page or call the organizer.",
      "If you appear in archive media and want a clip or photograph reviewed or removed, contact the organizer with the edition and a description. One short Atlantis 3.0 clip is held privately pending review and is not published.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Privacy"
        title="Your data,"
        accent="handled deliberately"
        description="The 999 tribute needs a small amount of personal data to verify a purchase. This notice explains what is collected, how it is protected and the choices available."
        meta={[
          { label: "Last updated", value: "November 1, 2026" },
          { label: "Controller", value: "WESTHAN.ENT" },
          { label: "Contact", value: CONTACT.phones[0].label },
        ]}
        compact
      >
        <ActionLink href="/claim" variant="light" size="lg">
          Claim your card
        </ActionLink>
        <ActionLink href="/contact" variant="outline" size="lg">
          Contact the organizer
        </ActionLink>
      </PageHero>

      <section className="section-pad">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-3">
            <div className="sticky top-28 space-y-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-bone/30">
                Contents
              </p>
              {SECTIONS.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block border-l border-white/10 py-1.5 pl-4 text-[11px] text-bone/45 transition-colors hover:border-crimson hover:text-bone"
                >
                  {section.title}
                </a>
              ))}
              <div className="mt-6 border border-white/10 bg-white/[0.02] p-4">
                <LockKeyhole size={14} className="text-crimson" aria-hidden="true" />
                <p className="mt-2 text-[10px] leading-5 text-bone/35">
                  This notice describes the site as shipped. Integrations that are not configured
                  are labelled as such elsewhere.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-12 lg:col-span-9">
            <Reveal>
              <div className="flex items-start gap-4 border border-white/10 bg-white/[0.02] p-5">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-crimson" aria-hidden="true" />
                <p className="text-[12px] leading-7 text-bone/55">
                  Short version: we collect the minimum needed to verify a ticket and issue a card.
                  Payment data never touches this site. Emails and references are encrypted; full
                  references are never published. You can ask about, correct or delete your claim
                  data through the organizer.
                </p>
              </div>
            </Reveal>

            {SECTIONS.map((section, index) => (
              <Reveal key={section.id} delay={index * 0.03}>
                <section id={section.id} className="scroll-mt-28">
                  <div className="flex items-baseline gap-4">
                    <span className="font-display text-sm text-crimson/70">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h2 className="font-display text-[clamp(1.7rem,3.6vw,2.6rem)] uppercase leading-none text-bone">
                      {section.title}
                    </h2>
                  </div>
                  <div className="mt-5 space-y-4 border-t border-white/10 pt-5">
                    {section.body.map((paragraph) => (
                      <p key={paragraph.slice(0, 30)} className="max-w-3xl text-[12px] leading-7 text-bone/50">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              </Reveal>
            ))}

            <Reveal>
              <section id="contact" className="scroll-mt-28">
                <div className="flex items-baseline gap-4">
                  <Mail size={16} className="text-crimson" aria-hidden="true" />
                  <h2 className="font-display text-[clamp(1.7rem,3.6vw,2.6rem)] uppercase leading-none text-bone">
                    Contact
                  </h2>
                </div>
                <div className="mt-5 border-t border-white/10 pt-5">
                  <p className="max-w-3xl text-[12px] leading-7 text-bone/50">
                    For any privacy request, contact WESTHAN.ENT using the phone numbers or WhatsApp
                    on the contact page. Do not include a full ticket reference in a message; the
                    organizer can request the minimum needed securely.
                  </p>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <ActionLink href="/contact" variant="outline" size="md">
                      Contact page
                    </ActionLink>
                    <Link href="/faq" className="link-arrow self-center text-bone/50">
                      Read the FAQ
                    </Link>
                  </div>
                </div>
              </section>
            </Reveal>

            <Reveal>
              <p className="border-t border-white/10 pt-6 text-[10px] leading-5 text-bone/30">
                This notice may be updated as integrations are completed. Material changes will be
                reflected here with a new date. The 999 tribute is independent of Juice WRLD's estate
                and is not affiliated with, endorsed by, or sponsored by it.
              </p>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
