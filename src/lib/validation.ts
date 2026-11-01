import { z } from "zod";
import { normaliseEmail, normaliseTicketRef } from "@/lib/pii";

const namePattern = /^[\p{L}\p{N}][\p{L}\p{N} .'’\-]*$/u;

export const claimSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Enter the name that should appear on your card.")
    .max(40, "Keep your display name to 40 characters or fewer.")
    .regex(namePattern, "Use letters, numbers, spaces, apostrophes or hyphens only."),
  email: z
    .string()
    .trim()
    .min(5, "Enter the email used for your ticket purchase.")
    .max(160)
    .email("Enter a valid email address.")
    .transform(normaliseEmail),
  ticketRef: z
    .string()
    .trim()
    .min(4, "Enter the ticket or order reference from Popout Tickets.")
    .max(100, "That reference is too long.")
    .transform(normaliseTicketRef),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Confirm the privacy notice to continue." }),
  }),
});

export type ClaimInput = z.infer<typeof claimSchema>;

export const inviteClaimSchema = z.object({
  token: z.string().trim().min(20, "This invitation link is not valid.").max(200),
  displayName: z
    .string()
    .trim()
    .min(2, "Enter the name that should appear on your card.")
    .max(40, "Keep your display name to 40 characters or fewer.")
    .regex(namePattern, "Use letters, numbers, spaces, apostrophes or hyphens only."),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Confirm the privacy notice to continue." }),
  }),
});

export const ticketImportRowSchema = z.object({
  providerRef: z.string().trim().min(3).max(120),
  email: z.string().trim().email().max(160).transform(normaliseEmail),
  quantity: z.coerce.number().int().min(1).max(20).default(1),
  purchasedAt: z.string().datetime().nullish(),
});

export const ticketImportSchema = z.object({
  filename: z.string().trim().max(200).optional(),
  rows: z.array(ticketImportRowSchema).min(1, "There are no buyer rows to import.").max(1000),
});

export type TicketImportInput = z.infer<typeof ticketImportSchema>;

export const webhookSchema = z
  .object({
    eventSlug: z.string().trim().min(1).max(60).default("atlantis-4"),
    providerRef: z.string().trim().min(3).max(120),
    email: z.string().trim().email().max(160),
    quantity: z.coerce.number().int().min(1).max(20).default(1),
    purchasedAt: z.string().datetime().optional(),
    status: z.enum(["PAID", "COMPLETED", "VERIFIED"]).default("COMPLETED"),
  })
  .strict();

export type WebhookPayload = z.infer<typeof webhookSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(200),
});

export const eventSchema = z.object({
  title: z.string().trim().min(2).max(120),
  editionLabel: z.string().trim().min(2).max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date."),
  timeStart: z.string().trim().min(2).max(40),
  timeEnd: z.string().trim().min(2).max(40),
  venueName: z.string().trim().min(2).max(160),
  venueAddress: z.string().trim().min(2).max(200),
  description: z.string().trim().min(10).max(2000),
  ticketUrl: z.string().trim().url().max(500),
  status: z.enum(["DRAFT", "UPCOMING", "ON_SALE", "SOLD_OUT", "PAST", "POSTPONED"]),
  detailsVerified: z.boolean(),
});

export const performerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  category: z.enum(["ARTIST", "DJ", "HYPEMAN", "GUEST"]),
  editionId: z.string().trim().min(1),
  status: z.enum(["DRAFT", "PENDING", "CONFIRMED", "CANCELLED", "ARCHIVED"]),
  bio: z.string().trim().max(600).optional().or(z.literal("")),
  socials: z.string().trim().url("Enter a full URL.").max(300).optional().or(z.literal("")),
  imagePath: z.string().trim().max(400).optional().or(z.literal("")),
  featured: z.boolean().optional(),
});

export const songSchema = z.object({
  title: z.string().trim().min(1).max(120),
  officialUrl: z.string().trim().url().max(500),
  platform: z.string().trim().min(2).max(40),
  approved: z.boolean(),
  linkStatus: z.enum(["VERIFIED", "SEARCH_FALLBACK"]),
});

export const captionSchema = z.object({
  caption: z.string().trim().min(1).max(240),
});

export const ticketCategorySchema = z.object({
  name: z.string().trim().min(1).max(40),
  priceNaira: z.coerce.number().int().min(0).max(50_000_000),
  channel: z.enum(["ONLINE", "GATE"]),
  verified: z.boolean().optional(),
});

export const statusUpdateSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "HIDDEN"]),
});
