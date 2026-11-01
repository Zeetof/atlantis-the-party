import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TICKET_URL } from "@/lib/site";

type Variant = "primary" | "light" | "outline" | "dark";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-crimson text-ink hover:bg-[#ff4b46]",
  light: "bg-bone text-ink hover:bg-white",
  outline: "border border-bone/25 text-bone hover:border-crimson hover:text-crimson",
  dark: "bg-ink text-bone hover:bg-charcoal",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-3 text-[10px] tracking-[0.2em]",
  md: "px-6 py-4 text-[11px] tracking-[0.22em]",
  lg: "px-8 py-4 text-[11px] tracking-[0.24em] sm:px-10 sm:py-5",
};

type CommonProps = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
};

function base(variant: Variant, size: Size, className?: string) {
  return cn(
    "group inline-flex items-center justify-center gap-3 font-sans font-bold uppercase transition-all duration-300",
    variants[variant],
    sizes[size],
    className,
  );
}

export function TicketLink({
  children = "Get tickets",
  variant = "primary",
  size = "md",
  className,
  label,
}: CommonProps & { label?: string }) {
  return (
    <a
      href={TICKET_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label ?? children} (opens Popout Tickets in a new tab)`}
      className={base(variant, size, className)}
    >
      {children}
      <ArrowUpRight
        size={15}
        aria-hidden="true"
        className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      />
    </a>
  );
}

export function ActionLink({
  href,
  children,
  variant = "outline",
  size = "md",
  className,
  external = false,
}: CommonProps & { href: string; external?: boolean }) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={base(variant, size, className)}
      >
        {children}
        <ArrowUpRight size={15} aria-hidden="true" />
      </a>
    );
  }
  return (
    <Link href={href} className={base(variant, size, className)}>
      {children}
      <ArrowRight
        size={15}
        aria-hidden="true"
        className="transition-transform duration-300 group-hover:translate-x-1"
      />
    </Link>
  );
}
