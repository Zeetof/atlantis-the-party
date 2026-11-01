import Link from "next/link";
import { cn } from "@/lib/utils";

type WordmarkProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  asLink?: boolean;
  chrome?: boolean;
};

const sizes = {
  sm: { main: "text-[1.35rem] leading-none tracking-[0.05em]", sub: "text-[7px] tracking-[0.52em]" },
  md: { main: "text-[1.7rem] leading-none tracking-[0.05em]", sub: "text-[8px] tracking-[0.55em]" },
  lg: { main: "text-[2.4rem] leading-none tracking-[0.04em]", sub: "text-[9px] tracking-[0.58em]" },
};

export function Wordmark({ className, size = "md", asLink = true, chrome = false }: WordmarkProps) {
  const styles = sizes[size];
  const inner = (
    <span className={cn("inline-flex flex-col", className)}>
      <span
        className={cn(
          "font-display uppercase",
          styles.main,
          chrome ? "text-chrome" : "text-bone",
        )}
      >
        Atlantis
      </span>
      <span className={cn("mt-1 flex items-center gap-2 pl-[0.12em]", styles.sub)}>
        <span className="h-px w-3 bg-crimson" aria-hidden="true" />
        <span className="font-sans font-semibold uppercase text-bone/55">The Party</span>
      </span>
    </span>
  );

  if (!asLink) return inner;
  return (
    <Link href="/" aria-label="Atlantis The Party — home" className="group inline-flex">
      {inner}
    </Link>
  );
}
