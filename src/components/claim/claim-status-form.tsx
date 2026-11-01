"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, ArrowRight, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusPayload = {
  ok: true;
  claim: {
    publicRef: string;
    status: string;
    statusLabel: string;
    emailMasked: string;
    createdAt: string;
    decidedAt: string | null;
    card: { last4: string; issuedAt: string } | null;
  };
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

const STATUS_COPY: Record<string, string> = {
  MANUAL_REVIEW:
    "Your claim is waiting for the organizer to verify the purchase. Keep the claim reference safe.",
  VERIFIED:
    "Your purchase is verified. The organizer can now issue your card; watch the purchase email for the private link.",
  ISSUED:
    "Your card has been issued. Use the private link from the email sent to the purchase address. If it has expired, ask the organizer to rotate it.",
  REJECTED:
    "This claim was not approved. Contact the organizer with your reference if you believe this is a mistake.",
  PENDING: "This claim is waiting to be reviewed.",
};

export function ClaimStatusForm() {
  const [publicRef, setPublicRef] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StatusPayload["claim"] | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/claims/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicRef, email }),
      });
      const payload = (await response.json()) as StatusPayload | { ok: false; message: string };
      if (!response.ok || payload.ok !== true) {
        setError(payload.ok === false ? payload.message : "Lookup failed. Please try again.");
        return;
      }
      setResult(payload.claim);
    } catch {
      setError("The lookup could not be completed. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="border border-white/15 bg-[#0b0b0b]" noValidate>
        <div className="border-b border-white/10 px-6 py-4 sm:px-8">
          <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-bone/55">
            Claim lookup
          </p>
        </div>
        <div className="space-y-5 p-6 sm:p-8">
          <div>
            <label
              htmlFor="publicRef"
              className="block text-[9px] font-semibold uppercase tracking-[0.22em] text-bone/45"
            >
              Claim reference
            </label>
            <input
              id="publicRef"
              type="text"
              required
              spellCheck={false}
              autoComplete="off"
              placeholder="ATP4-XXXXXX"
              value={publicRef}
              onChange={(event) => setPublicRef(event.target.value.toUpperCase())}
              className="mt-2 w-full border border-white/15 bg-ink px-4 py-3.5 font-mono text-sm uppercase tracking-[0.14em] text-bone placeholder:text-bone/20 focus:border-crimson"
            />
          </div>
          <div>
            <label
              htmlFor="status-email"
              className="block text-[9px] font-semibold uppercase tracking-[0.22em] text-bone/45"
            >
              Purchase email
            </label>
            <input
              id="status-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="The email used for the claim"
              className="mt-2 w-full border border-white/15 bg-ink px-4 py-3.5 text-sm text-bone placeholder:text-bone/20 focus:border-crimson"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 border border-crimson/40 bg-crimson/[0.07] p-4 text-[11px] leading-5 text-[#ff8a86]"
            >
              <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-3 bg-bone px-6 py-4 text-[11px] font-bold uppercase tracking-[0.22em] text-ink transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 size={15} className="animate-spin" aria-hidden="true" /> Looking up
              </>
            ) : (
              <>
                <Search size={15} aria-hidden="true" /> Check status
              </>
            )}
          </button>
        </div>
      </form>

      {result && (
        <div className="border border-white/15 bg-[#0b0b0b]" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-4 sm:px-8">
            <p className="font-mono text-xs tracking-[0.14em] text-bone/70">{result.publicRef}</p>
            <span
              className={cn(
                "border px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.18em]",
                result.status === "ISSUED" || result.status === "VERIFIED"
                  ? "border-crimson/40 text-crimson"
                  : result.status === "REJECTED"
                    ? "border-white/25 text-bone/40"
                    : "border-white/20 text-bone/60",
              )}
            >
              {result.statusLabel}
            </span>
          </div>
          <div className="space-y-4 p-6 sm:p-8">
            <p className="text-sm leading-7 text-bone/60">
              {STATUS_COPY[result.status] ?? "The claim is being processed."}
            </p>
            <dl className="grid gap-3 border-t border-white/10 pt-4 text-[11px] sm:grid-cols-2">
              <div>
                <dt className="text-[8px] uppercase tracking-[0.2em] text-bone/30">Submitted</dt>
                <dd className="mt-1 text-bone/65">{formatDate(result.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-[8px] uppercase tracking-[0.2em] text-bone/30">Email</dt>
                <dd className="mt-1 text-bone/65">{result.emailMasked}</dd>
              </div>
              {result.decidedAt && (
                <div>
                  <dt className="text-[8px] uppercase tracking-[0.2em] text-bone/30">Decision</dt>
                  <dd className="mt-1 text-bone/65">{formatDate(result.decidedAt)}</dd>
                </div>
              )}
              {result.card && (
                <div>
                  <dt className="text-[8px] uppercase tracking-[0.2em] text-bone/30">Card</dt>
                  <dd className="mt-1 text-bone/65">•••• {result.card.last4}</dd>
                </div>
              )}
            </dl>
            {result.status === "ISSUED" && (
              <p className="text-[11px] leading-6 text-bone/40">
                The full card link is sent only to the purchase email. If you need a new link, ask
                the organizer to rotate it from the dashboard.
              </p>
            )}
            <Link href="/contact" className="link-arrow text-bone/60">
              Need help? Contact the organizer <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
