import { describe, expect, it } from "vitest";
import {
  decryptString,
  encryptString,
  hashPII,
  hashToken,
  hmacSha256,
  last4,
  maskEmail,
  newOpaqueToken,
  safeEqualHex,
} from "@/lib/crypto";

describe("encryptString / decryptString", () => {
  it("round-trips PII", () => {
    const plain = "attendee@example.com";
    const cipher = encryptString(plain);
    expect(cipher).not.toContain(plain);
    expect(cipher.startsWith("v1.")).toBe(true);
    expect(decryptString(cipher)).toBe(plain);
  });

  it("produces a unique ciphertext for each call", () => {
    const a = encryptString("same value");
    const b = encryptString("same value");
    expect(a).not.toBe(b);
    expect(decryptString(a)).toBe(decryptString(b));
  });

  it("rejects tampered payloads", () => {
    const cipher = encryptString("ticket-ref-1234");
    const parts = cipher.split(".");
    const tamperedData = Buffer.from("changed").toString("base64url");
    const tampered = [parts[0], parts[1], parts[2], tamperedData].join(".");
    expect(() => decryptString(tampered)).toThrow();
  });

  it("rejects unknown versions and malformed payloads", () => {
    expect(() => decryptString("v2.a.b.c")).toThrow();
    expect(() => decryptString("not-a-payload")).toThrow();
  });
});

describe("hashing", () => {
  it("hashes tokens with SHA-256 hex", () => {
    const hash = hashToken("opaque-token");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hashToken("opaque-token")).toBe(hash);
    expect(hashToken("other-token")).not.toBe(hash);
  });

  it("hashes PII deterministically and normalises case and space", () => {
    const a = hashPII("email:Person@Example.com ");
    const b = hashPII("email:person@example.com");
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it("computes HMAC-SHA256 hex digests", () => {
    const digest = hmacSha256("payload", "secret");
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
    expect(hmacSha256("payload", "secret")).toBe(digest);
    expect(hmacSha256("payload", "other")).not.toBe(digest);
  });
});

describe("safeEqualHex", () => {
  it("compares equal hex digests", () => {
    const digest = hmacSha256("body", "key");
    expect(safeEqualHex(digest, digest)).toBe(true);
  });

  it("rejects different lengths and non-hex strings", () => {
    expect(safeEqualHex("abcd", "abce")).toBe(false);
    expect(safeEqualHex("ab", "abcd")).toBe(false);
    expect(safeEqualHex("zzzz", "zzzz")).toBe(false);
  });
});

describe("tokens and masking", () => {
  it("creates URL-safe opaque tokens with 256 bits of entropy", () => {
    const token = newOpaqueToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token.length).toBeGreaterThanOrEqual(43);
    expect(newOpaqueToken()).not.toBe(token);
  });

  it("masks emails without exposing the local part", () => {
    expect(maskEmail("demo.attendee@example.com")).toBe(`de${"•".repeat(11)}@example.com`);
    expect(maskEmail("ab@example.com")).toBe("ab•••@example.com");
    expect(maskEmail("not-an-email")).toBe("•••");
  });

  it("keeps only the last four characters of a reference", () => {
    expect(last4("POP-1234-5678")).toBe("5678");
    expect(last4("12 34 56")).toBe("3456");
  });
});
