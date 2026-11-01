import { describe, expect, it } from "vitest";
import { computeCountdown, pad } from "@/lib/countdown";

const START = new Date("2026-12-30T13:00:00+01:00");
const END = new Date("2026-12-30T23:00:00+01:00");

describe("computeCountdown", () => {
  it("counts down to the 13:00 Lagos start", () => {
    const now = new Date("2026-12-30T12:59:58+01:00");
    const state = computeCountdown(now, START, END);
    expect(state.status).toBe("upcoming");
    expect(state.days).toBe(0);
    expect(state.hours).toBe(0);
    expect(state.minutes).toBe(0);
    expect(state.seconds).toBe(2);
    expect(state.totalMs).toBe(2000);
  });

  it("splits a multi-day wait into days, hours, minutes and seconds", () => {
    const now = new Date("2026-12-01T00:00:00+01:00");
    const state = computeCountdown(now, START, END);
    expect(state.status).toBe("upcoming");
    expect(state.days).toBe(29);
    expect(state.hours).toBe(13);
    expect(state.minutes).toBe(0);
    expect(state.seconds).toBe(0);
  });

  it("is live at exactly the start instant", () => {
    expect(computeCountdown(START, START, END).status).toBe("live");
    expect(computeCountdown(new Date("2026-12-30T17:30:00+01:00"), START, END).status).toBe(
      "live",
    );
  });

  it("reports ended at exactly the end instant", () => {
    const state = computeCountdown(END, START, END);
    expect(state.status).toBe("ended");
    expect(state.totalMs).toBe(0);
    expect(state.seconds).toBe(0);
  });

  it("treats a past start as ended when the event window has closed", () => {
    const state = computeCountdown(new Date("2027-01-01T00:00:00+01:00"), START, END);
    expect(state.status).toBe("ended");
  });

  it("never exposes negative values before the event", () => {
    const state = computeCountdown(new Date("2026-12-29T23:59:59+01:00"), START, END);
    expect(state.totalMs).toBeGreaterThan(0);
    expect(state.days).toBeGreaterThanOrEqual(0);
    expect(state.hours).toBeGreaterThanOrEqual(0);
    expect(state.minutes).toBeGreaterThanOrEqual(0);
    expect(state.seconds).toBeGreaterThanOrEqual(0);
  });
});

describe("pad", () => {
  it("pads to two digits by default", () => {
    expect(pad(9)).toBe("09");
    expect(pad(0)).toBe("00");
    expect(pad(42)).toBe("42");
  });

  it("supports a custom width", () => {
    expect(pad(7, 4)).toBe("0007");
  });
});
