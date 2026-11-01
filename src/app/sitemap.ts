import type { MetadataRoute } from "next";

const BASE = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/event", priority: 0.95, changeFrequency: "weekly" },
    { path: "/tickets", priority: 0.95, changeFrequency: "weekly" },
    { path: "/lineup", priority: 0.8, changeFrequency: "weekly" },
    { path: "/999-experience", priority: 0.85, changeFrequency: "monthly" },
    { path: "/claim", priority: 0.7, changeFrequency: "monthly" },
    { path: "/claim/status", priority: 0.4, changeFrequency: "monthly" },
    { path: "/history", priority: 0.75, changeFrequency: "monthly" },
    { path: "/history/atlantis-1", priority: 0.5, changeFrequency: "yearly" },
    { path: "/history/atlantis-2", priority: 0.55, changeFrequency: "yearly" },
    { path: "/history/atlantis-3", priority: 0.55, changeFrequency: "yearly" },
    { path: "/gallery", priority: 0.65, changeFrequency: "monthly" },
    { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  ];

  return routes.map((route) => ({
    url: `${BASE}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
