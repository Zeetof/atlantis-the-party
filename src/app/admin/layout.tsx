import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Organizer console",
    template: "%s — Atlantis Organizer",
  },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[100svh] bg-ink">{children}</div>;
}
