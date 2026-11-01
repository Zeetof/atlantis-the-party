import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, ListMusic, ShieldAlert } from "lucide-react";
import {
  AdminButton,
  AdminCheckbox,
  AdminEmpty,
  AdminField,
  AdminFlash,
  AdminPanel,
  AdminSelect,
  StatusPill,
} from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { createSongAction, deleteSongAction, updateSongAction } from "@/app/admin/actions";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";

export const metadata: Metadata = { title: "Songs" };
export const dynamic = "force-dynamic";

const PLATFORM_OPTIONS = [
  { value: "Spotify", label: "Spotify" },
  { value: "Apple Music", label: "Apple Music" },
  { value: "YouTube", label: "YouTube" },
  { value: "SoundCloud", label: "SoundCloud" },
];

export default async function AdminSongsPage({
  searchParams,
}: {
  searchParams: { ok?: string; error?: string };
}) {
  const session = await requireAdmin();
  const songs = await prisma.tributeSong.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { cards: true } } },
  });

  const approved = songs.filter((song) => song.approved);
  const verified = songs.filter((song) => song.approved && song.linkStatus === "VERIFIED");
  const canEdit = ["OWNER", "EDITOR"].includes(session.role);
  const canDelete = session.role === "OWNER";
  const returnTo = "/admin/songs";

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[8px] font-bold uppercase tracking-[0.24em] text-crimson">Tribute</p>
        <h1 className="mt-2 font-display text-3xl uppercase leading-none text-bone">
          Juice WRLD song rotation
        </h1>
        <p className="mt-2 max-w-2xl text-[11px] leading-5 text-bone/35">
          Cards receive an approved song deterministically from the claim ID. Only official streaming
          links belong here — no uploads, lyric sites or unofficial re-uploads.
        </p>
      </div>

      <AdminFlash ok={searchParams.ok} error={searchParams.error} />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Rotation pool", `${approved.length} approved`],
          ["Verified links", `${verified.length} confirmed`],
          ["Assigned cards", songs.reduce((sum, song) => sum + song._count.cards, 0)],
        ].map(([label, value]) => (
          <div key={label} className="border border-white/10 bg-[#0d0d0d] px-4 py-3">
            <p className="text-[8px] uppercase tracking-[0.18em] text-bone/30">{label}</p>
            <p className="mt-1 font-display text-xl text-bone">{value}</p>
          </div>
        ))}
      </div>

      {approved.length === 0 && (
        <div className="flex items-start gap-2 border border-amber-400/30 bg-amber-400/[0.05] p-4 text-[10px] leading-5 text-amber-100/60">
          <ShieldAlert size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
          Cards cannot be issued until at least one song is approved. Approve a track with a confirmed
          official link to continue.
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <AdminPanel
            title="Song pool"
            description="Order controls rotation sequencing. Assigned cards keep their song."
          >
            {songs.length === 0 ? (
              <AdminEmpty>No songs yet. Add the first approved tribute track.</AdminEmpty>
            ) : (
              <div className="divide-y divide-white/5">
                {songs.map((song, index) => (
                  <div key={song.id} className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display text-[10px] text-bone/25">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <p className="text-[12px] font-semibold text-bone/80">{song.title}</p>
                          <StatusPill status={song.approved ? "APPROVED" : "PENDING"} />
                          <StatusPill status={song.linkStatus} />
                        </div>
                        <p className="mt-1 text-[9px] text-bone/30">
                          {song.platform} · {song._count.cards} card
                          {song._count.cards === 1 ? "" : "s"} assigned
                        </p>
                        <a
                          href={song.officialUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex max-w-full items-center gap-1.5 truncate text-[9px] text-bone/40 hover:text-crimson"
                        >
                          <ExternalLink size={10} className="shrink-0" aria-hidden="true" />
                          <span className="truncate">{song.officialUrl}</span>
                        </a>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <details>
                          <summary className="cursor-pointer list-none border border-white/15 px-3 py-2 text-[8px] font-bold uppercase tracking-[0.12em] text-bone/50 hover:border-white/35 hover:text-bone/80">
                            Edit
                          </summary>
                          <form
                            action={updateSongAction}
                            className="mt-3 w-[min(88vw,420px)] space-y-3 border border-white/10 bg-ink p-4"
                          >
                            <input type="hidden" name="id" value={song.id} />
                            <input type="hidden" name="returnTo" value={returnTo} />
                            <AdminField label="Title" name="title" required defaultValue={song.title} />
                            <AdminField
                              label="Official URL"
                              name="officialUrl"
                              type="url"
                              required
                              defaultValue={song.officialUrl}
                            />
                            <div className="grid gap-3 sm:grid-cols-2">
                              <AdminSelect
                                label="Platform"
                                name="platform"
                                options={PLATFORM_OPTIONS}
                                defaultValue={song.platform}
                              />
                              <AdminSelect
                                label="Link status"
                                name="linkStatus"
                                options={[
                                  { value: "VERIFIED", label: "Verified official" },
                                  { value: "SEARCH_FALLBACK", label: "Search fallback" },
                                ]}
                                defaultValue={song.linkStatus}
                              />
                            </div>
                            <AdminCheckbox
                              label="Approved for card rotation"
                              name="approved"
                              defaultChecked={song.approved}
                              hint="Only approved songs can be assigned to new cards."
                            />
                            <AdminButton type="submit" disabled={!canEdit}>
                              Save song
                            </AdminButton>
                          </form>
                        </details>
                        {canDelete && (
                          <form action={deleteSongAction}>
                            <input type="hidden" name="id" value={song.id} />
                            <input type="hidden" name="returnTo" value={returnTo} />
                            <ConfirmButton
                              message={`Delete ${song.title}? Assigned cards will block deletion.`}
                              className="border border-crimson/30 px-3 py-2 text-[8px] font-bold uppercase tracking-[0.12em] text-crimson/70 transition-colors hover:bg-crimson/10"
                            >
                              Delete
                            </ConfirmButton>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AdminPanel>
        </div>

        <div className="space-y-5">
          <AdminPanel title="Add song" description="Added unapproved so you can verify the link first.">
            <form action={createSongAction} className="space-y-3 p-5">
              <input type="hidden" name="returnTo" value={returnTo} />
              <AdminField label="Title" name="title" required placeholder="Exact track title" />
              <AdminField
                label="Official URL"
                name="officialUrl"
                type="url"
                required
                placeholder="https://open.spotify.com/track/..."
                hint="Copy from the artist's official catalogue only."
              />
              <AdminSelect label="Platform" name="platform" options={PLATFORM_OPTIONS} />
              <AdminSelect
                label="Link status"
                name="linkStatus"
                options={[
                  { value: "SEARCH_FALLBACK", label: "Search fallback — not verified" },
                  { value: "VERIFIED", label: "Verified official" },
                ]}
              />
              <AdminCheckbox
                label="Approve immediately"
                name="approved"
                hint="Leave unchecked until the link is checked."
              />
              <AdminButton type="submit" className="w-full" disabled={!canEdit}>
                Add song
              </AdminButton>
            </form>
          </AdminPanel>

          <AdminPanel title="Assignment rules">
            <ul className="space-y-2 p-5 text-[9px] leading-4 text-bone/30">
              <li>Each card receives exactly one song at issuance.</li>
              <li>Assignment is deterministic per claim — no random re-assignment.</li>
              <li>Changing the rotation affects new cards only.</li>
              <li>SEARCH_FALLBACK cards show a search link until a verified URL is added.</li>
            </ul>
          </AdminPanel>

          <AdminPanel title="Rights reminder" tone="danger">
            <div className="flex items-start gap-2 p-5 text-[9px] leading-4 text-bone/35">
              <ShieldAlert size={12} className="mt-0.5 shrink-0 text-crimson/70" aria-hidden="true" />
              Use official streaming links only. Do not upload recordings, embed lyrics or imply an
              affiliation with the artist or estate.
            </div>
          </AdminPanel>

          <AdminPanel title="Cards">
            <div className="p-5">
              <Link href="/admin/cards" className="link-arrow text-bone/45">
                <ListMusic size={11} aria-hidden="true" /> Review issued cards
              </Link>
            </div>
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}
