export type CountdownState = {
  status: "upcoming" | "live" | "ended";
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
};

export function computeCountdown(now: Date, start: Date, end: Date): CountdownState {
  const nowMs = now.getTime();
  const startMs = start.getTime();
  const endMs = end.getTime();

  if (nowMs >= endMs) {
    return { status: "ended", days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
  }

  if (nowMs >= startMs) {
    return { status: "live", days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
  }

  const totalMs = startMs - nowMs;
  const totalSeconds = Math.floor(totalMs / 1000);
  return {
    status: "upcoming",
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalMs,
  };
}

export function pad(value: number, length = 2) {
  return String(value).padStart(length, "0");
}
