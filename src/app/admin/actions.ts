"use server";

import { randomBytes } from "node:crypto";
import { copyFile, mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import sharp from "sharp";
import {
  clearSession,
  establishSession,
  getAdminSession,
  verifyAdminCredentials,
  type AdminSession,
} from "@/server/auth";
import { prisma } from "@/server/db";
import { recordAudit } from "@/server/audit";
import { rateLimit } from "@/server/rate-limit";
import { ipHash } from "@/lib/pii";
import {
  captionSchema,
  eventSchema,
  loginSchema,
  performerSchema,
  songSchema,
  statusUpdateSchema,
  ticketImportSchema,
} from "@/lib/validation";
import {
  issueAllVerified,
  issueCard,
  rejectClaim,
  retryCardEmail,
  rotateCardToken,
  verifyClaimManually,
} from "@/server/claims";
import { importTicketRows } from "@/server/import";
import { sendPendingInvites, sendTicketInvite } from "@/server/invites";

const CONTENT_ROLES = ["OWNER", "EDITOR"];
const REVIEW_ROLES = ["OWNER", "REVIEWER"];

function headerIp(): string {
  const store = headers();
  const forwarded = store.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return store.get("x-real-ip")?.trim() || "unknown";
}

function auditIp(): string {
  return ipHash(headerIp());
}

function safeAdminPath(value: FormDataEntryValue | null | string, fallback = "/admin"): string {
  const raw = typeof value === "string" ? value : "";
  if (!raw.startsWith("/admin") || raw.startsWith("//") || raw.includes("\n")) return fallback;
  return raw;
}

function withMessage(pathname: string, key: "ok" | "error", message: string): string {
  const url = new URL(pathname, "http://admin.local");
  url.searchParams.set(key, message);
  return `${url.pathname}?${url.searchParams.toString()}`;
}

function back(formData: FormData, key: "ok" | "error", message: string): never {
  redirect(withMessage(safeAdminPath(formData.get("returnTo")), key, message));
}

async function guard(roles: string[], formData: FormData): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    redirect(`/admin/login?next=${encodeURIComponent(safeAdminPath(formData.get("returnTo")))}`);
  }
  if (!roles.includes(session.role)) {
    back(formData, "error", "Your role does not permit that action.");
  }
  return session;
}

