import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Clock3, Info } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { LineupExplorer } from "@/components/lineup/lineup-explorer";
import { ActionLink, TicketLink } from "@/components/ui/buttons";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { prisma } from "@/server/db";

export const metadata: Metadata = {
  title: "Lineup",
  description:
    "Atlantis 4.0 lineup reveal and the historic Atlantis 2.0 lineup archive. Previous-edition performers are not confirmed for 4.0.",
  alternates: { canonical: "/lineup" },
};

export const dynamic = "force-dynamic";

export default async function LineupPage() {
  const [current, archived] = await Promise.all([
    prisma.performer.findMany({
      where: { edition: { slug: "atlantis-4" }, status: "CONFIRMED" },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    }),
    prisma.performer.findMany({
      where: { edition: { slug: "atlantis-2" } },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    }),
  ]);

  const currentView = current.map((performer) => ({
    id: performer.id,
    name: performer.name,
    category: performer.category,
    imagePath: performer.imagePath,
    bio: performer.bio,
    socials: performer.socials,
    status: performer.status,
    featured: performer.featured,
  }));

  const archiveView = archived.map((performer) => ({
    id: performer.id,
    name: performer.name,
    category: performer.category,
    imagePath: performer.imagePath,
    bio: performer.bio,
    socials: performer.socials,
    status: performer.status,
    featured: performer.featured,
  }));

  return (
    <>
      <PageHero
        eyebrow="Atlantis 4.0"
        title="The lineup"
        accent="reveal in progress"
        description="Only confirmed performers are published for Atlantis 4.0. The supplied lineup flyer belongs to Atlantis 2.0 and is preserved below as an archive."
        meta={[
          { label: "Confirmed", value: `${current.length} performer${current.length === 1 ? "" : "s"}` },
          { label: "Archive", value: "Atlantis 2.0 · 25 names" },
          { label: "Status", value: "4.0 lineup to be announced" },
        ]}
      >
        <TicketLink size="lg">Get tickets</TicketLink>
        <ActionLink href="#archive" variant="outline" size="lg">
          View the 2.0 archive
        </ActionLink>
      </PageHero>

      <section className="section-pad">
        <div className="shell">
          {currentView.length > 0 ? (
            <>
              <Reveal>
                <SectionHeading
                  eyebrow="Current edition"
                  title="Confirmed for 4.0"
                  accent="Detty December"
                  description="These performers have been confirmed by the organizer. More names may be added as confirmations are completed."
                />
              </Reveal>
              <Reveal delay={0.08} className="mt-10">
                <LineupExplorer performers={currentView} />
              </Reveal>
            </>
          ) : (
            <div className="relative overflow-hidden border border-white/10 bg-[#0c0c0c]">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-10 select-none font-display text-[18rem] leading-none text-white/[0.025]"
              >
                04
              </span>
              <div className="relative grid gap-10 p-7 sm:p-10 lg:grid-cols-2 lg:p-14">
                <div>
                  <p className="eyebrow">Current edition</p>
                  <h2 className="mt-6 font-display text-[clamp(2.8rem,6vw,5.4rem)] uppercase leading-[0.86] text-bone">
                    Lineup reveal
                    <br />
                    <span className="text-chrome">coming soon</span>
                  </h2>
                  <p className="mt-6 max-w-md text-sm leading-7 text-bone/55">
                    No 4.0 performers have been published yet. When confirmations land, they appear
                    here by category — artists, DJs, hypemen and guest appearances.
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <TicketLink size="md">Get tickets</TicketLink>
                    <a
                      href="#archive"
                      className="inline-flex items-center justify-between gap-3 border border-white/15 px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-bone/65 transition-colors hover:border-crimson hover:text-crimson"
                    >
                      See the 2.0 archive <ArrowDown size={14} aria-hidden="true" />
                    </a>
                  </div>
                  <div className="mt-8 flex items-start gap-2 border-t border-white/10 pt-5 text-[10px] leading-5 text-bone/30">
                    <Clock3 size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                    Names are published only after organizer confirmation. No old-lineup names are
                    reused for 4.0.
                  </div>
                </div>

                <div className="grid gap-3">
                  {[
                    ["Artists", "TBA", "Main-stage names, to be announced"],
                    ["DJs", "TBA", "Selectors for the room, to be announced"],
                    ["Hypemen", "TBA", "Hosts and energy, to be announced"],
                    ["Guest appearances", "TBA", "Special guests, to be announced"],
                  ].map(([category, status, copy], index) => (
                    <div
                      key={category}
                      className="group flex items-center justify-between gap-4 border border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-crimson/30"
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-display text-lg text-bone/20">
                          0{index + 1}
                        </span>
                        <div>
                          <p className="font-display text-xl uppercase leading-none text-bone/85">
                            {category}
                          </p>
                          <p className="mt-1.5 text-[10px] text-bone/30">{copy}</p>
                        </div>
                      </div>
                      <span className="border border-crimson/35 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.18em] text-crimson">
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="archive" className="section-pad border-y border-white/10 bg-[#0a0a0a]">
        <div className="shell">
          <Reveal>
            <div className="border border-crimson/30 bg-crimson/[0.05] p-5 sm:p-6">
              <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-crimson">
                <Info size={14} aria-hidden="true" /> Historic archive · not the 4.0 lineup
              </p>
              <p className="mt-2 max-w-3xl text-[11px] leading-5 text-bone/50">
                The names below are transcribed from the Atlantis 2.0 lineup flyer. They performed
                at the second edition, not at Atlantis 4.0. Names and spellings are preserved from
                the flyer and can be corrected by the organizer in the admin dashboard.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="mt-10">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <SectionHeading
                eyebrow="The archive"
                title="Atlantis 2.0"
                accent="December 29 · Christmas edition"
                description="Twenty-five credited artists, hypemen, DJs and guest appearances from the second edition."
              />
              <Link href="/history/atlantis-2" className="link-arrow shrink-0 text-bone/60">
                Atlantis 2.0 story <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.12} className="mt-10">
            {archiveView.length > 0 ? (
              <LineupExplorer performers={archiveView} historic />
            ) : (
              <p className="text-sm text-bone/50">The 2.0 archive is being restored.</p>
            )}
          </Reveal>
        </div>
      </section>

      <section className="py-16">
        <div className="shell flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="font-editorial text-2xl italic text-bone/70">
              Be in the room when the 4.0 names drop.
            </p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-bone/30">
              Official tickets via Popout Tickets
            </p>
          </div>
          <TicketLink size="lg">Secure your spot</TicketLink>
        </div>
      </section>
    </>
  );
}
