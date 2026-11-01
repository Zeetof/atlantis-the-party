import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatEventDate(
  date: Date,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" },
  timeZone = "Africa/Lagos",
) {
  return new Intl.DateTimeFormat("en-GB", { ...options, timeZone }).format(date);
}

export const CATEGORY_LABELS: Record<string, string> = {
  ARTIST: "Artists",
  DJ: "DJs",
  HYPEMAN: "Hypemen",
  GUEST: "Guest appearances",
};

export const CATEGORY_SINGULAR: Record<string, string> = {
  ARTIST: "Artist",
  DJ: "DJ",
  HYPEMAN: "Hypeman",
  GUEST: "Guest",
};

export const PERFORMER_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING: "Pending confirmation",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  ARCHIVED: "Archive",
};

export const CLAIM_STATUS_LABELS: Record<string, string> = {
  MANUAL_REVIEW: "Manual review",
  VERIFIED: "Purchase verified",
  ISSUED: "Card issued",
  REJECTED: "Rejected",
  PENDING: "Pending",
};

export function truncate(value: string, max = 160) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
