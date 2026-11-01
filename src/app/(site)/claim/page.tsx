import type { Metadata } from "next";
import Link from "next/link";
import { Clock3, Info, ShieldCheck, Ticket } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { ClaimForm } from "@/components/claim/claim-form";
import { TributeArtwork } from "@/components/tribute/artwork";
import { ActionLink, TicketLink } from "@/components/ui/buttons";
import { Reveal } from "@/components/ui/reveal";
import { prisma } from "@/server/db";

export const metadata: Metadata = {
  title: "Claim your 999 card",
  description:
    "Claim the Atlantis 4.0 999 tribute card. Submit the email and ticket reference from your official Popout Tickets purchase for verification.",
  alternates: { canonical: "/claim" },
  robots: { index: true, follow: true },
};

export const dynamic = "force-dynamic";

export default async function ClaimPage() {
  const claimsOpenSetting = await prisma.siteSetting.findUnique({ where: { key: "claimsOpen" } });
  const claimsOpen = claimsOpenSetting?.value !== "false";
  const demoMode = process.env.DEMO_MODE === "true";

  return (
    <>
      <PageHero
        eyebrow="The 999 experience"
        title="Claim your"
        accent="tribute card"
        description="For verified Atlantis 4.0 ticket holders. Submit the email and ticket reference from your official purchase — the organizer verifies the record before any card is issued."
        meta={[
          { label: "Status", value: claimsOpen ? "Claims open" : "Claims paused" },
          { label: "Per ticket", value: "One card" },
          { label: "Ticketing", value: "Popout Tickets" },
        ]}
        compact
      >
        <ActionLink href="/999-experience" variant="outline" size="lg">
          About the 999 experience
        </ActionLink>
        <ActionLink href="/claim/status" variant="light" size="lg">
          Check claim status
        </ActionLink>
      </PageHero>

      <section className="section-pad">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-14">
          <Reveal className="lg:col-span-5">
            <div className="space-y-8">
              <div>
                <p className="eyebrow">Before you start</p>
                <h2 className="mt-5 font-display text-[clamp(2rem,4.4vw,3.4rem)] uppercase leading-[0.92] text-bone">
                  What you need
                </h2>
              </div>

              <ul className="space-y-5">
                {[
                  {
                    icon: Ticket,
                    title: "An official purchase",
                    copy: "Buy through the official Popout Tickets event page so your purchase can be verified. Gate tickets are confirmed by the organizer manually.",
                  },
                  {
                    icon: Clock3,
                    title: "The details from checkout",
                    copy: "The email address used on the order and the ticket or order reference from the confirmation.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "A safe place to keep your link",
                    copy: "The private card link is delivered to the purchase email when email delivery is configured. Never post it publicly.",
                  },
                ].map((item) => (
                  <li key={item.title} className="flex items-start gap-4 border-b border-white/10 pb-5">
                    <item.icon size={16} className="mt-0.5 shrink-0 text-crimson" aria-hidden="true" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-bone/80">
                        {item.title}
                      </p>
                      <p className="mt-2 text-[11px] leading-6 text-bone/45">{item.copy}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="relative mx-auto hidden max-w-[300px] sm:block">
                <TributeArtwork />
              </div>

              <p className="flex items-start gap-2 text-[10px] leading-5 text-bone/30">
                <Info size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
                No card or banking details are requested. This site cannot process payments and does
                not create a second checkout.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="lg:col-span-7">
            {claimsOpen ? (
              <ClaimForm demoMode={demoMode} />
            ) : (
              <div className="border border-white/15 bg-[#0b0b0b] p-8 sm:p-10">
                <p className="eyebrow">Claims paused</p>
                <h2 className="mt-5 font-display text-3xl uppercase text-bone">
                  Claims are temporarily closed
                </h2>
                <p className="mt-4 max-w-lg text-sm leading-7 text-bone/50">
                  The organizer has paused new card claims. Existing claims can still be checked,
                  and issued cards remain accessible from their private links.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <ActionLink href="/claim/status" variant="light" size="md">
                    Check your claim
                  </ActionLink>
                  <TicketLink size="md" variant="outline">
                    Ticket information
                  </TicketLink>
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 border border-white/10 bg-white/[0.02] p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] leading-5 text-bone/40">
                Need help with a purchase? Contact the organizer with your order reference — never
                post the full reference publicly.
              </p>
              <Link href="/contact" className="link-arrow shrink-0 text-bone/60">
                Contact
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
