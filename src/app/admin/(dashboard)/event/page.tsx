import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Mail, ShieldAlert, Webhook } from "lucide-react";
import {
  AdminButton,
  AdminCheckbox,
  AdminField,
  AdminFlash,
  AdminPanel,
  AdminSelect,
  AdminTextarea,
  StatusPill,
} from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import {
  createTicketCategoryAction,
  deleteTicketCategoryAction,
  saveEventAction,
  saveTicketCategoryAction,
  updateSettingAction,
} from "@/app/admin/actions";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";
import { getEmailConfig } from "@/server/email";
import { getWebhookSecret } from "@/server/ticketing";

export const metadata: Metadata = { title: "Event" };
export const dynamic = "force-dynamic";

const STATUS_OPTIONS = ["DRAFT", "UPCOMING", "ON_SALE", "SOLD_OUT", "PAST", "POSTPONED"].map(
  (value) => ({ value, label: value.replace(/_/g, " ") }),
);

export default async function AdminEventPage({
  searchParams,
}: {
  searchParams: { ok?: string; error?: string };
}) {
  const session = await requireAdmin();

  const [event, settings] = await Promise.all([
    prisma.event.findUnique({
      where: { slug: "atlantis-4" },
      include: { ticketCategories: { orderBy: [{ channel: "asc" }, { priceNaira: "asc" }] } },
    }),
    prisma.siteSetting.findMany({ where: { key: { in: ["claimsOpen", "tributeEnabled"] } } }),
  ]);

  const setting = (key: string) => settings.find((row) => row.key === key)?.value ?? "true";
  const claimsOpen = setting("claimsOpen") === "true";
  const tributeEnabled = setting("tributeEnabled") === "true";

  const canEdit = ["OWNER", "EDITOR"].includes(session.role);
  const returnTo = "/admin/event";

  const email = getEmailConfig();
  const webhookConfigured = Boolean(getWebhookSecret());
  const demoMode = process.env.DEMO_MODE === "true";
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[8px] font-bold uppercase tracking-[0.24em] text-crimson">Event</p>
        <h1 className="mt-2 font-display text-3xl uppercase leading-none text-bone">
          {event?.title ?? "Atlantis 4.0"}
        </h1>
        <p className="mt-2 max-w-2xl text-[11px] leading-5 text-bone/35">
          Public event facts appear on the homepage, event and ticket pages. Only mark details
          verified when confirmed with the organizer — unverified prices are hidden from checkout
          guidance.
        </p>
      </div>

      <AdminFlash ok={searchParams.ok} error={searchParams.error} />

      {!event && (
        <div className="flex items-start gap-2 border border-crimson/30 bg-crimson/[0.06] p-4 text-[11px] leading-5 text-[#ff8a86]">
          <ShieldAlert size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          No event record exists yet. Run the seed script or save the form below to create it.
        </div>
      )}

      {!canEdit && (
        <div className="border border-white/12 bg-white/[0.02] p-4 text-[11px] leading-5 text-bone/40">
          Your role ({session.role}) can view event settings but not change them. Sign in as an
          OWNER or EDITOR to edit.
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <AdminPanel
            title="Public event details"
            description="These values drive the countdown, venue display and ticket CTA."
          >
            <form action={saveEventAction} className="space-y-4 p-5">
              <input type="hidden" name="returnTo" value={returnTo} />
              <fieldset disabled={!canEdit} className="space-y-4 disabled:opacity-60">
                <div className="grid gap-4 sm:grid-cols-2">
                  <AdminField label="Title" name="title" required defaultValue={event?.title} />
                  <AdminField
                    label="Edition label"
                    name="editionLabel"
                    required
                    defaultValue={event?.editionLabel}
                    hint="Shown as the edition chip, e.g. ATLANTIS 4.0"
                  />
                  <AdminField
                    label="Date"
                    name="date"
                    type="date"
                    required
                    defaultValue={event?.eventDate.toISOString().slice(0, 10)}
                    hint="Countdown starts at 13:00 Africa/Lagos."
                  />
                  <AdminSelect
                    label="Status"
                    name="status"
                    options={STATUS_OPTIONS}
                    defaultValue={event?.status ?? "UPCOMING"}
                  />
                  <AdminField
                    label="Start time"
                    name="timeStart"
                    required
                    defaultValue={event?.timeStart}
                    placeholder="1:00 PM"
                  />
                  <AdminField
                    label="End time"
                    name="timeEnd"
                    required
                    defaultValue={event?.timeEnd}
                    placeholder="11:00 PM"
                  />
                  <AdminField
                    label="Venue name"
                    name="venueName"
                    required
                    defaultValue={event?.venueName}
                  />
                  <AdminField
                    label="Venue address"
                    name="venueAddress"
                    required
                    defaultValue={event?.venueAddress}
                  />
                </div>
                <AdminField
                  label="Official ticket URL"
                  name="ticketUrl"
                  type="url"
                  required
                  defaultValue={event?.ticketUrl}
                  hint="Every purchase button links here. Use the exact Popout event URL."
                />
                <AdminTextarea
                  label="Public description"
                  name="description"
                  rows={5}
                  required
                  defaultValue={event?.description}
                  hint="Factual copy only. Do not invent performers, sponsors or attendance."
                />
                <AdminCheckbox
                  name="detailsVerified"
                  label="I have confirmed the date, time, venue and ticket URL with the organizer."
                  defaultChecked={event?.detailsVerified}
                  hint="Until checked, public pages label these details as provisional."
                />
                <div className="flex justify-end">
                  <AdminButton type="submit" disabled={!canEdit}>
                    Save event details
                  </AdminButton>
                </div>
              </fieldset>
            </form>
          </AdminPanel>

          <AdminPanel
            title="Ticket prices"
            description="Only verified prices are presented as confirmed. Leave unverified during negotiation."
          >
            <div className="divide-y divide-white/5">
              {event?.ticketCategories.length ? (
                event.ticketCategories.map((category) => (
                  <form
                    key={category.id}
                    action={saveTicketCategoryAction}
                    className="flex flex-wrap items-end gap-3 px-5 py-4"
                  >
                    <input type="hidden" name="id" value={category.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <div className="min-w-[120px] flex-1">
                      <p className="text-[11px] text-bone/75">{category.name}</p>
                      <p className="mt-0.5 text-[8px] uppercase tracking-[0.14em] text-bone/25">
                        {category.channel} · {category.note ?? "No note"}
                      </p>
                    </div>
                    <div className="w-36">
                      <AdminField
                        label="Price (₦)"
                        name="priceNaira"
                        type="number"
                        min={0}
                        step={100}
                        defaultValue={category.priceNaira}
                        required
                      />
                    </div>
                    <AdminCheckbox
                      label="Verified"
                      name="verified"
                      defaultChecked={category.verified}
                    />
                    <div className="flex items-center gap-2">
                      <AdminButton type="submit" variant="outline">
                        Save
                      </AdminButton>
                    </div>
                  </form>
                ))
              ) : (
                <p className="px-5 py-6 text-[11px] text-bone/35">
                  No ticket categories yet. Add a channel below once prices are confirmed.
                </p>
              )}
            </div>

            <div className="border-t border-white/10 p-5">
              <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-bone/40">
                Add category
              </p>
              <form
                action={createTicketCategoryAction}
                className="mt-3 flex flex-wrap items-end gap-3"
              >
                <input type="hidden" name="returnTo" value={returnTo} />
                <div className="min-w-[140px] flex-1">
                  <AdminField label="Name" name="name" placeholder="Regular" required />
                </div>
                <div className="w-32">
                  <AdminSelect
                    label="Channel"
                    name="channel"
                    options={[
                      { value: "ONLINE", label: "Online" },
                      { value: "GATE", label: "Gate" },
                    ]}
                  />
                </div>
                <div className="w-36">
                  <AdminField
                    label="Price (₦)"
                    name="priceNaira"
                    type="number"
                    min={0}
                    step={100}
                    required
                  />
                </div>
                <AdminCheckbox label="Verified" name="verified" />
                <AdminButton type="submit" disabled={!canEdit}>
                  Add
                </AdminButton>
              </form>
              <p className="mt-2 text-[9px] leading-4 text-bone/25">
                Only add categories that exist on the official provider listing.
              </p>
            </div>

            {event?.ticketCategories.length ? (
              <div className="border-t border-white/10 p-5">
                <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-bone/40">
                  Remove category
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {event.ticketCategories.map((category) => (
                    <form key={category.id} action={deleteTicketCategoryAction}>
                      <input type="hidden" name="id" value={category.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <ConfirmButton
                        message={`Remove ${category.name} (${category.channel})?`}
                        className="border border-white/12 px-3 py-2 text-[8px] font-bold uppercase tracking-[0.12em] text-bone/40 transition-colors hover:border-crimson hover:text-crimson"
                      >
                        {category.name} · {category.channel}
                      </ConfirmButton>
                    </form>
                  ))}
                </div>
              </div>
            ) : null}
          </AdminPanel>

          <AdminPanel title="Feature switches" description="Closes public flows without a deploy.">
            <div className="grid gap-px bg-white/5 sm:grid-cols-2">
              <div className="bg-[#0d0d0d] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] text-bone/75">999 card claims</p>
                  <StatusPill status={claimsOpen ? "APPROVED" : "HIDDEN"} />
                </div>
                <p className="mt-2 text-[9px] leading-4 text-bone/30">
                  {claimsOpen
                    ? "The claim form accepts new submissions."
                    : "The claim form is paused and shows a closed state."}
                </p>
                <form action={updateSettingAction} className="mt-3">
                  <input type="hidden" name="key" value="claimsOpen" />
                  <input type="hidden" name="value" value={claimsOpen ? "false" : "true"} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <ConfirmButton
                    message={claimsOpen ? "Pause new claims?" : "Reopen claims?"}
                    className="border border-white/20 px-3.5 py-2 text-[9px] font-bold uppercase tracking-[0.14em] text-bone/65 transition-colors hover:border-crimson hover:text-crimson"
                  >
                    {claimsOpen ? "Pause claims" : "Reopen claims"}
                  </ConfirmButton>
                </form>
              </div>
              <div className="bg-[#0d0d0d] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] text-bone/75">999 tribute section</p>
                  <StatusPill status={tributeEnabled ? "APPROVED" : "HIDDEN"} />
                </div>
                <p className="mt-2 text-[9px] leading-4 text-bone/30">
                  {tributeEnabled
                    ? "The 999 experience is linked in public navigation."
                    : "The 999 experience is hidden from the header and footer."}
                </p>
                <form action={updateSettingAction} className="mt-3">
                  <input type="hidden" name="key" value="tributeEnabled" />
                  <input type="hidden" name="value" value={tributeEnabled ? "false" : "true"} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <ConfirmButton
                    message={
                      tributeEnabled ? "Hide the 999 section?" : "Show the 999 section publicly?"
                    }
                    className="border border-white/20 px-3.5 py-2 text-[9px] font-bold uppercase tracking-[0.14em] text-bone/65 transition-colors hover:border-crimson hover:text-crimson"
                  >
                    {tributeEnabled ? "Hide tribute" : "Show tribute"}
                  </ConfirmButton>
                </form>
              </div>
            </div>
          </AdminPanel>
        </div>

        <div className="space-y-5">
          <AdminPanel title="Integration status" description="Detected from the environment.">
            <ul className="divide-y divide-white/5">
              <li className="px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-[10px] text-bone/60">
                    <Mail size={12} aria-hidden="true" /> Resend email
                  </span>
                  <StatusPill status={email.configured ? "CONFIRMED" : "SKIPPED"} />
                </div>
                <p className="mt-1.5 text-[9px] leading-4 text-bone/30">
                  {email.configured
                    ? `Sending from ${email.from}.`
                    : (email.reason ?? "Email is not configured.")}
                </p>
              </li>
              <li className="px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-[10px] text-bone/60">
                    <Webhook size={12} aria-hidden="true" /> Ticket webhook
                  </span>
                  <StatusPill status={webhookConfigured ? "CONFIRMED" : "SKIPPED"} />
                </div>
                <p className="mt-1.5 break-all text-[9px] leading-4 text-bone/30">
                  {webhookConfigured
                    ? `POST ${siteUrl}/api/tickets/webhook`
                    : "Set TICKET_WEBHOOK_SECRET to accept signed purchases."}
                </p>
              </li>
              <li className="px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] text-bone/60">Sandbox mode</span>
                  <StatusPill status={demoMode ? "PENDING" : "HIDDEN"} />
                </div>
                <p className="mt-1.5 text-[9px] leading-4 text-bone/30">
                  {demoMode
                    ? "DEMO_MODE is on — the seeded sandbox ticket can exercise verification."
                    : "DEMO_MODE is off — only real signed purchases can verify claims."}
                </p>
              </li>
            </ul>
            <div className="border-t border-white/10 px-5 py-3">
              <Link href="/admin/emails" className="link-arrow text-bone/45">
                Email deliveries <ArrowUpRight size={11} aria-hidden="true" />
              </Link>
            </div>
          </AdminPanel>

          <AdminPanel title="Page coverage">
            <ul className="space-y-2 p-5 text-[10px] leading-5 text-bone/35">
              <li>Homepage hero, countdown and ticket CTA</li>
              <li>Event page facts and headline</li>
              <li>Ticket page purchase guidance</li>
              <li>FAQ event answers</li>
              <li>Claim flow event reference</li>
            </ul>
            <div className="border-t border-white/10 p-5 text-[9px] leading-4 text-bone/25">
              The event date is stored in Africa/Lagos. Changing the date updates the countdown on
              the next request.
            </div>
          </AdminPanel>

          <AdminPanel title="Verification rule">
            <div className="flex items-start gap-2 p-5 text-[9px] leading-4 text-amber-100/50">
              <ShieldAlert size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
              Never mark prices verified without the official provider listing. Screenshots and
              forwarded messages are not verification.
            </div>
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}
