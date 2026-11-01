const base = (process.env.SMOKE_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

type Check = { name: string; run: () => Promise<string | null> };

const publicRoutes = [
  "/",
  "/event",
  "/lineup",
  "/history",
  "/history/atlantis-1",
  "/history/atlantis-2",
  "/history/atlantis-3",
  "/gallery",
  "/999-experience",
  "/claim",
  "/claim/status",
  "/tickets",
  "/faq",
  "/contact",
  "/privacy",
  "/robots.txt",
  "/sitemap.xml",
  "/admin/login",
];

const checks: Check[] = [
  ...publicRoutes.map((route) => ({
    name: `GET ${route}`,
    run: async () => {
      const response = await fetch(`${base}${route}`, { redirect: "manual" });
      return response.status === 200 ? null : `expected 200, received ${response.status}`;
    },
  })),
  {
    name: "GET /admin redirects to login",
    run: async () => {
      const response = await fetch(`${base}/admin`, { redirect: "manual" });
      const location = response.headers.get("location") ?? "";
      if (![302, 307, 308].includes(response.status)) {
        return `expected a redirect, received ${response.status}`;
      }
      return location.includes("/admin/login") ? null : `unexpected location: ${location}`;
    },
  },
  {
    name: "Security headers on /",
    run: async () => {
      const response = await fetch(base, { redirect: "manual" });
      const missing = ["x-content-type-options", "x-frame-options", "referrer-policy"].filter(
        (header) => !response.headers.get(header),
      );
      return missing.length ? `missing ${missing.join(", ")}` : null;
    },
  },
  {
    name: "Unsigned ticket webhook is rejected",
    run: async () => {
      const response = await fetch(`${base}/api/tickets/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerRef: "SMOKE-0001", email: "smoke@example.com" }),
      });
      return response.status === 401 ? null : `expected 401, received ${response.status}`;
    },
  },
  {
    name: "Invalid claim is rejected",
    run: async () => {
      const response = await fetch(`${base}/api/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      return response.status === 400 ? null : `expected 400, received ${response.status}`;
    },
  },
  {
    name: "Invalid claim lookup is rejected",
    run: async () => {
      const response = await fetch(`${base}/api/claims/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      return response.status === 400 ? null : `expected 400, received ${response.status}`;
    },
  },
  {
    name: "Unknown claim lookup is masked",
    run: async () => {
      const response = await fetch(`${base}/api/claims/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicRef: "ATP4-NOPE00", email: "nobody@example.com" }),
      });
      const text = await response.text();
      if (response.status !== 404) return `expected 404, received ${response.status}`;
      return /card|token/i.test(text) ? "response reveals card data" : null;
    },
  },
  {
    name: "Invalid invite claim is rejected",
    run: async () => {
      const response = await fetch(`${base}/api/claims/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "x".repeat(32), displayName: "Ada Okafor", consent: true }),
      });
      if (response.status !== 400) return `expected 400, received ${response.status}`;
      const text = await response.text();
      return /card-|tokenHash|purchaser/i.test(text) ? "response reveals internal data" : null;
    },
  },
  {
    name: "Cross-origin invite claim is rejected",
    run: async () => {
      const response = await fetch(`${base}/api/claims/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "https://evil.example" },
        body: JSON.stringify({ token: "x".repeat(32), displayName: "Ada Okafor", consent: true }),
      });
      return response.status === 403 ? null : `expected 403, received ${response.status}`;
    },
  },
  {
    name: "Invitation page renders a safe invalid state",
    run: async () => {
      const response = await fetch(`${base}/claim/invite/${"a".repeat(32)}`, {
        redirect: "manual",
      });
      if (response.status !== 200) return `expected 200, received ${response.status}`;
      const html = await response.text();
      if (!/not valid/i.test(html)) return "invalid invitation state is missing";
      return /claim\.invite\.|purchaserEmail|providerRefHash/i.test(html)
        ? "invitation page leaks internal data"
        : null;
    },
  },
  {
    name: "GET /admin/import redirects to login",
    run: async () => {
      const response = await fetch(`${base}/admin/import`, { redirect: "manual" });
      const location = response.headers.get("location") ?? "";
      if (![302, 307, 308].includes(response.status)) {
        return `expected a redirect, received ${response.status}`;
      }
      return location.includes("/admin/login") ? null : `unexpected location: ${location}`;
    },
  },
  {
    name: "GET /admin/invites redirects to login",
    run: async () => {
      const response = await fetch(`${base}/admin/invites`, { redirect: "manual" });
      const location = response.headers.get("location") ?? "";
      if (![302, 307, 308].includes(response.status)) {
        return `expected a redirect, received ${response.status}`;
      }
      return location.includes("/admin/login") ? null : `unexpected location: ${location}`;
    },
  },
];

async function main() {
  let failures = 0;

  for (const check of checks) {
    try {
      const error = await check.run();
      if (error) {
        failures += 1;
        console.error(`FAIL  ${check.name} — ${error}`);
      } else {
        console.log(`PASS  ${check.name}`);
      }
    } catch (error) {
      failures += 1;
      console.error(
        `FAIL  ${check.name} — ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  console.log(`\n${checks.length - failures}/${checks.length} checks passed against ${base}`);
  if (failures > 0) process.exitCode = 1;
}

void main();
