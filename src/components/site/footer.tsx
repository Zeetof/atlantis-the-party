import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import { CONTACT, DISCLAIMER, FOOTER_LINKS, HISTORY_NAV, NAV_LINKS } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#050505]">
      <div className="shell relative z-10 pt-16 sm:pt-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Wordmark size="lg" chrome />
            <p className="mt-6 max-w-xs text-sm leading-7 text-bone/55">
              Four editions deep. One night closer. Atlantis returns for Detty December on December
              30, 2026.
            </p>
            <a
              href="https://popouttickets.com/events/atpdettydecember"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-3 border border-crimson/40 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-crimson transition-colors hover:bg-crimson hover:text-ink"
            >
              Official tickets <ArrowUpRight size={14} aria-hidden="true" />
            </a>
            <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-bone/30">
              Ticketing by Popout Tickets
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8 lg:grid-cols-3">
            <nav aria-label="Explore">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.26em] text-bone/35">Explore</h2>
              <ul className="mt-5 space-y-3">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-bone/65 transition-colors hover:text-bone">
                      {link.label}
                    </Link>
                  </li>
                ))}
                {FOOTER_LINKS.slice(0, 3).map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-bone/65 transition-colors hover:text-bone">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="The archive">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.26em] text-bone/35">The archive</h2>
              <ul className="mt-5 space-y-3">
                {HISTORY_NAV.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="group block">
                      <span className="block text-sm text-bone/65 transition-colors group-hover:text-bone">
                        {item.label}
                      </span>
                      <span className="block text-[10px] uppercase tracking-[0.12em] text-bone/30">
                        {item.meta}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.26em] text-bone/35">Contact</h2>
              <ul className="mt-5 space-y-3">
                {CONTACT.phones.map((phone) => (
                  <li key={phone.href}>
                    <a href={phone.href} className="text-sm text-bone/65 transition-colors hover:text-bone">
                      {phone.label}
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href={CONTACT.maps}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-bone/65 transition-colors hover:text-bone"
                  >
                    Watercress Event Center
                    <ArrowUpRight size={12} aria-hidden="true" />
                  </a>
                </li>
                <li>
                  <Link href="/claim" className="text-sm text-bone/65 transition-colors hover:text-bone">
                    999 card claims
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-white/10 py-8">
          <p className="max-w-4xl text-[11px] leading-6 text-bone/35">{DISCLAIMER}</p>
          <div className="mt-6 flex flex-col gap-3 text-[10px] uppercase tracking-[0.18em] text-bone/30 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 WESTHAN.ENT. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-5">
              <Link href="/privacy" className="hover:text-bone">
                Privacy
              </Link>
              <Link href="/admin" className="hover:text-bone">
                Organizer access
              </Link>
              <span>Made for Lagos</span>
            </div>
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none relative -mb-[2.4vw] select-none overflow-hidden text-center"
      >
        <span className="block font-display text-[23vw] uppercase leading-[0.72] tracking-[-0.02em] text-outline opacity-30">
          Atlantis
        </span>
      </div>
    </footer>
  );
}
