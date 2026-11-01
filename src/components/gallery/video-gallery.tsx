"use client";

import Image from "next/image";
import { useState } from "react";
import { Play } from "lucide-react";
import { MediaLightbox } from "@/components/gallery/media-lightbox";
import { formatDuration, type GalleryItem } from "@/components/gallery/types";

export function VideoGallery({ items, editionName }: { items: GalleryItem[]; editionName: string }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
        {items.map((item, index) => {
          const ratio = item.width && item.height ? item.width / item.height : 0.5625;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className="group relative block w-full overflow-hidden border border-white/10 bg-charcoal text-left"
              aria-label={`Play video: ${item.caption}`}
            >
              <div className="relative w-full" style={{ aspectRatio: `${ratio}` }}>
                <Image
                  src={item.poster ?? item.src}
                  alt={item.caption}
                  fill
                  sizes="(min-width: 640px) 33vw, 50vw"
                  loading="lazy"
                  className="object-cover transition-transform duration-700 ease-luxe group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-black/35 backdrop-blur transition-all group-hover:scale-110 group-hover:border-crimson group-hover:bg-crimson">
                    <Play size={16} className="ml-0.5 text-bone group-hover:text-ink" aria-hidden="true" />
                  </span>
                </span>
                <span className="absolute bottom-2.5 right-2.5 bg-black/65 px-2 py-1 text-[9px] tabular-nums text-bone/80">
                  {formatDuration(item.durationSeconds) ?? "Clip"}
                </span>
                <p className="absolute inset-x-0 bottom-0 line-clamp-1 px-3 pb-2.5 pr-16 text-[10px] uppercase tracking-[0.1em] text-bone/70">
                  {item.caption}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-5 text-[10px] uppercase tracking-[0.18em] text-bone/30">
        {items.length} approved clips · {editionName} · click to open the player
      </p>

      {activeIndex !== null && items[activeIndex] && (
        <MediaLightbox
          items={items}
          index={activeIndex}
          onClose={() => setActiveIndex(null)}
          onIndexChange={setActiveIndex}
        />
      )}
    </div>
  );
}
