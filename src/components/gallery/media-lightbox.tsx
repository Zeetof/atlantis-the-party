"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { formatDuration, type GalleryItem } from "@/components/gallery/types";

type LightboxProps = {
  items: GalleryItem[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

export function MediaLightbox({ items, index, onClose, onIndexChange }: LightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<number | null>(null);
  const current = items[index];

  useEffect(() => setMounted(true), []);

  const next = useCallback(() => {
    onIndexChange((index + 1) % items.length);
  }, [index, items.length, onIndexChange]);

  const previous = useCallback(() => {
    onIndexChange((index - 1 + items.length) % items.length);
  }, [index, items.length, onIndexChange]);

  useEffect(() => {
    setVideoLoading(true);
  }, [index]);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") previous();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [next, previous, onClose]);

  if (!mounted || !current) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Media viewer: ${current.caption}`}
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm"
      onTouchStart={(event) => {
        touchStart.current = event.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStart.current;
        if (Math.abs(delta) > 55) {
          if (delta < 0) next();
          else previous();
        }
        touchStart.current = null;
      }}
    >
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6">
        <p className="font-display text-xs uppercase tracking-[0.2em] text-bone/60">
          {String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close media viewer"
          className="flex h-10 w-10 items-center justify-center border border-white/20 text-bone transition-colors hover:border-crimson hover:text-crimson"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-3 sm:p-8">
        <button
          type="button"
          onClick={previous}
          aria-label="Previous media"
          className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center border border-white/15 bg-black/40 text-bone transition-colors hover:border-crimson hover:text-crimson sm:left-5"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>

        {current.type === "IMAGE" ? (
          <Image
            key={current.id}
            src={current.src}
            alt={current.caption}
            width={current.width ?? 1200}
            height={current.height ?? 1600}
            sizes="100vw"
            className="max-h-[78vh] w-auto max-w-full object-contain"
            priority
          />
        ) : (
          <div className="relative flex max-h-full w-full items-center justify-center">
            {videoLoading && (
              <span className="absolute z-10 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-bone/60">
                <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Loading video
              </span>
            )}
            <video
              key={current.id}
              src={current.src}
              poster={current.poster ?? undefined}
              controls
              playsInline
              preload="metadata"
              onCanPlay={() => setVideoLoading(false)}
              onWaiting={() => setVideoLoading(true)}
              onError={() => setVideoLoading(false)}
              className="max-h-[78vh] max-w-full bg-black"
            >
              Your browser does not support embedded video.
            </video>
          </div>
        )}

        <button
          type="button"
          onClick={next}
          aria-label="Next media"
          className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center border border-white/15 bg-black/40 text-bone transition-colors hover:border-crimson hover:text-crimson sm:right-5"
        >
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="border-t border-white/10 px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-crimson">
              {current.editionName} · {current.type === "VIDEO" ? "Video" : "Photograph"}
              {current.type === "VIDEO" && current.durationSeconds
                ? ` · ${formatDuration(current.durationSeconds)}`
                : ""}
            </p>
            <p className="mt-1 max-w-3xl text-sm text-bone/75">{current.caption}</p>
          </div>
          <p className="text-[9px] uppercase tracking-[0.16em] text-bone/30">Esc to close · ← → to browse</p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
