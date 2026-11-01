import Link from "next/link";
import type { Metadata } from "next";
import { Wordmark } from "@/components/brand/wordmark";
import { ActionLink, TicketLink } from "@/components/ui/buttons";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main id="main" className="grain flex min-h-[100svh] items-center overflow-hidden">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 -translate-y-1/2 text-center font-display text-[42vw] uppercase leading-none text-white/[0.025]"
      >
        404
      </span>
      <div className="shell relative py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex justify-center">
            <Wordmark size="md" chrome />
          </div>
          <p className="mt-10 text-[9px] font-bold uppercase tracking-[0.32em] text-crimson">
            Off the floor plan
          </p>
          <h1 className="mt-5 font-display text-[clamp(3.4rem,10vw,7rem)] uppercase leading-[0.84] text-bone">
            This page
            <br />
            isn&apos;t here
          </h1>
          <p className="mx-auto mt-6 max-w-md text-sm leading-7 text-bone/55">
            The address may have changed or never existed. The party, the archive and the 999
            experience are all one tap away.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ActionLink href="/" variant="light" size="lg">
              Back to Atlantis
            </ActionLink>
            <TicketLink size="lg">Get tickets</TicketLink>
          </div>
          <nav aria-label="Useful links" className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3">
            {[
              { href: "/event", label: "The event" },
              { href: "/lineup", label: "Lineup" },
              { href: "/history", label: "History" },
              { href: "/gallery", label: "Gallery" },
              { href: "/claim", label: "999 claim" },
              { href: "/faq", label: "FAQ" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[10px] font-semibold uppercase tracking-[0.18em] text-bone/40 transition-colors hover:text-crimson"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </main>
  );
}