function trim(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function checkbox(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function prismaMessage(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return "A record with those details already exists.";
    if (error.code === "P2003") return "That record is still referenced and cannot be removed.";
  }
  return error instanceof Error ? error.message : "The change could not be saved.";
}

/* ------------------------------------------------------------------ auth */

export async function loginAction(formData: FormData) {
  const loginPath = "/admin/login";
  const nextPath = safeAdminPath(formData.get("next"));
  const limit = rateLimit(`admin-login:${headerIp()}`, 8, 15 * 60 * 1000);
  if (!limit.ok) {
    redirect(
      `${withMessage(loginPath, "error", "Too many sign-in attempts. Try again in a few minutes.")}&next=${encodeURIComponent(nextPath)}`,
    );
  }

  const parsed = loginSchema.safeParse({
    email: trim(formData, "email"),
    password: trim(formData, "password"),
  });
  if (!parsed.success) {
    redirect(
      `${withMessage(loginPath, "error", "Enter a valid email and password.")}&next=${encodeURIComponent(nextPath)}`,
    );
  }

  const admin = await verifyAdminCredentials(parsed.data.email, parsed.data.password);
  if (!admin) {
    await recordAudit({
      action: "ADMIN_LOGIN_FAILED",
      entity: "AdminUser",
      metadata: { email: parsed.data.email.slice(0, 80) },
      ipHash: auditIp(),
    });
    redirect(
      `${withMessage(loginPath, "error", "Invalid credentials. Check and try again.")}&next=${encodeURIComponent(nextPath)}`,
    );
  }

  await establishSession(admin);
  await recordAudit({
    session: admin,
    action: "ADMIN_LOGIN",
    entity: "AdminUser",
    entityId: admin.id,
    ipHash: auditIp(),
  });
  redirect(nextPath);
}

export async function logoutAction() {
  const session = await getAdminSession();
  if (session) {
    await recordAudit({
      session,
      action: "ADMIN_LOGOUT",
      entity: "AdminUser",
      entityId: session.id,
      ipHash: auditIp(),
    });
  }
  clearSession();
  redirect("/admin/login");
}

/* ------------------------------------------------------------------ event */

export async function saveEventAction(formData: FormData) {
  const session = await guard(CONTENT_ROLES, formData);
  const parsed = eventSchema.safeParse({
    title: trim(formData, "title"),
    editionLabel: trim(formData, "editionLabel"),
    date: trim(formData, "date"),
    timeStart: trim(formData, "timeStart"),
    timeEnd: trim(formData, "timeEnd"),
    venueName: trim(formData, "venueName"),
    venueAddress: trim(formData, "venueAddress"),
    description: trim(formData, "description"),
    ticketUrl: trim(formData, "ticketUrl"),
    status: trim(formData, "status"),
    detailsVerified: checkbox(formData, "detailsVerified"),
  });

  if (!parsed.success) {
    back(formData, "error", parsed.error.issues[0]?.message ?? "Check the event fields.");
  }

  const eventDate = new Date(`${parsed.data.date}T13:00:00+01:00`);
  if (Number.isNaN(eventDate.getTime())) {
    back(formData, "error", "That event date is not valid.");
  }

  await prisma.event.upsert({
    where: { slug: "atlantis-4" },
    update: {
      title: parsed.data.title,
      editionLabel: parsed.data.editionLabel,
      eventDate,
      timeStart: parsed.data.timeStart,
      timeEnd: parsed.data.timeEnd,
      venueName: parsed.data.venueName,
      venueAddress: parsed.data.venueAddress,
      description: parsed.data.description,
      ticketUrl: parsed.data.ticketUrl,
      status: parsed.data.status,
      detailsVerified: parsed.data.detailsVerified,
    },
    create: {
      slug: "atlantis-4",
      title: parsed.data.title,
      editionLabel: parsed.data.editionLabel,
      eventDate,
      timeStart: parsed.data.timeStart,
      timeEnd: parsed.data.timeEnd,
      venueName: parsed.data.venueName,
      venueAddress: parsed.data.venueAddress,
      description: parsed.data.description,
      ticketUrl: parsed.data.ticketUrl,
      status: parsed.data.status,
      heroImage: "/media/images/atlantis-4-flyer.webp",
      detailsVerified: parsed.data.detailsVerified,
    },
  });

  await recordAudit({
    session,
    action: "EVENT_UPDATED",
    entity: "Event",
    entityId: "atlantis-4",
    metadata: { detailsVerified: parsed.data.detailsVerified, status: parsed.data.status },
    ipHash: auditIp(),
  });

  revalidatePath("/");
  revalidatePath("/event");
  revalidatePath("/tickets");
  back(formData, "ok", "Event details saved.");
}

export async function saveTicketCategoryAction(formData: FormData) {
  const session = await guard(CONTENT_ROLES, formData);
  const id = trim(formData, "id");
  const price = Number(trim(formData, "priceNaira"));
  if (!id) back(formData, "error", "Ticket category not found.");
  if (!Number.isInteger(price) || price < 0 || price > 50_000_000) {
    back(formData, "error", "Enter a valid price in naira.");
  }

  await prisma.ticketCategory.update({
    where: { id },
    data: { priceNaira: price, verified: checkbox(formData, "verified") },
  });

  await recordAudit({
    session,
    action: "TICKET_CATEGORY_UPDATED",
    entity: "TicketCategory",
    entityId: id,
    metadata: { priceNaira: price, verified: checkbox(formData, "verified") },
    ipHash: auditIp(),
  });

  revalidatePath("/");
  revalidatePath("/event");
  revalidatePath("/tickets");
  back(formData, "ok", "Ticket price updated.");
}

export async function createTicketCategoryAction(formData: FormData) {
  const session = await guard(CONTENT_ROLES, formData);
  const name = trim(formData, "name");
  const channel = trim(formData, "channel");
  const price = Number(trim(formData, "priceNaira"));

  if (name.length < 1 || name.length > 40) back(formData, "error", "Enter a category name.");
  if (!["ONLINE", "GATE"].includes(channel)) back(formData, "error", "Choose online or gate.");
  if (!Number.isInteger(price) || price < 0 || price > 50_000_000) {
    back(formData, "error", "Enter a valid price in naira.");
  }

  const event = await prisma.event.findUnique({ where: { slug: "atlantis-4" } });
  if (!event) back(formData, "error", "Create the event first.");

  try {
    await prisma.ticketCategory.create({
      data: {
        eventId: event.id,
        name,
        channel,
        priceNaira: price,
        verified: checkbox(formData, "verified"),
        note: "Added by the organizer.",
        sortOrder: 10,
      },
    });
  } catch (error) {
    back(formData, "error", prismaMessage(error));
  }

  await recordAudit({
    session,
    action: "TICKET_CATEGORY_CREATED",
    entity: "TicketCategory",
    metadata: { name, channel, priceNaira: price },
    ipHash: auditIp(),
  });

  revalidatePath("/");
  revalidatePath("/event");
  revalidatePath("/tickets");
  back(formData, "ok", "Ticket category added.");
}

export async function deleteTicketCategoryAction(formData: FormData) {
  const session = await guard(CONTENT_ROLES, formData);
  const id = trim(formData, "id");
  if (!id) back(formData, "error", "Ticket category not found.");
  try {
    await prisma.ticketCategory.delete({ where: { id } });
  } catch (error) {
    back(formData, "error", prismaMessage(error));
  }
  await recordAudit({
    session,
    action: "TICKET_CATEGORY_DELETED",
    entity: "TicketCategory",
    entityId: id,
    ipHash: auditIp(),
  });
  revalidatePath("/");
  revalidatePath("/event");
  revalidatePath("/tickets");
  back(formData, "ok", "Ticket category removed.");
}

export async function updateSettingAction(formData: FormData) {
  const session = await guard(CONTENT_ROLES, formData);
  const key = trim(formData, "key");
  const value = trim(formData, "value");
  const allowed: Record<string, string[]> = {
    claimsOpen: ["true", "false"],
    tributeEnabled: ["true", "false"],
  };
  if (!allowed[key] || !allowed[key].includes(value)) {
    back(formData, "error", "That setting cannot be changed here.");
  }

  await prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
  await recordAudit({
    session,
    action: "SETTING_UPDATED",
    entity: "SiteSetting",
    entityId: key,
    metadata: { value },
    ipHash: auditIp(),
  });
  revalidatePath("/");
  revalidatePath("/claim");
  revalidatePath("/999-experience");
  back(formData, "ok", `${key} set to ${value}.`);
}

/* --------------------------------------------------------------- lineup */

export async function createPerformerAction(formData: FormData) {
  const session = await guard(CONTENT_ROLES, formData);
  const parsed = performerSchema.safeParse({
    name: trim(formData, "name"),
    category: trim(formData, "category"),
    editionId: trim(formData, "editionId"),
    status: trim(formData, "status"),
    bio: trim(formData, "bio"),
    socials: trim(formData, "socials"),
    imagePath: trim(formData, "imagePath"),
    featured: checkbox(formData, "featured"),
  });
  if (!parsed.success) {
    back(formData, "error", parsed.error.issues[0]?.message ?? "Check the performer fields.");
  }

  const edition = await prisma.edition.findUnique({ where: { id: parsed.data.editionId } });
  if (!edition) back(formData, "error", "That edition does not exist.");

  const last = await prisma.performer.findFirst({
    where: { editionId: edition.id },
    orderBy: { sortOrder: "desc" },
  });

  try {
    await prisma.performer.create({
      data: {
        editionId: edition.id,
        name: parsed.data.name,
        category: parsed.data.category,
        status: parsed.data.status,
        bio: parsed.data.bio || null,
        socials: parsed.data.socials || null,
        imagePath: parsed.data.imagePath || null,
        featured: parsed.data.featured ?? false,
        sortOrder: (last?.sortOrder ?? 0) + 1,
      },
    });
  } catch (error) {
    back(formData, "error", prismaMessage(error));
  }

  await recordAudit({
    session,
    action: "PERFORMER_CREATED",
    entity: "Performer",
    metadata: { name: parsed.data.name, edition: edition.slug, status: parsed.data.status },
    ipHash: auditIp(),
  });
  revalidatePath("/lineup");
  revalidatePath(`/history/${edition.slug}`);
  revalidatePath("/");
  back(formData, "ok", "Performer added.");
}

export async function updatePerformerAction(formData: FormData) {
  const session = await guard(CONTENT_ROLES, formData);
  const id = trim(formData, "id");
  const existing = await prisma.performer.findUnique({ where: { id }, include: { edition: true } });
  if (!existing) back(formData, "error", "Performer not found.");

  const parsed = performerSchema.safeParse({
    name: trim(formData, "name"),
    category: trim(formData, "category"),
    editionId: existing.editionId,
    status: trim(formData, "status"),
    bio: trim(formData, "bio"),
    socials: trim(formData, "socials"),
    imagePath: trim(formData, "imagePath"),
    featured: checkbox(formData, "featured"),
  });
  if (!parsed.success) {
    back(formData, "error", parsed.error.issues[0]?.message ?? "Check the performer fields.");
  }

  try {
    await prisma.performer.update({
      where: { id },
      data: {
        name: parsed.data.name,
        category: parsed.data.category,
        status: parsed.data.status,
        bio: parsed.data.bio || null,
        socials: parsed.data.socials || null,
        imagePath: parsed.data.imagePath || null,
        featured: parsed.data.featured ?? false,
      },
    });
  } catch (error) {
    back(formData, "error", prismaMessage(error));
  }

  await recordAudit({
    session,
    action: "PERFORMER_UPDATED",
    entity: "Performer",
    entityId: id,
    metadata: { name: parsed.data.name, status: parsed.data.status },
    ipHash: auditIp(),
  });
  revalidatePath("/lineup");
  revalidatePath(`/history/${existing.edition.slug}`);
  revalidatePath("/");
  back(formData, "ok", "Performer updated.");
}

export async function deletePerformerAction(formData: FormData) {
  const session = await guard(["OWNER"], formData);
  const id = trim(formData, "id");
  const existing = await prisma.performer.findUnique({ where: { id }, include: { edition: true } });
  if (!existing) back(formData, "error", "Performer not found.");

  await prisma.performer.delete({ where: { id } });
  await recordAudit({
    session,
    action: "PERFORMER_DELETED",
    entity: "Performer",
    entityId: id,
    metadata: { name: existing.name, edition: existing.edition.slug },
    ipHash: auditIp(),
  });
  revalidatePath("/lineup");
  revalidatePath(`/history/${existing.edition.slug}`);
  back(formData, "ok", "Performer removed.");
}

/* ---------------------------------------------------------------- media */

export async function updateMediaStatusAction(formData: FormData) {
  const session = await guard(CONTENT_ROLES, formData);
  const id = trim(formData, "id");
  const parsed = statusUpdateSchema.safeParse({ status: trim(formData, "status") });
  if (!parsed.success) back(formData, "error", "Unknown media status.");

  const media = await prisma.media.findUnique({ where: { id }, include: { edition: true } });
  if (!media) back(formData, "error", "Media not found.");

  let src = media.src;
  let poster = media.poster;

  if (parsed.data.status === "APPROVED" && !media.src && media.storagePath) {
    if (!/^storage\/private\//.test(media.storagePath)) {
      back(formData, "error", "Refusing to publish a file outside private storage.");
    }

    const privateRoot = path.join(process.cwd(), "storage", "private");
    const source = path.resolve(process.cwd(), media.storagePath);
    if (!source.startsWith(`${privateRoot}${path.sep}`)) {
      back(formData, "error", "Refusing to publish a file outside private storage.");
    }

    try {
      await stat(source);
    } catch {
      back(formData, "error", "The private source file is missing on disk.");
    }

    const ext = path.extname(source).toLowerCase();
    if (media.type === "VIDEO" && ![".mp4", ".webm"].includes(ext)) {
      back(formData, "error", "Unsupported video format for publication.");
    }
    if (media.type === "IMAGE" && ![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
      back(formData, "error", "Unsupported image format for publication.");
    }

    const folder = media.type === "VIDEO" ? "videos" : "images";
    const targetName = `${media.key}${ext}`;
    const targetDir = path.join(process.cwd(), "public", "media", folder);
    await mkdir(targetDir, { recursive: true });
    await copyFile(source, path.join(targetDir, targetName));

    src = `/media/${folder}/${targetName}`;

    if (media.type === "VIDEO") {
      const posterSource = source.replace(/\.mp4$/i, "-poster.jpg");
      try {
        await stat(posterSource);
        const posterDir = path.join(process.cwd(), "public", "media", "posters");
        await mkdir(posterDir, { recursive: true });
        const posterName = `${media.key}-poster.jpg`;
        await copyFile(posterSource, path.join(posterDir, posterName));
        poster = `/media/posters/${posterName}`;
      } catch {
        poster = null;
      }
    }
  }

  await prisma.media.update({
    where: { id },
    data: { status: parsed.data.status, src, poster },
  });

  await recordAudit({
    session,
    action: `MEDIA_${parsed.data.status}`,
    entity: "Media",
    entityId: media.id,
    metadata: { key: media.key, edition: media.edition.slug, published: Boolean(src && !media.src) },
    ipHash: auditIp(),
  });

  revalidatePath("/gallery");
  revalidatePath(`/history/${media.edition.slug}`);
  revalidatePath("/");
  back(formData, "ok", `Media marked ${parsed.data.status.toLowerCase()}.`);
}

export async function updateMediaCaptionAction(formData: FormData) {
  const session = await guard(CONTENT_ROLES, formData);
  const id = trim(formData, "id");
  const parsed = captionSchema.safeParse({ caption: trim(formData, "caption") });
  if (!parsed.success) back(formData, "error", "Enter a caption of 240 characters or fewer.");
  const media = await prisma.media.findUnique({ where: { id }, include: { edition: true } });
  if (!media) back(formData, "error", "Media not found.");

  await prisma.media.update({ where: { id }, data: { caption: parsed.data.caption } });
  await recordAudit({
    session,
    action: "MEDIA_CAPTION_UPDATED",
    entity: "Media",
    entityId: id,
    ipHash: auditIp(),
  });
  revalidatePath("/gallery");
  revalidatePath(`/history/${media.edition.slug}`);
  back(formData, "ok", "Caption updated.");
}

export async function uploadMediaAction(formData: FormData) {
  const session = await guard(CONTENT_ROLES, formData);
  const file = formData.get("file");
  const editionId = trim(formData, "editionId");
  const caption = trim(formData, "caption");

  if (!(file instanceof File) || file.size === 0) back(formData, "error", "Choose a file to upload.");
  if (file.size > 10 * 1024 * 1024) back(formData, "error", "Keep uploads under 10 MB.");
  if (!caption || caption.length > 240) back(formData, "error", "Add a caption (240 characters max).");

  const edition = await prisma.edition.findUnique({ where: { id: editionId } });
  if (!edition) back(formData, "error", "Choose a valid edition.");

  const mime = file.type;
  const isImage = ["image/jpeg", "image/png", "image/webp", "image/avif"].includes(mime);
  const isVideo = ["video/mp4", "video/webm"].includes(mime);
  if (!isImage && !isVideo) {
    back(formData, "error", "Upload a JPEG, PNG, WebP, AVIF, MP4 or WebM file.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `upload-${Date.now()}-${randomBytes(3).toString("hex")}`;
  const dir = path.join(process.cwd(), "public", "media", "uploads");
  await mkdir(dir, { recursive: true });

  let src: string;
  let width: number | null = null;
  let height: number | null = null;

  if (isImage) {
    try {
      const output = await sharp(buffer)
        .rotate()
        .resize({ width: 2200, height: 2200, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 86 })
        .toBuffer({ resolveWithObject: true });
      const filename = `${key}.webp`;
      await writeFile(path.join(dir, filename), output.data);
      src = `/media/uploads/${filename}`;
      width = output.info.width;
      height = output.info.height;
    } catch {
      back(formData, "error", "The image could not be processed.");
    }
  } else {
    const ext = mime === "video/webm" ? "webm" : "mp4";
    const filename = `${key}.${ext}`;
    await writeFile(path.join(dir, filename), buffer);
    src = `/media/uploads/${filename}`;
  }

  const created = await prisma.media.create({
    data: {
      key,
      editionId: edition.id,
      type: isImage ? "IMAGE" : "VIDEO",
      src,
      caption,
      width,
      height,
      status: "PENDING",
      sortOrder: 200,
    },
  });

  await recordAudit({
    session,
    action: "MEDIA_UPLOADED",
    entity: "Media",
    entityId: created.id,
    metadata: { edition: edition.slug, type: created.type, bytes: file.size },
    ipHash: auditIp(),
  });

  back(formData, "ok", "Upload saved to review queue (pending).");
}

/* ---------------------------------------------------------------- songs */

export async function createSongAction(formData: FormData) {
  const session = await guard(CONTENT_ROLES, formData);
  const parsed = songSchema.safeParse({
    title: trim(formData, "title"),
    officialUrl: trim(formData, "officialUrl"),
    platform: trim(formData, "platform"),
    approved: checkbox(formData, "approved"),
    linkStatus: trim(formData, "linkStatus"),
  });
  if (!parsed.success) back(formData, "error", parsed.error.issues[0]?.message ?? "Check the song fields.");

  const last = await prisma.tributeSong.findFirst({ orderBy: { sortOrder: "desc" } });
  try {
    await prisma.tributeSong.create({
      data: { ...parsed.data, sortOrder: (last?.sortOrder ?? 0) + 1 },
    });
  } catch (error) {
    back(formData, "error", prismaMessage(error));
  }

  await recordAudit({
    session,
    action: "SONG_CREATED",
    entity: "TributeSong",
    metadata: { title: parsed.data.title, approved: parsed.data.approved },
    ipHash: auditIp(),
  });
  back(formData, "ok", "Tribute song added.");
}

export async function updateSongAction(formData: FormData) {
  const session = await guard(CONTENT_ROLES, formData);
  const id = trim(formData, "id");
  const parsed = songSchema.safeParse({
    title: trim(formData, "title"),
    officialUrl: trim(formData, "officialUrl"),
    platform: trim(formData, "platform"),
    approved: checkbox(formData, "approved"),
    linkStatus: trim(formData, "linkStatus"),
  });
  if (!parsed.success) back(formData, "error", parsed.error.issues[0]?.message ?? "Check the song fields.");

  try {
    await prisma.tributeSong.update({ where: { id }, data: parsed.data });
  } catch (error) {
    back(formData, "error", prismaMessage(error));
  }

  await recordAudit({
    session,
    action: "SONG_UPDATED",
    entity: "TributeSong",
    entityId: id,
    metadata: { title: parsed.data.title, approved: parsed.data.approved },
    ipHash: auditIp(),
  });
  back(formData, "ok", "Song updated.");
}

export async function deleteSongAction(formData: FormData) {
  const session = await guard(["OWNER"], formData);
  const id = trim(formData, "id");
  try {
    await prisma.tributeSong.delete({ where: { id } });
  } catch (error) {
    back(formData, "error", prismaMessage(error));
  }
  await recordAudit({
    session,
    action: "SONG_DELETED",
    entity: "TributeSong",
    entityId: id,
    ipHash: auditIp(),
  });
  back(formData, "ok", "Song removed.");
}

/* --------------------------------------------------------------- claims */

export async function verifyClaimAction(formData: FormData) {
  const session = await guard(REVIEW_ROLES, formData);
  const claimId = trim(formData, "claimId");
  const providerRef = trim(formData, "providerRef");
  if (!claimId) back(formData, "error", "Claim not found.");

  const result = await verifyClaimManually({
    claimId,
    providerRef,
    session,
    ipHash: auditIp(),
  });

  back(formData, result.ok ? "ok" : "error", result.message);
}

export async function rejectClaimAction(formData: FormData) {
  const session = await guard(REVIEW_ROLES, formData);
  const claimId = trim(formData, "claimId");
  const note = trim(formData, "note");
  if (!claimId) back(formData, "error", "Claim not found.");
  if (note.length < 4) back(formData, "error", "Add a short reason for the rejection.");

  const result = await rejectClaim({ claimId, note, session, ipHash: auditIp() });
  back(formData, result.ok ? "ok" : "error", result.message);
}

export async function issueCardAction(formData: FormData) {
  const session = await guard(REVIEW_ROLES, formData);
  const claimId = trim(formData, "claimId");
  if (!claimId) back(formData, "error", "Claim not found.");

  const result = await issueCard({ claimId, session, ipHash: auditIp() });
  back(formData, result.ok ? "ok" : "error", result.message);
}

export async function rotateCardAction(formData: FormData) {
  const session = await guard(REVIEW_ROLES, formData);
  const cardId = trim(formData, "cardId");
  if (!cardId) back(formData, "error", "Card not found.");
  const result = await rotateCardToken({ cardId, session, ipHash: auditIp() });
  back(formData, result.ok ? "ok" : "error", result.message);
}

export async function retryEmailAction(formData: FormData) {
  const session = await guard(REVIEW_ROLES, formData);
  const cardId = trim(formData, "cardId");
  if (!cardId) back(formData, "error", "Card not found.");
  const result = await retryCardEmail({ cardId, session, ipHash: auditIp() });
  back(formData, result.ok ? "ok" : "error", result.message);
}

/* ------------------------------------------------------- distribution */

export async function importTicketsAction(formData: FormData) {
  const session = await guard(REVIEW_ROLES, formData);
  const raw = formData.get("rows");
  if (typeof raw !== "string" || raw.length === 0) {
    back(formData, "error", "Add buyer rows before importing.");
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(raw);
  } catch {
    back(formData, "error", "The buyer rows could not be read. Re-select the CSV file.");
  }

  const parsed = ticketImportSchema.safeParse({
    filename: trim(formData, "filename") || undefined,
    rows: decoded,
  });
  if (!parsed.success) {
    back(formData, "error", parsed.error.issues[0]?.message ?? "Check the buyer rows.");
  }

  let result: { imported: number; skipped: number; batch: string };
  try {
    result = await importTicketRows({
      input: parsed.data,
      session,
      ipHash: auditIp(),
    });
  } catch (error) {
    back(formData, "error", prismaMessage(error));
  }

  const skipped = result.skipped > 0 ? ` ${result.skipped} already existed and were skipped.` : "";
  back(
    formData,
    "ok",
    `Imported ${result.imported} verified purchases (batch ${result.batch}).${skipped}`,
  );
}

export async function sendInviteAction(formData: FormData) {
  const session = await guard(REVIEW_ROLES, formData);
  const verificationId = trim(formData, "verificationId");
  if (!verificationId) back(formData, "error", "Purchase record not found.");

  const result = await sendTicketInvite({
    verificationId,
    session,
    ipHash: auditIp(),
    force: checkbox(formData, "force"),
  });
  back(formData, result.ok ? "ok" : "error", result.message);
}

export async function sendInvitesBulkAction(formData: FormData) {
  const session = await guard(REVIEW_ROLES, formData);
  const result = await sendPendingInvites({ session, ipHash: auditIp(), limit: 25 });

  const attempted = result.sent + result.skipped + result.failed;
  if (attempted === 0) {
    back(formData, "ok", "There are no unclaimed purchases waiting for an invitation.");
  }

  const parts = [`${result.sent} emailed`];
  if (result.skipped > 0) parts.push(`${result.skipped} link-only (email not configured)`);
  if (result.failed > 0) parts.push(`${result.failed} failed`);
  if (result.remaining > 0) parts.push(`${result.remaining} still pending`);
  back(formData, "ok", `Invitation run finished: ${parts.join(", ")}.`);
}

export async function issueAllVerifiedAction(formData: FormData) {
  const session = await guard(REVIEW_ROLES, formData);
  const result = await issueAllVerified({ session, ipHash: auditIp(), limit: 20 });

  if (result.issued === 0 && result.failed === 0) {
    back(formData, "ok", "There are no verified, unissued claims in the queue.");
  }

  const parts = [`${result.issued} cards issued`];
  if (result.emailed > 0) parts.push(`${result.emailed} emailed`);
  if (result.queued > 0) parts.push(`${result.queued} awaiting manual delivery`);
  if (result.failed > 0) parts.push(`${result.failed} failed`);
  if (result.remaining > 0) parts.push(`${result.remaining} remaining`);
  back(formData, "ok", `Bulk issuance finished: ${parts.join(", ")}.`);
}
