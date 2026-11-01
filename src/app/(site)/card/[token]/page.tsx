import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  Info,
  LockKeyhole,
  Music2,
  ShieldCheck,
} from "lucide-react";
import { CardActions } from "@/components/tribute/card-actions";
import { TributeArtwork } from "@/components/tribute/artwork";
import { ActionLink, TicketLink } from "@/components/ui/buttons";
import { getCardByToken } from "@/server/claims";
import { formatEventDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Your 999 card",
  description: "Private Atlantis 999 tribute card.",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

type PageProps = { params: { token: string } };

function InvalidLink({ expired }: { expired: boolean }) {
  return (
    <section className="section-pad">
      <div className="shell">
        <div className="mx-auto max-w-2xl border border-white/15 bg-[#0b0b0b] p-8 sm:p-12">
          <p className="eyebrow">{expired ? "Link expired" : "Link not recognised"}</p>
          <h1 className="mt-6 font-display text-[clamp(2.4rem,6vw,4.2rem)] uppercase leading-[0.9] text-bone">
            {expired ? "This private link has expired" : "This card link is not valid"}
          </h1>
          <p className="mt-5 text-sm leading-7 text-bone/55">
            {expired
              ? "Card links are time-limited for privacy. The card itself is not lost — the organizer can generate a fresh private link for the verified ticket holder."
              : "The address may be incomplete or the link may have been rotated. Check that you copied the full link from your email, or contact the organizer."}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ActionLink href="/contact" variant="light" size="md">
              Contact the organizer
            </ActionLink>
            <ActionLink href="/999-experience" variant="outline" size="md">
              About the 999 experience
            </ActionLink>
          </div>
          <p className="mt-8 flex items-start gap-2 border-t border-white/10 pt-5 text-[10px] leading-5 text-bone/30">
            <LockKeyhole size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
            Never post a private card link publicly. Links can be rotated from the organizer
            dashboard if they are exposed.
          </p>
        </div>
      </div>
    </section>
  );
}

export default async function CardPage({ params }: PageProps) {
  const result = await getCardByToken(decodeURIComponent(params.token));

  if (result.status !== "ok") {
    return <InvalidLink expired={result.status === "expired"} />;
  }

  const card = result.card;
  const eventDate = card.claim.event.eventDate;
  const linkVerified = card.song.linkStatus === "VERIFIED";

  return (
    <>
      <section className="grain border-b border-white/10 pb-12 pt-28 sm:pt-32">
        <div className="shell">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/999-experience" className="link-arrow text-bone/50">
              <ArrowLeft size={13} aria-hidden="true" /> The 999 experience
            </Link>
            <span className="inline-flex items-center gap-2 border border-white/15 px-3 py-1.5 text-[8px] font-semibold uppercase tracking-[0.2em] text-bone/45">
              <LockKeyhole size={11} aria-hidden="true" /> Private link
            </span>
          </div>

          <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <CardActions
                token={decodeURIComponent(params.token)}
                displayName={card.displayName}
                cardNumber={card.cardNumber}
                songTitle={card.song.title}
                songUrl={card.song.officialUrl}
                linkStatus={card.song.linkStatus}
              />
            </div>

            <div className="lg:col-span-6 lg:pt-6">
              <p className="eyebrow">Issued · Atlantis 4.0</p>
              <h1 className="mt-6 font-display text-[clamp(3.2rem,8vw,6rem)] uppercase leading-[0.84] text-bone">
                999
                <span className="mt-2 block font-editorial text-[0.42em] italic leading-none text-crimson">
                  forever in the music
                </span>
              </h1>
              <p className="mt-6 max-w-md text-sm leading-7 text-bone/55">
                {card.displayName}, this card is yours. It is one of the numbered remembrance cards
                issued for Atlantis 4.0, carrying a single approved song and the date of the party.
              </p>

              <dl className="mt-8 divide-y divide-white/10 border-y border-white/10">
                <div className="flex items-start gap-4 py-4">
                  <Music2 size={15} className="mt-0.5 shrink-0 text-crimson" aria-hidden="true" />
                  <dt className="w-24 shrink-0 text-[9px] font-semibold uppercase tracking-[0.2em] text-bone/35">
                    Song
                  </dt>
                  <dd className="min-w-0">
                    <p className="text-sm text-bone/80">{card.song.title}</p>
                    <a
                      href={card.song.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-crimson hover:underline"
                    >
                      {linkVerified ? "Listen on the official platform" : "Search this song on Spotify"}
                      <ExternalLink size={10} aria-hidden="true" />
                    </a>
                    {!linkVerified && (
                      <p className="mt-1 text-[9px] leading-4 text-bone/25">
                        The exact track link is pending organizer verification; this opens a search
                        on the official platform.
                      </p>
                    )}
                  </dd>
                </div>
                <div className="flex items-start gap-4 py-4">
                  <ShieldCheck size={15} className="mt-0.5 shrink-0 text-crimson" aria-hidden="true" />
                  <dt className="w-24 shrink-0 text-[9px] font-semibold uppercase tracking-[0.2em] text-bone/35">
                    Card no.
                  </dt>
                  <dd className="font-mono text-[11px] tracking-[0.1em] text-bone/75">
                    {card.cardNumber}
                  </dd>
                </div>
                <div className="flex items-start gap-4 py-4">
                  <CalendarDays size={15} className="mt-0.5 shrink-0 text-crimson" aria-hidden="true" />
                  <dt className="w-24 shrink-0 text-[9px] font-semibold uppercase tracking-[0.2em] text-bone/35">
                    Event
                  </dt>
                  <dd className="text-sm text-bone/75">{formatEventDate(eventDate)}</dd>
                </div>
                <div className="flex items-start gap-4 py-4">
                  <LockKeyhole size={15} className="mt-0.5 shrink-0 text-crimson" aria-hidden="true" />
                  <dt className="w-24 shrink-0 text-[9px] font-semibold uppercase tracking-[0.2em] text-bone/35">
                    Link expires
                  </dt>
                  <dd className="text-sm text-bone/75">{formatEventDate(card.tokenExpiresAt)}</dd>
                </div>
              </dl>

              <div className="mt-6 flex items-start gap-2 text-[10px] leading-5 text-bone/30">
                <Info size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
                Keep this link private. Anyone with the link can view this card. If it is exposed,
                ask the organizer to rotate it — the old link stops working.
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ActionLink href="/event" variant="outline" size="md">
                  Atlantis 4.0 details
                </ActionLink>
                <TicketLink size="md" variant="dark">
                  Share the party
                </TicketLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="shell">
          <div className="grid gap-8 border border-white/10 bg-[#0a0a0a] p-6 sm:p-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-8">
              <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-crimson">
                About this tribute
              </p>
              <p className="mt-3 max-w-2xl text-[11px] leading-6 text-bone/45">
                The 999 experience is an independent Atlantis remembrance project created with
                original artwork. It contains no album art, lyrics or recordings, and it is not
                affiliated with, endorsed by, or sponsored by Juice WRLD's estate. One card is issued
                per verified ticket.
              </p>
            </div>
            <div className="relative mx-auto w-32 lg:col-span-4 lg:ml-auto lg:mr-0">
              <TributeArtwork compact />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
