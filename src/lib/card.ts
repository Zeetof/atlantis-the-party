import { createHash, randomInt } from "node:crypto";

const PUBLIC_REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const ID_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

function randomFrom(alphabet: string, length: number): string {
  let output = "";
  for (let i = 0; i < length; i += 1) {
    output += alphabet[randomInt(0, alphabet.length)];
  }
  return output;
}

export function makeClaimRef(): string {
  return `ATP4-${randomFrom(PUBLIC_REF_ALPHABET, 6)}`;
}

export function makeCardPublicId(): string {
  return randomFrom(ID_ALPHABET, 16);
}

export function makeCardNumber(sequence: number): string {
  const safe = Math.max(1, Math.floor(sequence));
  return `ATP-999-2026-${String(safe).padStart(6, "0")}`;
}

export function makeCardSuffix(): string {
  return randomFrom(PUBLIC_REF_ALPHABET, 4);
}

export function pickSongIndex(seed: string, count: number): number {
  if (count <= 0) throw new Error("At least one approved song is required.");
  const digest = createHash("sha256").update(seed).digest();
  return digest.readUInt32BE(0) % count;
}

export function maskCardNumber(cardNumber: string): string {
  const parts = cardNumber.split("-");
  if (parts.length < 2) return "••••";
  return `${parts.slice(0, -1).join("-")}-••••`;
}
