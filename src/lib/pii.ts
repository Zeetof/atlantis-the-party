import { hashPII } from "@/lib/crypto";

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function emailHash(email: string): string {
  return hashPII(`email:${normaliseEmail(email)}`);
}

export function normaliseTicketRef(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function ticketRefHash(value: string): string {
  return hashPII(`ticket:${normaliseTicketRef(value)}`);
}

export function ipHash(ip: string): string {
  return hashPII(`ip:${ip}`);
}
