"use client";

import { useMemo, useRef, useState } from "react";
import { AlertCircle, FileUp, Loader2, Upload } from "lucide-react";
import { importTicketsAction } from "@/app/admin/actions";
import { parseTicketCsv, type TicketCsvResult } from "@/lib/ticket-csv";

type Parsed = TicketCsvResult & { filename: string };

const MAX_BYTES = 2 * 1024 * 1024;

function maskEmail(value: string) {
  const [local, domain] = value.split("@");
  if (!domain) return "•••";
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"•".repeat(Math.max(3, local.length - 2))}@${domain}`;
}

function shortRef(value: string) {
  return value.length > 4 ? `•••• ${value.slice(-4)}` : value;
}

export function CsvImport({ canWrite }: { canWrite: boolean }) {
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const payload = useMemo(() => {
    if (!parsed) return "";
    return JSON.stringify(
      parsed.rows.map((row) => ({
        providerRef: row.providerRef,
        email: row.email,
        quantity: row.quantity,
        purchasedAt: row.purchasedAt,
      })),
    );
  }, [parsed]);

  async function handleFile(file: File | undefined) {
    setFileError(null);
    setParsed(null);
    if (!file) return;

    if (file.size > MAX_BYTES) {
      setFileError("Keep the CSV under 2 MB. Split larger exports before importing.");
      return;
    }
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") {
      setFileError("Choose a .csv export from the ticketing provider.");
      return;
    }

    setReading(true);
    try {
      const text = await file.text();
      setParsed({ ...parseTicketCsv(text), filename: file.name });
    } catch {
      setFileError("The file could not be read. Try exporting it again.");
    } finally {
      setReading(false);
    }
  }

  const rows = parsed?.rows ?? [];
  const errors = parsed?.errors ?? [];

  return (
    <div className="space-y-5">
      <div className="border border-white/10 bg-[#0d0d0d] p-5">
        <label className="block">
          <span className="block text-[8px] font-semibold uppercase tracking-[0.18em] text-bone/40">
            Buyer CSV
          </span>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            disabled={!canWrite}
            onChange={(event) => void handleFile(event.target.files?.[0])}
            className="mt-2 block w-full cursor-pointer border border-white/12 bg-ink px-3 py-2.5 text-[11px] text-bone/60 file:mr-3 file:border-0 file:bg-crimson file:px-3 file:py-2 file:text-[9px] file:font-bold file:uppercase file:tracking-[0.14em] file:text-ink hover:file:bg-[#ff4b46] disabled:cursor-not-allowed disabled:opacity-50"
          />
        </label>
        <p className="mt-2 text-[9px] leading-4 text-bone/25">
          Expected columns: order reference, purchaser email, quantity, purchase date. A header row
          is optional. Emails are encrypted at rest; references are hashed for matching.
        </p>

        {reading && (
          <p className="mt-3 flex items-center gap-2 text-[10px] text-bone/40">
            <Loader2 size={12} className="animate-spin" aria-hidden="true" /> Reading file…
          </p>
        )}

        {fileError && (
          <p
            role="alert"
            className="mt-3 flex items-start gap-2 border border-crimson/40 bg-crimson/[0.07] p-3 text-[10px] leading-5 text-[#ff8a86]"
          >
            <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
            {fileError}
          </p>
        )}

        {parsed && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3" aria-live="polite">
            <div className="border border-white/10 p-3">
              <p className="text-[8px] uppercase tracking-[0.16em] text-bone/30">Valid rows</p>
              <p className="mt-1 font-display text-2xl text-bone">{rows.length}</p>
            </div>
            <div className="border border-white/10 p-3">
              <p className="text-[8px] uppercase tracking-[0.16em] text-bone/30">Rows rejected</p>
              <p className="mt-1 font-display text-2xl text-bone">{errors.length}</p>
            </div>
            <div className="border border-white/10 p-3">
              <p className="text-[8px] uppercase tracking-[0.16em] text-bone/30">Header detected</p>
              <p className="mt-1 font-display text-2xl text-bone">{parsed.usedHeader ? "Yes" : "No"}</p>
            </div>
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div className="border border-amber-400/30 bg-amber-400/[0.05] p-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-amber-200/70">
            Rows that will be skipped
          </p>
          <ul className="mt-2 space-y-1 text-[10px] leading-5 text-amber-100/60">
            {errors.slice(0, 8).map((error) => (
              <li key={`${error.line}-${error.message}`}>
                Line {error.line}: {error.message}
              </li>
            ))}
          </ul>
          {errors.length > 8 && (
            <p className="mt-2 text-[9px] text-amber-200/40">
              +{errors.length - 8} more. Fix the file and re-upload to include them.
            </p>
          )}
        </div>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto border border-white/10 bg-[#0d0d0d]">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 text-[8px] uppercase tracking-[0.16em] text-bone/30">
                <th className="px-4 py-3 font-semibold">Line</th>
                <th className="px-4 py-3 font-semibold">Reference</th>
                <th className="px-4 py-3 font-semibold">Purchaser</th>
                <th className="px-4 py-3 font-semibold">Qty</th>
                <th className="px-4 py-3 font-semibold">Purchased</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.slice(0, 12).map((row) => (
                <tr key={row.providerRef}>
                  <td className="px-4 py-2.5 text-[10px] tabular-nums text-bone/35">{row.line}</td>
                  <td className="px-4 py-2.5 font-mono text-[10px] text-bone/65">
                    {shortRef(row.providerRef)}
                  </td>
                  <td className="px-4 py-2.5 text-[10px] text-bone/60">{maskEmail(row.email)}</td>
                  <td className="px-4 py-2.5 text-[10px] tabular-nums text-bone/60">
                    {row.quantity}
                  </td>
                  <td className="px-4 py-2.5 text-[10px] text-bone/45">
                    {row.purchasedAt
                      ? new Date(row.purchasedAt).toLocaleDateString("en-GB")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 12 && (
            <p className="border-t border-white/10 px-4 py-2.5 text-[9px] text-bone/30">
              Showing the first 12 of {rows.length} valid rows.
            </p>
          )}
        </div>
      )}

      <form action={importTicketsAction} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input type="hidden" name="rows" value={payload} />
        <input type="hidden" name="filename" value={parsed?.filename ?? ""} />
        <input type="hidden" name="returnTo" value="/admin/import" />
        <button
          type="submit"
          disabled={!canWrite || rows.length === 0}
          className="inline-flex items-center justify-center gap-2 bg-crimson px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-ink transition-colors hover:bg-[#ff4b46] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Upload size={13} aria-hidden="true" />
          Import {rows.length > 0 ? `${rows.length} verified purchases` : "verified purchases"}
        </button>
        <p className="flex items-start gap-2 text-[9px] leading-4 text-bone/25">
          <FileUp size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
          References already on file are skipped, never duplicated. Imported purchases become
          invitable, but no card is issued until the attendee claims.
        </p>
      </form>
    </div>
  );
}
