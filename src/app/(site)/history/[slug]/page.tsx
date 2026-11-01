import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Info,
  MapPin,
  ShieldAlert,
} from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { GalleryExplorer } from "@/components/gallery/gallery-explorer";
import { VideoGallery } from "@/components/gallery/video-gallery";
import type { GalleryItem } from "@/components/gallery/types";
import { LineupExplorer } from "@/components/lineup/lineup-explorer";
import type { PerformerView } from "@/components/lineup/performer-card";
import { ActionLink, TicketLink } from "@/components/ui/buttons";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { EDITION_DETAILS } from "@/content/edition-details";
import { prisma } from "@/server/db";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = { params: { slug: string } };

const SLUGS = ["atlantis-1", "atlantis-2", "atlantis-3"];

function statusLabel(status: string) {
  if (status === "FLAGGED") return "Date under review";
  if (status === "YEAR_TO_CONFIRM") return "Year to be confirmed";
  return "Confirmed";
}

function toGalleryItems(
  media: {
    id: string;
    type: string;
    src: string | null;
    poster: string | null;
    caption: string;
    width: number | null;
    height: number | null;
    durationSeconds: number | null;
  }[],
  edition: { slug: string; name: string },
): GalleryItem[] {
  return media
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
      editionSlug: edition.slug,
      editionName: edition.name,
    }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  if (params.slug === "atlantis-4") {
    return { title: "Atlantis 4.0", alternates: { canonical: "/event" } };
  }
  const edition = await prisma.edition.findUnique({ where: { slug: params.slug } });
  if (!edition) return { title: "Edition not found" };

  return {
    title: `${edition.name} — ${edition.label}`,
    description: `${edition.description} ${edition.dateDisplay}.`,
    alternates: { canonical: `/history/${edition.slug}` },
    openGraph: {
      title: `${edition.name} — ${edition.label}`,
      description: edition.description,
      images: edition.coverImage ? [{ url: edition.coverImage }] : undefined,
    },
  };
}

