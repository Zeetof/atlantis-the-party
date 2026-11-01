"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import { TICKET_URL } from "@/lib/site";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main" className="grain flex min-h-[100svh] items-center overflow-hidden">
      <div className="shell relative py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex justify-center">
            <Wordmark size="md" chrome />
          </div>
          <p className="mt-10 text-[9px] font-bold uppercase tracking-[0.32em] text-crimson">
            Something broke in the room
          </p>
          <h1 className="mt-5 font-display text-[clamp(3rem,9vw,6.4rem)] uppercase leading-[0.86] text-bone">
            We hit
            <br />
            a wrong note
          </h1>
          <p className="mx-auto mt-6 max-w-md text-sm leading-7 text-bone/55">
            The page could not be rendered. Try again, or head back to the site. If this keeps
            happening, contact the organizer with the time it occurred.
          </p>
          {error.digest && (
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-bone/25">
              Reference: {error.digest}
            </p>
          )}
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 bg-bone px-7 py-4 text-[10px] font-bold uppercase tracking-[0.22em] text-ink transition-colors hover:bg-white"
            >
              <RotateCcw size={14} aria-hidden="true" /> Try again
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center border border-bone/25 px-7 py-4 text-[10px] font-bold uppercase tracking-[0.22em] text-bone transition-colors hover:border-crimson hover:text-crimson"
            >
              Back to Atlantis
            </Link>
          </div>
          <a
            href={TICKET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block text-[10px] uppercase tracking-[0.18em] text-bone/30 hover:text-bone"
          >
            Official ticket page
          </a>
        </div>
      </div>
    </main>
  );
}
