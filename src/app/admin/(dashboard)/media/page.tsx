import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Film, ImageOff, Lock, ShieldAlert, Upload } from "lucide-react";
import {
  AdminButton,
  AdminEmpty,
  AdminField,
  AdminFlash,
  AdminPanel,
  AdminSelect,
  AdminTextarea,
  StatusPill,
} from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import {
  updateMediaCaptionAction,
  updateMediaStatusAction,
  uploadMediaAction,
} from "@/app/admin/actions";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Media" };
export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "HIDDEN", label: "Hidden" },
] as const;

const STATUS_ACTIONS: Record<string, { label: string; status: string }[]> = {
  PENDING: [
    { label: "Approve", status: "APPROVED" },
    { label: "Reject", status: "REJECTED" },
  ],
  APPROVED: [{ label: "Hide", status: "HIDDEN" }],
  REJECTED: [{ label: "Approve", status: "APPROVED" }],
  HIDDEN: [{ label: "Approve", status: "APPROVED" }],
};

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: { ok?: string; error?: string; status?: string };
}) {
  const session = await requireAdmin();

  const filter = FILTERS.some((entry) => entry.value === searchParams.status)
    ? (searchParams.status as string)
    : "ALL";

  const [media, editions] = await Promise.all([
    prisma.media.findMany({
      where: filter === "ALL" ? {} : { status: filter },
      orderBy: [{ edition: { sortOrder: "asc" } }, { sortOrder: "asc" }],
      include: { edition: { select: { label: true, slug: true } } },
    }),
    prisma.edition.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, label: true } }),
  ]);

  const counts = await prisma.media.groupBy({ by: ["status"], _count: { _all: true } });
  const countFor = (status: string) =>
    status === "ALL"
      ? counts.reduce((sum, row) => sum + row._count._all, 0)
      : (counts.find((row) => row.status === status)?._count._all ?? 0);

  const canEdit = ["OWNER", "EDITOR"].includes(session.role);
  const returnTo = `/admin/media${filter === "ALL" ? "" : `?status=${filter}`}`;
  const privateHeld = media.filter((item) => item.storagePath && !item.src);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[8px] font-bold uppercase tracking-[0.24em] text-crimson">Content</p>
        <h1 className="mt-2 font-display text-3xl uppercase leading-none text-bone">Media</h1>
        <p className="mt-2 max-w-2xl text-[11px] leading-5 text-bone/35">
          Approving private media copies it into the public web root. Nothing held outside
          <span className="font-mono text-bone/55"> storage/private</span> can be published here.
        </p>
      </div>

      <AdminFlash ok={searchParams.ok} error={searchParams.error} />

      {privateHeld.length > 0 && (
        <div className="flex items-start gap-2 border border-crimson/30 bg-crimson/[0.05] p-4 text-[10px] leading-5 text-[#ff8a86]">
          <Lock size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
          {privateHeld.length} item{privateHeld.length === 1 ? "" : "s"} held in private storage and
          not publicly served. Approving copies the file into the public media library — publish only
          with explicit organizer consent for the subject.
        </div>
      )}

      <nav className="flex flex-wrap gap-2" aria-label="Media status">
        {FILTERS.map((entry) => (
          <Link
            key={entry.value}
            href={entry.value === "ALL" ? "/admin/media" : `/admin/media?status=${entry.value}`}
            aria-current={filter === entry.value ? "page" : undefined}
            className={cn(
              "border px-3 py-2 text-[9px] font-bold uppercase tracking-[0.14em] transition-colors",
              filter === entry.value
                ? "border-crimson bg-crimson/10 text-crimson"
                : "border-white/12 text-bone/45 hover:border-white/30 hover:text-bone/75",
            )}
          >
            {entry.label}
            <span className="ml-2 font-normal text-bone/30">{countFor(entry.value)}</span>
          </Link>
        ))}
      </nav>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <AdminPanel
            title="Library"
            description={`${media.length} item${media.length === 1 ? "" : "s"} in this view.`}
          >
            {media.length === 0 ? (
              <AdminEmpty>No media matches this filter.</AdminEmpty>
            ) : (
              <div className="grid gap-px bg-white/5 sm:grid-cols-2">
                {media.map((item) => {
                  const isVideo = item.type === "VIDEO";
                  const preview = item.poster ?? (!isVideo ? item.src : null);
                  return (
                    <article key={item.id} className="flex flex-col bg-[#0d0d0d]">
                      <div className="relative aspect-[4/3] overflow-hidden border-b border-white/5 bg-black">
                        {preview ? (
                          <Image
                            src={preview}
                            alt={item.caption}
                            fill
                            sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw"
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-bone/25">
                            {isVideo ? (
                              <Film size={28} aria-hidden="true" />
                            ) : (
                              <ImageOff size={28} aria-hidden="true" />
                            )}
                            <span className="text-[8px] uppercase tracking-[0.16em]">
                              {item.storagePath ? "Held in private storage" : "No preview"}
                            </span>
                          </div>
                        )}
                        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
                          <StatusPill status={item.status} />
                          {isVideo && item.durationSeconds != null && (
                            <span className="border border-white/15 bg-black/60 px-2 py-1 text-[8px] tabular-nums text-bone/60">
                              {Math.round(item.durationSeconds)}s
                            </span>
                          )}
                        </div>
                        {isVideo && item.src && (
                          <span className="absolute bottom-2 right-2 border border-white/15 bg-black/60 px-2 py-1 text-[8px] uppercase tracking-[0.12em] text-bone/55">
                            {item.src.split(".").pop()}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col gap-3 p-4">
                        <div>
                          <p className="text-[8px] uppercase tracking-[0.14em] text-bone/30">
                            {item.edition.label} · {item.type} · {item.key}
                          </p>
                          <p className="mt-1.5 text-[11px] leading-5 text-bone/65">
                            {item.caption}
                          </p>
                          <p className="mt-1 text-[8px] text-bone/25">
                            {item.width && item.height
                              ? `${item.width}×${item.height}`
                              : "Dimensions unrecorded"}
                            {item.storagePath ? ` · ${item.storagePath}` : ""}
                          </p>
                        </div>

                        <details>
                          <summary className="cursor-pointer list-none text-[8px] font-bold uppercase tracking-[0.14em] text-bone/35 hover:text-crimson">
                            Edit caption
                          </summary>
                          <form action={updateMediaCaptionAction} className="mt-2 space-y-2">
                            <input type="hidden" name="id" value={item.id} />
                            <input type="hidden" name="returnTo" value={returnTo} />
                            <AdminTextarea
                              label="Caption"
                              name="caption"
                              rows={2}
                              defaultValue={item.caption}
                              required
                            />
                            <AdminButton type="submit" variant="outline" disabled={!canEdit}>
                              Save caption
                            </AdminButton>
                          </form>
                        </details>

                        <div className="mt-auto flex flex-wrap gap-2 border-t border-white/5 pt-3">
                          {(STATUS_ACTIONS[item.status] ?? []).map((action) => (
                            <form key={action.status} action={updateMediaStatusAction}>
                              <input type="hidden" name="id" value={item.id} />
                              <input type="hidden" name="status" value={action.status} />
                              <input type="hidden" name="returnTo" value={returnTo} />
                              <ConfirmButton
                                message={
                                  action.status === "APPROVED" && item.storagePath && !item.src
                                    ? "Publish this private file? It will be copied into the public web root."
                                    : `${action.label} this media item?`
                                }
                                className={cn(
                                  "border px-3 py-2 text-[8px] font-bold uppercase tracking-[0.12em] transition-colors",
                                  action.status === "APPROVED"
                                    ? "border-emerald-400/30 text-emerald-200/80 hover:bg-emerald-400/10"
                                    : action.status === "REJECTED"
                                      ? "border-crimson/35 text-crimson/80 hover:bg-crimson/10"
                                      : "border-white/15 text-bone/50 hover:border-white/35 hover:text-bone/80",
                                )}
                              >
                                {action.label}
                              </ConfirmButton>
                            </form>
                          ))}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </AdminPanel>
        </div>

        <div className="space-y-5">
          <AdminPanel title="Upload" description="Files land in the review queue as pending.">
            <form
              action={uploadMediaAction}
              encType="multipart/form-data"
              className="space-y-3 p-5"
            >
              <input type="hidden" name="returnTo" value={returnTo} />
              <AdminSelect
                label="Edition"
                name="editionId"
                options={editions.map((edition) => ({
                  value: edition.id,
                  label: edition.label,
                }))}
              />
              <label className="block">
                <span className="block text-[8px] font-semibold uppercase tracking-[0.18em] text-bone/40">
                  File
                </span>
                <input
                  type="file"
                  name="file"
                  accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
                  required
                  className="mt-1.5 w-full border border-white/12 bg-ink px-3 py-2 text-[10px] text-bone/60 file:mr-3 file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-[9px] file:uppercase file:tracking-[0.12em] file:text-bone/70"
                />
              </label>
              <AdminTextarea
                label="Caption"
                name="caption"
                rows={2}
                required
                hint="Describe only what is visible. 240 characters max."
              />
              <AdminButton type="submit" className="w-full" disabled={!canEdit}>
                <Upload size={12} aria-hidden="true" /> Upload to review
              </AdminButton>
              <p className="text-[9px] leading-4 text-bone/25">
                Images are converted to WebP. Maximum 10 MB. Video is stored as-is for review.
              </p>
            </form>
          </AdminPanel>

          <AdminPanel title="Publication rules" tone="danger">
            <div className="space-y-3 p-5 text-[9px] leading-5 text-bone/35">
              <p className="flex items-start gap-2">
                <ShieldAlert size={12} className="mt-0.5 shrink-0 text-crimson/70" aria-hidden="true" />
                Personal or third-party footage requires explicit consent from the subject before
                approval. The 3.7s portrait clip stays private until the organizer confirms.
              </p>
              <p>Approved media appears on the gallery and the matching edition history page.</p>
              <p>Hidden media remains on disk but is excluded from every public query.</p>
            </div>
          </AdminPanel>

          <AdminPanel title="Media coverage">
            <div className="p-5">
              <Link href="/gallery" className="link-arrow text-bone/45">
                View public gallery
              </Link>
            </div>
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}
