import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { ClaimStatusForm } from "@/components/claim/claim-status-form";
import { ActionLink } from "@/components/ui/buttons";
import { Reveal } from "@/components/ui/reveal";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Claim status",
  description:
    "Check the status of your Atlantis 4.0 999 tribute card claim using your claim reference and purchase email.",
  alternates: { canonical: "/claim/status" },
};

export default function ClaimStatusPage() {
  return (
    <>
      <PageHero
        eyebrow="The 999 experience"
        title="Claim"
        accent="status"
        description="Look up a submitted claim with the reference shown after submission and the email used for the claim. Card links are never displayed here."
        compact
      >
        <ActionLink href="/claim" variant="light" size="lg">
          Submit a new claim
        </ActionLink>
      </PageHero>

      <section className="section-pad">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-7">
            <ClaimStatusForm />
          </Reveal>
          <Reveal delay={0.08} className="lg:col-span-5">
            <div className="space-y-6">
              <div className="flex items-start gap-3 border border-white/10 bg-white/[0.02] p-5">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-crimson" aria-hidden="true" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-bone/80">
                    Private by design
                  </p>
                  <p className="mt-2 text-[11px] leading-6 text-bone/45">
                    A lookup requires both the claim reference and the matching email. Guesses are
                    rate-limited, and the response never reveals a full card number or private card
                    link.
                  </p>
                </div>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-bone/35">
                  Typical timeline
                </p>
                <ol className="mt-4 space-y-4 border-l border-white/10 pl-5">
                  {[
                    ["Submitted", "Your claim receives a reference immediately."],
                    ["Manual review", "Unmatched purchases are checked by the organizer."],
                    ["Verified", "The purchase is confirmed against a real order."],
                    ["Issued", "A numbered card and approved song are assigned."],
                  ].map(([title, copy]) => (
                    <li key={title} className="relative">
                      <span className="absolute -left-[23px] top-1.5 h-1.5 w-1.5 bg-crimson" aria-hidden="true" />
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-bone/75">
                        {title}
                      </p>
                      <p className="mt-1 text-[11px] leading-5 text-bone/35">{copy}</p>
                    </li>
                  ))}
                </ol>
              </div>
              <p className="text-[10px] leading-5 text-bone/25">
                Times vary with organizer review and email configuration. A claim is never approved
                from a screenshot alone.
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
