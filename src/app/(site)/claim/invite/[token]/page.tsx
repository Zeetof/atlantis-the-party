import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, KeyRound, ShieldAlert, TimerOff } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { InviteClaimForm } from "@/components/claim/invite-claim-form";
import { getPublicInvite } from "@/server/invites";

export const metadata: Metadata = {
  title: "Claim invitation",
  description: "Private Atlantis 4.0 card claim invitation.",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

const STATES = {
  INVALID: {
    icon: ShieldAlert,
    label: "Link not recognised",
    title: "This invitation is not valid",
    copy: "The link may have been mistyped, replaced by a newer invitation, or cancelled by the organizer. Ask the organizer to send a fresh invitation.",
  },
  USED: {
    icon: KeyRound,
    label: "Already claimed",
    title: "This invitation was already used",
    copy: "A claim already exists for this purchase. Check the status with your claim reference and purchase email, or contact the organizer.",
  },
  EXPIRED: {
    icon: TimerOff,
    label: "Expired",
    title: "This invitation has expired",
    copy: "Invitation links are valid for 30 days. Ask the organizer to issue a new link to the purchase email — your ticket is still valid.",
  },
} as const;

export default async function InviteClaimPage({ params }: { params: { token: string } }) {
  const invite = await getPublicInvite(params.token);

  return (
    <>
      <PageHero
        eyebrow="999 experience"
        title="Your private"
        accent="claim invitation"
        description="This link is tied to one verified Atlantis 4.0 purchase. Do not forward it — anyone with the link could claim your card."
        meta={[
          { label: "Access", value: "Invitation only" },
          { label: "Per ticket", value: "One card" },
          { label: "Expires", value: "30 days" },
        ]}
        compact
      />

      <section className="section-pad">
        <div className="shell max-w-3xl">
          {invite.status === "VALID" ? (
            <>
              <div className="mb-6 flex items-start gap-3 border border-white/10 bg-white/[0.02] p-4">
                <KeyRound size={15} className="mt-0.5 shrink-0 text-crimson" aria-hidden="true" />
                <p className="text-[11px] leading-5 text-bone/40">
                  Verified purchase for {invite.maskedEmail}. Submitting the form creates a verified
                  claim; the organizer issues the finished card afterwards.
                </p>
              </div>
              <InviteClaimForm
                token={params.token}
                maskedEmail={invite.maskedEmail}
                last4={invite.last4}
                expiresAt={invite.expiresAt.toISOString()}
              />
            </>
          ) : (
            (() => {
              const state = STATES[invite.status];
              const Icon = state.icon;
              return (
                <div className="border border-white/15 bg-[#0b0b0b]">
                  <div className="border-b border-white/10 px-6 py-4 sm:px-8">
                    <span className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.24em] text-bone/40">
                      <Icon size={13} aria-hidden="true" /> {state.label}
                    </span>
                  </div>
                  <div className="p-6 sm:p-8">
                    <h2 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] uppercase leading-[0.95] text-bone">
                      {state.title}
                    </h2>
                    <p className="mt-4 max-w-xl text-sm leading-7 text-bone/50">{state.copy}</p>
                    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                      <Link
                        href="/claim/status"
                        className="inline-flex items-center justify-center gap-2 bg-bone px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ink transition-colors hover:bg-white"
                      >
                        Check claim status <ArrowRight size={13} aria-hidden="true" />
                      </Link>
                      <Link
                        href="/contact"
                        className="inline-flex items-center justify-center gap-2 border border-white/20 px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] text-bone/70 transition-colors hover:border-crimson hover:text-crimson"
                      >
                        Contact the organizer
                      </Link>
                    </div>
                    <p className="mt-6 text-[10px] leading-5 text-bone/25">
                      Never send the full ticket reference, invitation link or payment details in a
                      public message.
                    </p>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      </section>
    </>
  );
}
