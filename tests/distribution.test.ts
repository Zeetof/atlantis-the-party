import { describe, expect, it } from "vitest";
import { normaliseCsvRef, parseCsvRows, parseTicketCsv } from "@/lib/ticket-csv";
import { inviteClaimSchema, ticketImportSchema } from "@/lib/validation";

describe("CSV reader", () => {
  it("handles quoted fields, escaped quotes and CRLF", () => {
    const rows = parseCsvRows('\uFEFFref,email\r\n"POP,1","a""b@example.com"\r\n');
    expect(rows).toEqual([
      ["ref", "email"],
      ["POP,1", 'a"b@example.com'],
    ]);
  });

  it("normalises references to uppercase without spaces", () => {
    expect(normaliseCsvRef(" pop-1234 5678 ")).toBe("POP-12345678");
  });
});

describe("parseTicketCsv", () => {
  it("detects header aliases and validates rows", () => {
    const result = parseTicketCsv(
      [
        "Order Reference,Purchaser Email,Quantity,Purchase Date",
        'POP-1001,buyer@example.com,2,2026-11-01T10:00:00.000Z',
        'POP-1002,"second@example.com",1,2026-11-02',
      ].join("\n"),
    );

    expect(result.usedHeader).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({
      providerRef: "POP-1001",
      email: "buyer@example.com",
      quantity: 2,
      line: 2,
    });
    expect(result.rows[1]?.purchasedAt).toBe(new Date("2026-11-02").toISOString());
  });

  it("falls back to fixed columns when no header is present", () => {
    const result = parseTicketCsv("POP-2001,guest@example.com,3\nPOP-2002,other@example.com");
    expect(result.usedHeader).toBe(false);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({ quantity: 3, purchasedAt: null });
    expect(result.rows[1]).toMatchObject({ quantity: 1 });
  });

  it("rejects invalid emails, quantities and duplicate references", () => {
    const result = parseTicketCsv(
      [
        "reference,email,quantity",
        "POP-1,not-an-email,1",
        "POP-2,buyer@example.com,0",
        "POP-3,buyer@example.com,2",
        "POP-3,duplicate@example.com,1",
      ].join("\n"),
    );

    expect(result.rows).toHaveLength(1);
    expect(result.errors.map((error) => error.message)).toEqual([
      "Invalid purchaser email.",
      "Quantity must be a whole number from 1 to 20.",
      "Duplicate order reference in this file.",
    ]);
  });

  it("caps large exports at the configured maximum", () => {
    const lines = ["reference,email"];
    for (let index = 0; index < 5; index += 1) {
      lines.push(`POP-${index},buyer${index}@example.com`);
    }
    const result = parseTicketCsv(lines.join("\n"), 3);
    expect(result.rows).toHaveLength(3);
    expect(result.errors.at(-1)?.message).toContain("Only the first 3");
  });

  it("returns an error for an empty file", () => {
    expect(parseTicketCsv("").errors[0]?.message).toBe("The file is empty.");
  });
});

describe("inventory validation", () => {
  it("requires a real consent flag and a plausible token", () => {
    const base = { token: "x".repeat(32), displayName: "Ada Okafor", consent: true };
    expect(inviteClaimSchema.safeParse(base).success).toBe(true);
    expect(inviteClaimSchema.safeParse({ ...base, consent: false }).success).toBe(false);
    expect(inviteClaimSchema.safeParse({ ...base, token: "short" }).success).toBe(false);
  });

  it("coerces imported quantities and rejects oversized batches", () => {
    const parsed = ticketImportSchema.safeParse({
      filename: "buyers.csv",
      rows: [{ providerRef: "POP-1", email: "Buyer@Example.com ", quantity: "2" }],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.rows[0]).toMatchObject({ quantity: 2, email: "buyer@example.com" });
    }

    const oversized = ticketImportSchema.safeParse({
      rows: Array.from({ length: 1001 }, (_, index) => ({
        providerRef: `POP-${index}`,
        email: "buyer@example.com",
      })),
    });
    expect(oversized.success).toBe(false);
  });
});
