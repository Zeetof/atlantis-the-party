"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import { CONTACT, NAV_LINKS, TICKET_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => firstLinkRef.current?.focus(), 260);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = original;
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const menuVariants = {
    closed: { opacity: 0 },
    open: { opacity: 1, transition: { duration: reduceMotion ? 0 : 0.35, ease: "easeOut" } },
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
        scrolled || open
          ? "border-b border-white/10 bg-ink/90 backdrop-blur-xl"
          : "border-b border-transparent bg-gradient-to-b from-black/65 via-black/20 to-transparent",
      )}
    >
      <div className="shell flex h-[74px] items-center justify-between gap-6 lg:h-[86px]">
        <Wordmark size="sm" className="relative z-50" />

        <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative py-2 text-[11px] font-semibold uppercase tracking-[0.24em] transition-colors",
                  active ? "text-bone" : "text-bone/65 hover:text-bone",
                )}
              >
                {link.label}
                <span
                  className={cn(
                    "absolute -bottom-0.5 left-0 h-px bg-crimson transition-all duration-300",
                    active ? "w-full" : "w-0 group-hover:w-full",
                  )}
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={TICKET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group hidden items-center gap-2 bg-crimson px-5 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-ink transition-colors hover:bg-bone sm:inline-flex"
          >
            Get tickets
            <ArrowUpRight size={14} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            <span className="sr-only">(opens Popout Tickets in a new tab)</span>
          </a>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="relative z-50 flex h-11 w-11 items-center justify-center border border-white/15 text-bone transition-colors hover:border-crimson lg:hidden"
          >
            {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            className="fixed inset-0 top-[74px] z-40 overflow-y-auto bg-ink lg:hidden"
          >
            <div className="shell flex min-h-[calc(100svh-74px)] flex-col justify-between pb-10 pt-10">
              <nav aria-label="Mobile primary" className="flex flex-col">
                {NAV_LINKS.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + index * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      ref={index === 0 ? firstLinkRef : undefined}
                      href={link.href}
                      className="group flex items-baseline justify-between border-b border-white/10 py-5"
                    >
                      <span className="font-display text-4xl uppercase tracking-wide text-bone transition-colors group-hover:text-crimson">
                        {link.label}
                      </span>
                      <span className="font-sans text-[10px] tracking-[0.24em] text-bone/35">
                        0{index + 1}
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="mt-8 space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={TICKET_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between bg-crimson px-4 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-ink"
                  >
                    Get tickets <ArrowUpRight size={15} aria-hidden="true" />
                  </a>
                  <Link
                    href="/claim"
                    className="flex items-center justify-between border border-white/20 px-4 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-bone"
                  >
                    999 card <ArrowUpRight size={15} aria-hidden="true" />
                  </Link>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-bone/45">
                  <p>Dec 30, 2026 · Ikeja, Lagos</p>
                  <a href={CONTACT.phones[0].href} className="hover:text-bone">
                    {CONTACT.phones[0].label}
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
