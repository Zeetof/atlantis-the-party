"use client";

import { useState } from "react";
import { Check, Copy, Eye, EyeOff } from "lucide-react";

export function CopyField({
  label,
  value,
  secret = false,
}: {
  label: string;
  value: string;
  secret?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(!secret);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div>
      <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-bone/35">{label}</p>
      <div className="mt-1.5 flex items-stretch gap-2">
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap border border-white/12 bg-ink px-3 py-2.5 font-mono text-[10px] leading-5 text-bone/70">
          {revealed ? value : "••••••••••••••••••••••••••••••••••••••••"}
        </code>
        {secret && (
          <button
            type="button"
            onClick={() => setRevealed((current) => !current)}
            aria-label={revealed ? "Hide value" : "Reveal value"}
            className="border border-white/15 px-3 text-bone/50 transition-colors hover:border-white/35 hover:text-bone"
          >
            {revealed ? <EyeOff size={13} aria-hidden="true" /> : <Eye size={13} aria-hidden="true" />}
          </button>
        )}
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 border border-white/15 px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-bone/60 transition-colors hover:border-crimson hover:text-crimson"
        >
          {copied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {secret && (
        <p className="mt-1 text-[9px] leading-4 text-amber-200/50">
          Private link — share only with the verified ticket holder.
        </p>
      )}
    </div>
  );
}
