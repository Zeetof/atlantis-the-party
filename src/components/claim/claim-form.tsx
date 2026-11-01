"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type SuccessPayload = {
  ok: true;
  publicRef: string;
  status: "VERIFIED" | "MANUAL_REVIEW";
  matched: boolean;
  message: string;
};

type ErrorPayload = {
  ok: false;
  code?: string;
  message: string;
};

const DEMO_EMAIL = "demo.attendee@example.com";
const DEMO_REF = "SANDBOX-ATP4-0001";

export function ClaimForm({ demoMode = false }: { demoMode?: boolean }) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [ticketRef, setTicketRef] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SuccessPayload | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!consent) {
      setError("Confirm the privacy notice to continue.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, email, ticketRef, consent }),
      });
      const payload = (await response.json()) as SuccessPayload | ErrorPayload;

      if (!response.ok || !payload.ok) {
        setError(payload.ok === false ? payload.message : "Something went wrong. Please try again.");
        return;
      }
      setResult(payload);
    } catch {
      setError("The claim could not be submitted. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="border border-white/15 bg-[#0b0b0b]" aria-live="polite">
        <div className="border-b border-white/10 bg-crimson/[0.06] p-6 sm:p-8">
          <span className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.24em] text-crimson">
            <CheckCircle2 size={14} aria-hidden="true" /> Claim received
          </span>
          <p className="mt-4 font-display text-[clamp(2rem,5vw,3.2rem)] uppercase leading-[0.92] text-bone">
            {result.status === "VERIFIED" ? "Purchase matched" : "In review"}
          </p>
          <p className="mt-3 max-w-xl text-sm leading-7 text-bone/55">{result.message}</p>
        </div>

        <div className="space-y-4 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border border-white/10 p-4">
            <div>
              <p className="text-[8px] font-semibold uppercase tracking-[0.24em] text-bone/35">
                Your claim reference
              </p>
              <p className="mt-1.5 font-mono text-sm tracking-[0.14em] text-bone">
                {result.publicRef}
              </p>
            </div>
            <span
              className={cn(
                "border px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.18em]",
                result.status === "VERIFIED"
                  ? "border-crimson/40 text-crimson"
                  : "border-white/20 text-bone/55",
              )}
            >
              {result.status === "VERIFIED" ? "Verified" : "Manual review"}
            </span>
          </div>

          <p className="text-[11px] leading-6 text-bone/40">
            Keep this reference. The organizer issues cards from the dashboard; when email delivery
            is configured you will receive the private card link at the address used above. Card
            links are never published publicly.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/claim/status"
              className="inline-flex items-center justify-center gap-2 bg-bone px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ink transition-colors hover:bg-white"
            >
              Check status <ArrowRight size={13} aria-hidden="true" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 border border-white/20 px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] text-bone/70 transition-colors hover:border-crimson hover:text-crimson"
            >
              Back to Atlantis
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-white/15 bg-[#0b0b0b]" noValidate>
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4 sm:px-8">
        <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-bone/55">
          Claim form
        </p>
        <span className="inline-flex items-center gap-1.5 text-[8px] uppercase tracking-[0.18em] text-bone/30">
          <ShieldCheck size={12} aria-hidden="true" /> Encrypted at rest
        </span>
      </div>

      <div className="space-y-5 p-6 sm:p-8">
        {demoMode && (
          <div className="border border-crimson/30 bg-crimson/[0.05] p-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-crimson">
              Local demo mode
            </p>
            <p className="mt-1.5 text-[11px] leading-5 text-bone/45">
              No live ticketing API is connected. Use the seeded sandbox purchase to exercise the
              verified flow. Real claims require a configured provider feed or manual review.
            </p>
            <button
              type="button"
              onClick={() => {
                setDisplayName("Demo Attendee");
                setEmail(DEMO_EMAIL);
                setTicketRef(DEMO_REF);
                setError(null);
              }}
              className="mt-3 border border-crimson/40 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.16em] text-crimson transition-colors hover:bg-crimson hover:text-ink"
            >
              Fill demo purchase
            </button>
          </div>
        )}

        <div>
          <label
            htmlFor="displayName"
            className="block text-[9px] font-semibold uppercase tracking-[0.22em] text-bone/45"
          >
            Name on the card
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            required
            autoComplete="name"
            maxLength={40}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="How your name should read"
            className="mt-2 w-full border border-white/15 bg-ink px-4 py-3.5 text-sm text-bone placeholder:text-bone/20 focus:border-crimson"
          />
          <p className="mt-1.5 text-[10px] text-bone/25">
            2–40 characters. Letters, numbers, spaces, apostrophes or hyphens.
          </p>
        </div>

        <div>
          <label
            htmlFor="claim-email"
            className="block text-[9px] font-semibold uppercase tracking-[0.22em] text-bone/45"
          >
            Purchase email
          </label>
          <input
            id="claim-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            maxLength={160}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="The email used on Popout Tickets"
            className="mt-2 w-full border border-white/15 bg-ink px-4 py-3.5 text-sm text-bone placeholder:text-bone/20 focus:border-crimson"
          />
        </div>

        <div>
          <label
            htmlFor="ticketRef"
            className="block text-[9px] font-semibold uppercase tracking-[0.22em] text-bone/45"
          >
            Ticket or order reference
          </label>
          <input
            id="ticketRef"
            name="ticketRef"
            type="text"
            required
            autoComplete="off"
            spellCheck={false}
            maxLength={100}
            value={ticketRef}
            onChange={(event) => setTicketRef(event.target.value)}
            placeholder="From your Popout Tickets confirmation"
            className="mt-2 w-full border border-white/15 bg-ink px-4 py-3.5 font-mono text-sm uppercase tracking-[0.08em] text-bone placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-bone/20 focus:border-crimson"
          />
          <p className="mt-1.5 text-[10px] text-bone/25">
            Never share the reference publicly. It is stored encrypted and only the last four
            characters are displayed.
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-3 border-t border-white/10 pt-5">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#e53935]"
            required
          />
          <span className="text-[11px] leading-6 text-bone/45">
            I have read the{" "}
            <Link href="/privacy" className="text-bone/75 underline underline-offset-4 hover:text-crimson">
              privacy notice
            </Link>{" "}
            and confirm this is my own ticket purchase. I understand the card is issued only after
            the purchase is verified.
          </span>
        </label>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-2 border border-crimson/40 bg-crimson/[0.07] p-4 text-[11px] leading-5 text-[#ff8a86]"
          >
            <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="group flex w-full items-center justify-center gap-3 bg-crimson px-6 py-4 text-[11px] font-bold uppercase tracking-[0.22em] text-ink transition-colors hover:bg-[#ff4b46] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 size={15} className="animate-spin" aria-hidden="true" /> Submitting claim
            </>
          ) : (
            <>
              Submit claim <ArrowRight size={15} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>

        <p className="text-center text-[10px] leading-5 text-bone/25">
          No payment details are collected here. One card per verified ticket. Duplicate claims for
          the same ticket or email are rejected.
        </p>
      </div>
    </form>
  );
}
