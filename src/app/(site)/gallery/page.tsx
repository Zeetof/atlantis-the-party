import type { Metadata } from "next";
import { Info, ShieldAlert } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { GalleryExplorer } from "@/components/gallery/gallery-explorer";
import type { GalleryItem } from "@/components/gallery/types";
import { ActionLink, TicketLink } from "@/components/ui/buttons";
import { Reveal } from "@/components/ui/reveal";
import { prisma } from "@/server/db";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Approved Atlantis archive media — flyers, performer promos, Atlantis 3.0 highlight clips and stills, kept with their original editions.",
  alternates: { canonical: "/gallery" },
  openGraph: {
    title: "The Atlantis gallery",
    description:
      "Flyers, promos and Atlantis 3.0 footage from the organizer archive. Approved media only.",
    images: [{ url: "/og-atlantis.jpg" }],
  },
};

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const media = await prisma.media.findMany({
    where: { status: "APPROVED", src: { not: null } },
    include: { edition: true },
    orderBy: [{ edition: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });

  const items: GalleryItem[] = media
    .filter((item): item is typeof item & { src: string } => Boolean(item.src))
    .map((item) => ({
      id: item.id,
      type: item.type === "VIDEO" ? "VIDEO" : "IMAGE",
      src: item.src,
      poster: item.poster,
      caption: item.caption,
      width: item.width,
      height: item.height,
      durationSeconds: item.durationSeconds,
      editionSlug: item.edition.slug,
      editionName: item.edition.name,
    }));

  const images = items.filter((item) => item.type === "IMAGE").length;
  const videos = items.filter((item) => item.type === "VIDEO").length;
  const editions = new Set(items.map((item) => item.editionSlug)).size;

  return (
    <>
      <PageHero
        eyebrow="The archive"
        title="The gallery"
        accent="the record in frames"
        description="Every approved flyer, promo and highlight clip from the Atlantis archive. Media is grouped by its original edition — nothing is reassigned for the next party."
        meta={[
          { label: "Photographs", value: String(images) },
          { label: "Videos", value: String(videos) },
          { label: "Editions", value: String(editions) },
        ]}
      >
        <ActionLink href="/history" variant="outline" size="lg">
          Explore the history
        </ActionLink>
        <TicketLink size="lg">Atlantis 4.0 tickets</TicketLink>
      </PageHero>

      <section className="section-pad">
        <div className="shell">
          <Reveal>
            <div className="flex flex-col gap-4 border border-white/10 bg-white/[0.02] p-5 sm:flex-row sm:items-start">
              <Info size={15} className="mt-0.5 shrink-0 text-crimson" aria-hidden="true" />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-crimson">
                  Approved media only
                </p>
                <p className="mt-2 max-w-3xl text-[11px] leading-6 text-bone/45">
                  This gallery publishes organizer-approved assets. Clips and photographs awaiting
                  review are withheld from the public site. The Atlantis 2.0 lineup flyer appears
                  here as history, not as the Atlantis 4.0 lineup.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="mt-10">
            <GalleryExplorer items={items} />
          </Reveal>

          <Reveal delay={0.12} className="mt-10">
            <div className="flex flex-col gap-4 border border-crimson/25 bg-crimson/[0.04] p-5 sm:flex-row sm:items-start">
              <ShieldAlert size={15} className="mt-0.5 shrink-0 text-crimson" aria-hidden="true" />
              <p className="text-[10px] leading-5 text-bone/45">
                One short Atlantis 3.0 clip is held back from publication while identity and consent
                are confirmed. It remains in private storage and is not served anywhere on the
                public site.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-white/10 bg-bone text-ink">
        <div className="shell flex flex-col items-start justify-between gap-6 py-14 sm:flex-row sm:items-center">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-ink/45">
              Make the next frame
            </p>
            <p className="mt-3 font-display text-[clamp(2rem,4vw,3.4rem)] uppercase leading-[0.95]">
              Atlantis 4.0
              <span className="ml-3 font-editorial text-[0.6em] italic text-ink/55">
                December 30, 2026
              </span>
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ActionLink
              href="/event"
              variant="outline"
              size="md"
              className="border-ink/20 text-ink hover:border-crimson"
            >
              Event details
            </ActionLink>
            <TicketLink size="md">Get tickets</TicketLink>
          </div>
        </div>
      </section>
    </>
  );
}
