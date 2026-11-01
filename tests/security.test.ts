import { beforeEach, describe, expect, it } from "vitest";
import { hmacSha256 } from "@/lib/crypto";
import { verifyWebhookSignature } from "@/server/ticketing";
import { rateLimit, resetRateLimits } from "@/server/rate-limit";

const SECRET = "test-webhook-secret-0123456789abcdef";

describe("verifyWebhookSignature", () => {
  const body = JSON.stringify({ providerRef: "POP-001", email: "buyer@example.com" });

  it("accepts a correct raw-body signature", () => {
    expect(verifyWebhookSignature(body, hmacSha256(body, SECRET), SECRET)).toBe(true);
  });

  it("accepts the sha256= prefix used by providers", () => {
    expect(verifyWebhookSignature(body, `sha256=${hmacSha256(body, SECRET)}`, SECRET)).toBe(true);
  });

  it("rejects a modified body", () => {
    const signature = hmacSha256(body, SECRET);
    expect(
      verifyWebhookSignature(body.replace("buyer", "attacker"), signature, SECRET),
    ).toBe(false);
  });

  it("rejects a wrong secret or missing signature", () => {
    expect(verifyWebhookSignature(body, hmacSha256(body, "other-secret"), SECRET)).toBe(false);
    expect(verifyWebhookSignature(body, null, SECRET)).toBe(false);
    expect(verifyWebhookSignature(body, "", SECRET)).toBe(false);
  });
});

describe("rateLimit", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("allows up to the limit and then blocks", () => {
    for (let i = 0; i < 3; i += 1) {
      expect(rateLimit("claim:test", 3, 60_000).ok).toBe(true);
    }
    const blocked = rateLimit("claim:test", 3, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("tracks keys independently", () => {
    rateLimit("a", 1, 60_000);
    expect(rateLimit("a", 1, 60_000).ok).toBe(false);
    expect(rateLimit("b", 1, 60_000).ok).toBe(true);
  });

  it("resets after the window passes", () => {
    rateLimit("window", 1, 1);
    const start = Date.now();
    while (Date.now() - start < 10) {
      // wait for the 1ms window to elapse
    }
    expect(rateLimit("window", 1, 1).ok).toBe(true);
  });
});
