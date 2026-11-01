"use client";

import { useRef, useState } from "react";
import { Check, Download, Loader2, Link2, Share2 } from "lucide-react";
import { TributeCardView } from "@/components/tribute/tribute-card";

type CardActionsProps = {
  token: string;
  displayName: string;
  cardNumber: string;
  songTitle: string;
  songUrl: string;
  linkStatus: string;
};

export function CardActions({
  token,
  displayName,
  cardNumber,
  songTitle,
  songUrl,
  linkStatus,
}: CardActionsProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"download" | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareNote, setShareNote] = useState<string | null>(null);

  async function handleDownload() {
    if (!cardRef.current || busy) return;
    setBusy("download");
    setError(null);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#080808",
      });
      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = `atlantis-999-${cardNumber}.png`;
      anchor.click();
      void fetch(`/api/cards/${encodeURIComponent(token)}/download`, { method: "POST" }).catch(
        () => undefined,
      );
    } catch {
      setError("The image could not be generated in this browser. Try a different browser or take a screenshot.");
    } finally {
      setBusy(null);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setError("Copy failed. You can copy the address from your browser instead.");
    }
  }

  async function handleShare() {
    const shareData = {
      title: "My Atlantis 999 tribute card",
      text: "A 999 remembrance card from Atlantis 4.0. This link is private — please do not post it publicly.",
      url: window.location.href,
    };
    if (typeof navigator.share === "function") {
      try {
        await navigator.share(shareData);
        setShareNote("Shared. The link is still private — share only with people you trust.");
      } catch {
        // User cancelled the share sheet.
      }
      return;
    }
    await handleCopy();
    setShareNote("Sharing is unavailable here, so the private link was copied instead.");
  }

  return (
    <div>
      <div ref={cardRef} className="mx-auto w-full max-w-[430px]">
        <TributeCardView
          displayName={displayName}
          cardNumber={cardNumber}
          songTitle={songTitle}
          songUrl={songUrl}
          linkStatus={linkStatus}
        />
      </div>

      <div className="mx-auto mt-6 grid max-w-[430px] gap-2.5 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleDownload}
          disabled={busy !== null}
          className="inline-flex items-center justify-center gap-2.5 bg-crimson px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.18em] text-ink transition-colors hover:bg-[#ff4b46] disabled:opacity-60 sm:col-span-2"
        >
          {busy === "download" ? (
            <>
              <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Rendering image
            </>
          ) : (
            <>
              <Download size={14} aria-hidden="true" /> Download card
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center justify-center gap-2 border border-white/20 px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-bone/70 transition-colors hover:border-bone/50 hover:text-bone"
        >
          {copied ? <Check size={13} aria-hidden="true" /> : <Link2 size={13} aria-hidden="true" />}
          {copied ? "Link copied" : "Copy private link"}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center justify-center gap-2 border border-white/20 px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-bone/70 transition-colors hover:border-bone/50 hover:text-bone"
        >
          <Share2 size={13} aria-hidden="true" /> Share card
        </button>
      </div>

      <div aria-live="polite" className="mx-auto max-w-[430px]">
        {error && <p className="mt-3 text-[10px] leading-5 text-[#ff8a86]">{error}</p>}
        {shareNote && <p className="mt-3 text-[10px] leading-5 text-bone/40">{shareNote}</p>}
      </div>
    </div>
  );
}