export default async function EditionPage({ params }: PageProps) {
  if (params.slug === "atlantis-4") {
    redirect("/event");
  }
  if (!SLUGS.includes(params.slug)) {
    notFound();
  }

  const edition = await prisma.edition.findUnique({
    where: { slug: params.slug },
    include: {
      media: {
        where: { status: "APPROVED" },
        orderBy: { sortOrder: "asc" },
      },
      performers: {
        orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
      },
    },
  });

  if (!edition) notFound();

  const details = EDITION_DETAILS[edition.slug];
  const allEditions = await prisma.edition.findMany({ orderBy: { sortOrder: "asc" } });
  const currentIndex = allEditions.findIndex((item) => item.slug === edition.slug);
  const previous = currentIndex > 0 ? allEditions[currentIndex - 1] : null;
  const next = currentIndex < allEditions.length - 1 ? allEditions[currentIndex + 1] : null;

  const videos = edition.media.filter((item) => item.type === "VIDEO");
  const images = edition.media.filter(
    (item) => item.type === "IMAGE" && item.key !== `${edition.slug}-flyer`,
  );
  const galleryItems = toGalleryItems(images, edition);
  const videoItems = toGalleryItems(videos, edition);

  const performers: PerformerView[] = edition.performers.map((performer) => ({
    id: performer.id,
    name: performer.name,
    category: performer.category,
    imagePath: performer.imagePath,
    bio: performer.bio,
    socials: performer.socials,
    status: performer.status,
    featured: performer.featured,
  }));

  const isFlagged = edition.dateStatus === "FLAGGED";
  const yearUnknown = edition.dateStatus === "YEAR_TO_CONFIRM";
  const isSecond = edition.slug === "atlantis-2";
  const isThird = edition.slug === "atlantis-3";

  return (
    <>
      <PageHero
        eyebrow={`${edition.label} · Atlantis archive`}
        title={edition.name}
        accent={details.highlight}
        description={edition.description}
        image={
          edition.coverImage
            ? { src: edition.coverImage, alt: `${edition.name} official flyer` }
            : undefined
        }
        meta={[
          { label: "Date", value: edition.dateDisplay },
          { label: "Time", value: details.time },
          { label: "Venue", value: edition.venue ?? "Ikeja, Lagos" },
        ]}
      >
        <ActionLink href="/history" variant="outline" size="lg">
          <ArrowLeft size={14} aria-hidden="true" className="mr-1" />
          All editions
        </ActionLink>
        <ActionLink href="/gallery" variant="light" size="lg">
          The full gallery
        </ActionLink>
      </PageHero>

      <section className="border-b border-white/10 bg-[#0a0a0a]">
        <div className="shell flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "border px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.16em]",
                isFlagged
                  ? "border-crimson/45 text-crimson"
                  : "border-white/15 text-bone/45",
              )}
            >
              {statusLabel(edition.dateStatus)}
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-bone/30">
              Archive record · preserved as supplied
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-bone/30">
            {performers.length > 0
              ? `${performers.length} archived names`
              : `${edition.media.length} archived media items`}
          </p>
        </div>
      </section>

      {(isFlagged || yearUnknown) && (
        <section className="border-b border-white/10">
          <div className="shell py-6">
            <div
              className={cn(
                "flex flex-col gap-4 border p-5 sm:flex-row sm:items-start",
                isFlagged ? "border-crimson/35 bg-crimson/[0.05]" : "border-white/12 bg-white/[0.02]",
              )}
            >
              {isFlagged ? (
                <ShieldAlert size={18} className="mt-0.5 shrink-0 text-crimson" aria-hidden="true" />
              ) : (
                <Info size={18} className="mt-0.5 shrink-0 text-bone/40" aria-hidden="true" />
              )}
              <div>
                <p
                  className={cn(
                    "text-[9px] font-bold uppercase tracking-[0.2em]",
                    isFlagged ? "text-crimson" : "text-bone/50",
                  )}
                >
                  {isFlagged ? "Date conflict — flagged for review" : "Year to be confirmed"}
                </p>
                <p className="mt-2 max-w-3xl text-[11px] leading-6 text-bone/50">
                  {isFlagged
                    ? "The organizer dates this edition August 19, while the supplied flyer reads AUG 18. Both records are preserved here and the conflict is flagged in the organizer dashboard. The date will be published once resolved — no date has been silently chosen."
                    : "The supplied flyer does not print a year. The month and day above are transcribed exactly; the year is not assumed and will be confirmed by the organizer."}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="section-pad">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-14">
          <Reveal className="lg:col-span-7">
            <SectionHeading
              eyebrow="The record"
              title="What this edition was"
              accent={edition.label}
              description="Details below are transcribed from the organizer-supplied flyer. Historic prices are shown for context only and are not Atlantis 4.0 prices."
            />

            <dl className="mt-10 divide-y divide-white/10 border-y border-white/10">
              {[
                { icon: CalendarDays, label: "Date", value: edition.dateDisplay },
                { icon: Clock3, label: "Time", value: details.time },
                { icon: MapPin, label: "Venue", value: edition.venue ?? "Ikeja, Lagos" },
              ].map((row) => (
                <div key={row.label} className="flex items-start gap-4 py-4">
                  <row.icon size={16} className="mt-0.5 shrink-0 text-crimson" aria-hidden="true" />
                  <dt className="w-20 shrink-0 text-[9px] font-semibold uppercase tracking-[0.2em] text-bone/35">
                    {row.label}
                  </dt>
                  <dd className="text-sm leading-6 text-bone/80">{row.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8">
              <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-bone/35">
                In the room
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {details.features.map((feature) => (
                  <li key={feature} className="chip">
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-8 flex items-start gap-2 text-[10px] leading-5 text-bone/30">
              <Info size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
              {details.source}
            </p>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-5">
            <div className="border border-white/10 bg-white/[0.02]">
              <div className="border-b border-white/10 px-5 py-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-crimson">
                  Historic pricing
                </p>
                <p className="mt-1.5 text-[10px] leading-5 text-bone/35">
                  Archived for reference. Not current ticket prices.
                </p>
              </div>

              <div className="divide-y divide-white/10">
                <div className="p-5">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-bone/30">
                    Online
                  </p>
                  <div className="mt-3 space-y-2.5">
                    {details.online.map((tier) => (
                      <div key={tier.name} className="flex items-baseline justify-between gap-4">
                        <span className="text-sm text-bone/75">{tier.name}</span>
                        <span className="font-display text-xl text-bone">{tier.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-bone/30">
                    At the gate
                  </p>
                  <div className="mt-3 space-y-2.5">
                    {details.gate.map((tier) => (
                      <div key={tier.name} className="flex items-baseline justify-between gap-4">
                        <span className="text-sm text-bone/75">{tier.name}</span>
                        <span className="font-display text-xl text-bone">{tier.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 p-5">
                <p className="text-[10px] leading-5 text-bone/35">
                  Looking for the next edition? Atlantis 4.0 runs December 30, 2026 at Watercress
                  Event Center.
                </p>
                <div className="mt-4">
                  <TicketLink size="sm" className="w-full">
                    Atlantis 4.0 tickets
                  </TicketLink>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {isSecond && (
        <section className="section-pad border-y border-white/10 bg-[#0a0a0a]">
          <div className="shell">
            <Reveal>
              <div className="flex flex-col gap-5 border border-crimson/30 bg-crimson/[0.05] p-5 sm:flex-row sm:items-start">
                <Info size={16} className="mt-0.5 shrink-0 text-crimson" aria-hidden="true" />
                <p className="max-w-3xl text-[11px] leading-6 text-bone/55">
                  <span className="font-semibold uppercase tracking-[0.14em] text-crimson">
                    Historic lineup · 2.0 only.{" "}
                  </span>
                  These names performed at the second edition and are not announced for Atlantis 4.0.
                  No performer has been carried over or invented for the next edition.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.08} className="mt-10">
              <SectionHeading
                eyebrow="The lineup"
                title="Atlantis 2.0"
                accent="twenty-five names"
                description="Artists, hypemen, DJs and guest appearances transcribed from the supplied lineup flyer. Names and spellings are preserved pending organizer proofreading."
              />
            </Reveal>

            <Reveal delay={0.12} className="mt-10">
              {performers.length > 0 ? (
                <LineupExplorer performers={performers} historic />
              ) : (
                <p className="text-sm text-bone/50">The lineup archive is being restored.</p>
              )}
            </Reveal>
          </div>
        </section>
      )}

      {isThird && (
        <section className="section-pad border-y border-white/10 bg-[#0a0a0a]">
          <div className="shell">
            <Reveal>
              <SectionHeading
                eyebrow="From the room"
                title="3.0 in motion"
                accent="organizer footage"
                description="Short highlight clips and stills supplied by the organizer as Atlantis 3.0 footage. Every clip keeps its edition assignment."
              />
            </Reveal>

            <Reveal delay={0.08} className="mt-10">
              {videoItems.length > 0 ? (
                <VideoGallery items={videoItems} editionName="Atlantis 3.0" />
              ) : (
                <p className="border border-white/10 p-8 text-sm text-bone/50">
                  The video archive is being restored.
                </p>
              )}
            </Reveal>

            <Reveal delay={0.12} className="mt-8">
              <div className="flex flex-col gap-3 border border-white/12 bg-white/[0.02] p-5 sm:flex-row sm:items-start">
                <ShieldAlert size={15} className="mt-0.5 shrink-0 text-bone/40" aria-hidden="true" />
                <p className="text-[10px] leading-5 text-bone/40">
                  One additional 3.7-second clip supplied with this batch is held in private review
                  and is not published. It stays out of the public gallery until the organizer
                  approves it in the admin dashboard.
                </p>
              </div>
            </Reveal>

            {galleryItems.length > 0 && (
              <Reveal delay={0.16} className="mt-14">
                <h3 className="font-display text-2xl uppercase tracking-[0.02em] text-bone">
                  Stills from 3.0
                </h3>
                <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-bone/30">
                  {galleryItems.length} approved images
                </p>
                <div className="mt-6">
                  <GalleryExplorer
                    items={galleryItems}
                    showEditionFilter={false}
                    showTypeFilter={false}
                  />
                </div>
              </Reveal>
            )}
          </div>
        </section>
      )}

      {isSecond && galleryItems.length > 0 && (
        <section className="section-pad">
          <div className="shell">
            <Reveal>
              <SectionHeading
                eyebrow="Artwork"
                title="The 2.0 paper trail"
                accent="flyer and promos"
                description="The Christmas edition flyer, the lineup flyer and the two performer promos, preserved at their original edition."
              />
            </Reveal>
            <Reveal delay={0.08} className="mt-10">
              <GalleryExplorer
                items={galleryItems}
                showEditionFilter={false}
                showTypeFilter={false}
              />
            </Reveal>
          </div>
        </section>
      )}

      {!isSecond && !isThird && galleryItems.length > 0 && (
        <section className="section-pad border-t border-white/10">
          <div className="shell">
            <Reveal>
              <SectionHeading
                eyebrow="Artwork"
                title="The original flyer"
                accent="as supplied"
                description="The first Atlantis flyer, kept intact. No elements have been redrawn or reassigned."
              />
            </Reveal>
            <Reveal delay={0.08} className="mt-10">
              <GalleryExplorer
                items={galleryItems}
                showEditionFilter={false}
                showTypeFilter={false}
              />
            </Reveal>
          </div>
        </section>
      )}

      <section className="border-t border-white/10 bg-[#0a0a0a]">
        <div className="shell py-12">
          <div className="grid gap-4 sm:grid-cols-2">
            {previous ? (
              <Link
                href={previous.slug === "atlantis-4" ? "/event" : `/history/${previous.slug}`}
                className="group flex items-center justify-between gap-4 border border-white/10 p-5 transition-colors hover:border-white/30"
              >
                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-bone/30">Previous</p>
                  <p className="mt-1.5 font-display text-xl uppercase text-bone/80 group-hover:text-bone">
                    {previous.name}
                  </p>
                </div>
                <ArrowLeft size={16} className="shrink-0 text-bone/35" aria-hidden="true" />
              </Link>
            ) : (
              <div aria-hidden="true" className="hidden sm:block" />
            )}

            {next && (
              <Link
                href={next.slug === "atlantis-4" ? "/event" : `/history/${next.slug}`}
                className="group flex items-center justify-between gap-4 border border-white/10 p-5 text-right transition-colors hover:border-white/30"
              >
                <ArrowRight
                  size={16}
                  className="shrink-0 text-bone/35"
                  aria-hidden="true"
                />
                <div className="ml-auto">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-bone/30">Next</p>
                  <p className="mt-1.5 font-display text-xl uppercase text-bone/80 group-hover:text-bone">
                    {next.name}
                  </p>
                </div>
              </Link>
            )}
          </div>

          <div className="mt-8 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <Image
                src="/media/images/atlantis-4-flyer.webp"
                alt=""
                width={48}
                height={60}
                className="border border-white/10 object-cover"
              />
              <div>
                <p className="font-editorial text-xl italic text-bone/70">
                  The story continues at 4.0.
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-bone/30">
                  December 30, 2026 · Watercress Event Center
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ActionLink href="/event" variant="outline" size="sm">
                Atlantis 4.0 details
              </ActionLink>
              <TicketLink size="sm">Get tickets</TicketLink>
            </div>
          </div>
        </div>
      </section>

      <div className="shell py-8">
        <p className="flex items-center gap-2 text-[10px] leading-5 text-bone/25">
          <ArrowUpRight size={12} aria-hidden="true" />
          Archive media is displayed only for its original edition. Historic prices do not apply to
          Atlantis 4.0.
        </p>
      </div>
    </>
  );
}
