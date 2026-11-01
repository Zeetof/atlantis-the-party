import type { Metadata } from "next";
import Link from "next/link";
import { Info, ShieldAlert } from "lucide-react";
import {
  AdminButton,
  AdminCheckbox,
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
  createPerformerAction,
  deletePerformerAction,
  updatePerformerAction,
} from "@/app/admin/actions";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Lineup" };
export const dynamic = "force-dynamic";

const CATEGORY_OPTIONS = [
  { value: "ARTIST", label: "Artist" },
  { value: "DJ", label: "DJ" },
  { value: "HYPEMAN", label: "Hypeman" },
  { value: "GUEST", label: "Guest" },
];

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft — hidden" },
  { value: "PENDING", label: "Pending — public with badge" },
  { value: "CONFIRMED", label: "Confirmed — public" },
  { value: "CANCELLED", label: "Cancelled — hidden" },
  { value: "ARCHIVED", label: "Archived — history only" },
];

export default async function AdminLineupPage({
  searchParams,
}: {
  searchParams: { ok?: string; error?: string; edition?: string };
}) {
  const session = await requireAdmin();

  const editions = await prisma.edition.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      performers: { orderBy: [{ category: "asc" }, { sortOrder: "asc" }] },
    },
  });

  const activeSlug = searchParams.edition ?? editions[0]?.slug ?? "";
  const activeEdition = editions.find((edition) => edition.slug === activeSlug) ?? editions[0];

  const canEdit = ["OWNER", "EDITOR"].includes(session.role);
  const canDelete = session.role === "OWNER";
  const returnTo = `/admin/lineup?edition=${encodeURIComponent(activeEdition?.slug ?? "")}`;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[8px] font-bold uppercase tracking-[0.24em] text-crimson">Content</p>
        <h1 className="mt-2 font-display text-3xl uppercase leading-none text-bone">Lineup</h1>
        <p className="mt-2 max-w-2xl text-[11px] leading-5 text-bone/35">
          Lineup records are bound to the edition they belong to. The Atlantis 2.0 flyer names are an
          archive — never re-label them for 4.0.
        </p>
      </div>

      <AdminFlash ok={searchParams.ok} error={searchParams.error} />

      <div className="flex items-start gap-2 border border-amber-400/25 bg-amber-400/[0.05] p-4 text-[10px] leading-5 text-amber-100/60">
        <ShieldAlert size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
        Add a 4.0 performer only after direct organizer confirmation. Do not carry 2.0 names into the
        current edition, and leave historic spellings untouched until the organizer confirms them.
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Editions">
        {editions.map((edition) => {
          const isActive = edition.id === activeEdition?.id;
          return (
            <Link
              key={edition.id}
              href={`/admin/lineup?edition=${encodeURIComponent(edition.slug)}`}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "border px-3 py-2 text-[9px] font-bold uppercase tracking-[0.14em] transition-colors",
                isActive
                  ? "border-crimson bg-crimson/10 text-crimson"
                  : "border-white/12 text-bone/45 hover:border-white/30 hover:text-bone/75",
              )}
            >
              {edition.label}
              <span className="ml-2 font-normal text-bone/30">
                {edition.performers.length}
              </span>
            </Link>
          );
        })}
      </nav>

      {!activeEdition ? (
        <AdminPanel>
          <AdminEmpty>No editions exist yet. Run the seed script before editing the lineup.</AdminEmpty>
        </AdminPanel>
      ) : (
        <div className="grid gap-5 xl:grid-cols-3">
          <div className="space-y-5 xl:col-span-2">
            <AdminPanel
              title={`${activeEdition.label} lineup`}
              description={
                activeEdition.slug === "atlantis-2"
                  ? "Historic archive transcribed from the 2.0 flyer. Edit spellings only with organizer confirmation."
                  : activeEdition.slug === "atlantis-4"
                    ? "Only CONFIRMED performers appear on the public 4.0 lineup."
                    : "Historic edition records."
              }
            >
              {activeEdition.performers.length === 0 ? (
                <AdminEmpty>No performers recorded for this edition yet.</AdminEmpty>
              ) : (
                <div className="divide-y divide-white/5">
                  {activeEdition.performers.map((performer) => (
                    <div key={performer.id} className="px-5 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[12px] font-semibold text-bone/80">
                              {performer.name}
                            </p>
                            <StatusPill status={performer.status} />
                          </div>
                          <p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-bone/30">
                            {performer.category}
                            {performer.featured ? " · featured" : ""}
                            {performer.imagePath ? "" : " · initials card"}
                          </p>
                          {performer.bio && (
                            <p className="mt-1.5 max-w-xl text-[10px] leading-5 text-bone/35">
                              {performer.bio}
                            </p>
                          )}
                        </div>
                        <details className="group w-full max-w-lg">
                          <summary className="cursor-pointer list-none text-[9px] font-bold uppercase tracking-[0.14em] text-bone/40 transition-colors hover:text-crimson">
                            Edit
                          </summary>
                          <form
                            action={updatePerformerAction}
                            className="mt-4 space-y-3 border border-white/10 bg-ink p-4"
                          >
                            <input type="hidden" name="id" value={performer.id} />
                            <input type="hidden" name="returnTo" value={returnTo} />
                            <div className="grid gap-3 sm:grid-cols-2">
                              <AdminField
                                label="Name"
                                name="name"
                                required
                                defaultValue={performer.name}
                              />
                              <AdminSelect
                                label="Category"
                                name="category"
                                options={CATEGORY_OPTIONS}
                                defaultValue={performer.category}
                              />
                              <AdminSelect
                                label="Status"
                                name="status"
                                options={STATUS_OPTIONS}
                                defaultValue={performer.status}
                              />
                              <AdminField
                                label="Image path"
                                name="imagePath"
                                defaultValue={performer.imagePath ?? ""}
                                placeholder="/media/images/..."
                                hint="Use an existing asset path only."
                              />
                            </div>
                            <AdminField
                              label="Profile URL"
                              name="socials"
                              type="url"
                              defaultValue={performer.socials ?? ""}
                              placeholder="https://instagram.com/..."
                            />
                            <AdminTextarea
                              label="Short bio"
                              name="bio"
                              rows={2}
                              defaultValue={performer.bio ?? ""}
                            />
                            <AdminCheckbox
                              label="Featured"
                              name="featured"
                              defaultChecked={performer.featured}
                            />
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                              <AdminButton type="submit" disabled={!canEdit}>
                                Save performer
                              </AdminButton>
                            </div>
                          </form>
                          {canDelete && (
                            <form action={deletePerformerAction} className="mt-2">
                              <input type="hidden" name="id" value={performer.id} />
                              <input type="hidden" name="returnTo" value={returnTo} />
                              <ConfirmButton
                                message={`Permanently remove ${performer.name} from ${activeEdition.label}?`}
                                className="text-[8px] font-bold uppercase tracking-[0.14em] text-crimson/60 transition-colors hover:text-crimson"
                              >
                                Remove performer
                              </ConfirmButton>
                            </form>
                          )}
                        </details>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AdminPanel>
          </div>

          <div className="space-y-5">
            <AdminPanel
              title="Add performer"
              description={`Creates a record on ${activeEdition.label}.`}
            >
              <form action={createPerformerAction} className="space-y-3 p-5">
                <input type="hidden" name="returnTo" value={returnTo} />
                <input type="hidden" name="editionId" value={activeEdition.id} />
                <AdminField label="Name" name="name" required placeholder="Stage name" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <AdminSelect label="Category" name="category" options={CATEGORY_OPTIONS} />
                  <AdminSelect label="Status" name="status" options={STATUS_OPTIONS} />
                </div>
                <AdminField
                  label="Image path"
                  name="imagePath"
                  placeholder="/media/images/..."
                  hint="Optional. Without an image the card shows initials."
                />
                <AdminField
                  label="Profile URL"
                  name="socials"
                  type="url"
                  placeholder="https://..."
                />
                <AdminTextarea label="Short bio" name="bio" rows={2} />
                <AdminCheckbox
                  label="Featured"
                  name="featured"
                  hint="Featured performers are surfaced first in the lineup explorer."
                />
                <AdminButton type="submit" className="w-full" disabled={!canEdit}>
                  Add performer
                </AdminButton>
              </form>
            </AdminPanel>

            <AdminPanel title="Publishing rules">
              <ul className="space-y-2 p-5 text-[9px] leading-4 text-bone/30">
                <li>
                  <span className="text-bone/55">DRAFT</span> — saved, never public.
                </li>
                <li>
                  <span className="text-bone/55">PENDING</span> — public on history pages with a
                  pending badge.
                </li>
                <li>
                  <span className="text-bone/55">CONFIRMED</span> — the only status shown on the 4.0
                  lineup.
                </li>
                <li>
                  <span className="text-bone/55">CANCELLED</span> — hidden everywhere.
                </li>
                <li>
                  <span className="text-bone/55">ARCHIVED</span> — available to history pages only.
                </li>
              </ul>
            </AdminPanel>

            <AdminPanel title="Archive reminder">
              <div className="flex items-start gap-2 p-5 text-[9px] leading-4 text-bone/30">
                <Info size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
                The 2.0 lineup belongs to the second edition only. Public pages state this
                explicitly and must keep doing so.
              </div>
            </AdminPanel>
          </div>
        </div>
      )}
    </div>
  );
}
