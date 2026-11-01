"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Play } from "lucide-react";
import { MediaLightbox } from "@/components/gallery/media-lightbox";
import { formatDuration, type GalleryItem } from "@/components/gallery/types";
import { cn } from "@/lib/utils";

type GalleryExplorerProps = {
  items: GalleryItem[];
  initialType?: "ALL" | "IMAGE" | "VIDEO";
  showEditionFilter?: boolean;
  showTypeFilter?: boolean;
};

export function GalleryExplorer({
  items,
  initialType = "ALL",
  showEditionFilter = true,
  showTypeFilter = true,
}: GalleryExplorerProps) {
  const [type, setType] = useState<"ALL" | "IMAGE" | "VIDEO">(initialType);
  const [edition, setEdition] = useState("ALL");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const editions = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((item) => map.set(item.editionSlug, item.editionName));
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  const visible = useMemo(() => {
    return items.filter((item) => {
      if (type !== "ALL" && item.type !== type) return false;
      if (edition !== "ALL" && item.editionSlug !== edition) return false;
      return true;
    });
  }, [items, type, edition]);

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
        {showTypeFilter && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by media type">
            {[
              { key: "ALL", label: "Everything" },
              { key: "IMAGE", label: "Photographs" },
              { key: "VIDEO", label: "Videos" },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                aria-pressed={type === option.key}
                onClick={() => {
                  setType(option.key as typeof type);
                  setActiveIndex(null);
                }}
                className={cn(
                  "border px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] transition-colors",
                  type === option.key
                    ? "border-crimson bg-crimson text-ink"
                    : "border-white/15 text-bone/55 hover:border-white/35 hover:text-bone",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        {showEditionFilter && (
          <label className="flex items-center gap-3">
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-bone/35">
              Edition
            </span>
            <select
              value={edition}
              onChange={(event) => {
                setEdition(event.target.value);
                setActiveIndex(null);
              }}
              className="border border-white/15 bg-ink px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-bone focus:border-crimson"
            >
              <option value="ALL">All editions</option>
              {editions.map(([slug, name]) => (
                <option key={slug} value={slug}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <p className="mt-5 text-[10px] uppercase tracking-[0.2em] text-bone/30">
        {visible.length} {visible.length === 1 ? "item" : "items"} · Approved media only
      </p>

      {visible.length === 0 ? (
        <div className="mt-10 border border-white/10 p-10 text-center">
          <p className="font-display text-2xl uppercase text-bone/70">No media in this view</p>
          <p className="mt-2 text-sm text-bone/40">Try another edition or media type.</p>
        </div>
      ) : (
        <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
          {visible.map((item, index) => {
            const ratio = item.width && item.height ? item.width / item.height : 0.8;
            const duration = formatDuration(item.durationSeconds);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className="group relative block w-full break-inside-avoid overflow-hidden border border-white/10 bg-charcoal text-left"
                aria-label={`Open ${item.type === "VIDEO" ? "video" : "photograph"}: ${item.caption}`}
              >
                <div className="relative w-full" style={{ aspectRatio: `${ratio}` }}>
                  <Image
                    src={item.type === "VIDEO" ? (item.poster ?? item.src) : item.src}
                    alt={item.caption}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    loading="lazy"
                    className="object-cover transition-transform duration-700 ease-luxe group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/10" />
                  <span className="absolute left-3 top-3 border border-white/20 bg-black/50 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.14em] text-bone/75 backdrop-blur">
                    {item.editionName}
                  </span>
                  {item.type === "VIDEO" && (
                    <>
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-black/35 backdrop-blur transition-all duration-300 group-hover:scale-110 group-hover:border-crimson group-hover:bg-crimson">
                          <Play size={18} className="ml-0.5 text-bone group-hover:text-ink" aria-hidden="true" />
                        </span>
                      </span>
                      {duration && (
                        <span className="absolute bottom-3 right-3 bg-black/65 px-2 py-1 text-[9px] tabular-nums text-bone/80 backdrop-blur">
                          {duration}
                        </span>
                      )}
                    </>
                  )}
                  <p className="absolute inset-x-0 bottom-0 line-clamp-2 px-4 pb-3 pr-16 text-[11px] leading-5 text-bone/75">
                    {item.caption}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {activeIndex !== null && visible[activeIndex] && (
        <MediaLightbox
          items={visible}
          index={activeIndex}
          onClose={() => setActiveIndex(null)}
          onIndexChange={setActiveIndex}
        />
      )}
    </div>
  );
}
