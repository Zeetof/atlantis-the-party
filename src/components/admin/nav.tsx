"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCog,
  CreditCard,
  FileUp,
  Fingerprint,
  Images,
  LayoutDashboard,
  ListMusic,
  Mail,
  ScrollText,
  Send,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/claims", label: "Claims", icon: Fingerprint },
  { href: "/admin/cards", label: "Cards", icon: CreditCard },
  { href: "/admin/import", label: "Import", icon: FileUp },
  { href: "/admin/invites", label: "Invites", icon: Send },
  { href: "/admin/event", label: "Event", icon: CalendarCog },
  { href: "/admin/lineup", label: "Lineup", icon: Users },
  { href: "/admin/media", label: "Media", icon: Images },
  { href: "/admin/songs", label: "Songs", icon: ListMusic },
  { href: "/admin/emails", label: "Email log", icon: Mail },
  { href: "/admin/audit", label: "Audit", icon: ScrollText },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin sections" className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5">
      {LINKS.map((link) => {
        const active =
          link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 border-l-2 px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors",
              active
                ? "border-crimson bg-white/[0.05] text-bone"
                : "border-transparent text-bone/45 hover:bg-white/[0.03] hover:text-bone/80",
            )}
          >
            <link.icon size={14} aria-hidden="true" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
