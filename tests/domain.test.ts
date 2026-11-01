import { describe, expect, it } from "vitest";
import {
  makeCardNumber,
  makeCardPublicId,
  makeClaimRef,
  maskCardNumber,
  pickSongIndex,
} from "@/lib/card";
import { emailHash, ipHash, normaliseTicketRef, ticketRefHash } from "@/lib/pii";
import { claimSchema, webhookSchema, statusUpdateSchema } from "@/lib/validation";

describe("card identifiers", () => {
  it("formats sequential card numbers", () => {
    expect(makeCardNumber(1)).toBe("ATP-999-2026-000001");
    expect(makeCardNumber(42)).toBe("ATP-999-2026-000042");
    expect(makeCardNumber(1_000_000)).toMatch(/^ATP-999-2026-\d{6,}$/);
  });

  it("clamps invalid sequences to 1", () => {
    expect(makeCardNumber(0)).toBe("ATP-999-2026-000001");
    expect(makeCardNumber(-5)).toBe("ATP-999-2026-000001");
  });

  it("masks all but the final segment of a card number", () => {
    expect(maskCardNumber("ATP-999-2026-000042")).toBe("ATP-999-2026-••••");
    expect(maskCardNumber("weird")).toBe("••••");
  });

  it("creates readable public references and opaque IDs", () => {
    const ref = makeClaimRef();
    expect(ref).toMatch(/^ATP4-[A-HJ-NP-Z2-9]{6}$/);
    expect(makeCardPublicId()).toMatch(/^[a-km-z2-9]{16}$/);
    expect(makeClaimRef()).not.toBe(ref);
  });

  it("assigns songs deterministically from the claim seed", () => {
    const first = pickSongIndex("claim-id-1", 5);
    expect(pickSongIndex("claim-id-1", 5)).toBe(first);
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThan(5);
    expect(() => pickSongIndex("claim-id-1", 0)).toThrow();
  });
});

describe("PII normalisation", () => {
  it("normalises ticket references before hashing", () => {
    expect(normaliseTicketRef(" pop-1234 5678 ")).toBe("POP-12345678");
    expect(ticketRefHash("pop-1234 5678")).toBe(ticketRefHash("POP-12345678"));
  });

  it("hashes emails independently of case and padding", () => {
    expect(emailHash(" Person@Example.com ")).toBe(emailHash("person@example.com"));
  });

  it("hashes IPs without storing the raw value", () => {
    const hash = ipHash("203.0.113.10");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toContain("203.0.113.10");
  });
});

describe("claimSchema", () => {
  const base = {
    displayName: "Ada Okafor",
    email: " Ada@Example.com ",
    ticketRef: " pop-1234 5678 ",
    consent: true as const,
  };

  it("accepts a valid claim and normalises email and reference", () => {
    const parsed = claimSchema.safeParse(base);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.email).toBe("ada@example.com");
      expect(parsed.data.ticketRef).toBe("POP-12345678");
    }
  });

  it("requires consent", () => {
    const parsed = claimSchema.safeParse({ ...base, consent: false });
    expect(parsed.success).toBe(false);
  });

  it("rejects short names, malformed emails and short references", () => {
    expect(claimSchema.safeParse({ ...base, displayName: "A" }).success).toBe(false);
    expect(claimSchema.safeParse({ ...base, displayName: "<script>" }).success).toBe(false);
    expect(claimSchema.safeParse({ ...base, email: "not-an-email" }).success).toBe(false);
    expect(claimSchema.safeParse({ ...base, ticketRef: "12" }).success).toBe(false);
  });
});

describe("webhookSchema", () => {
  it("applies safe defaults", () => {
    const parsed = webhookSchema.safeParse({
      providerRef: "POP-001",
      email: "buyer@example.com",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.eventSlug).toBe("atlantis-4");
      expect(parsed.data.quantity).toBe(1);
      expect(parsed.data.status).toBe("COMPLETED");
    }
  });

  it("strips unknown fields", () => {
    const parsed = webhookSchema.safeParse({
      providerRef: "POP-001",
      email: "buyer@example.com",
      cardNumber: "4111 1111 1111 1111",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects invalid quantities", () => {
    expect(
      webhookSchema.safeParse({ providerRef: "POP-001", email: "buyer@example.com", quantity: 0 })
        .success,
    ).toBe(false);
  });
});

describe("statusUpdateSchema", () => {
  it("allows only the four review statuses", () => {
    expect(statusUpdateSchema.safeParse({ status: "APPROVED" }).success).toBe(true);
    expect(statusUpdateSchema.safeParse({ status: "DELETED" }).success).toBe(false);
  });
});
