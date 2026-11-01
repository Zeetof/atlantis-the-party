import { headers } from "next/headers";
import { hashPII } from "@/lib/crypto";

export function getClientIp(): string {
  const list = headers();
  const forwarded = list.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return list.get("x-real-ip") ?? "127.0.0.1";
}

export function getIpHash(): string {
  return hashPII(`ip:${getClientIp()}`);
}
