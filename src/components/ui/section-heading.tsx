import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow: string;
  title: ReactNode;
  accent?: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
  index?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  accent,
  description,
  align = "left",
  className,
  index,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-4xl", align === "center" && "mx-auto text-center", className)}>
      <div className={cn("flex items-center gap-4", align === "center" && "justify-center")}>
        <span className="eyebrow">{eyebrow}</span>
        {index && <span className="font-display text-xs tracking-[0.2em] text-bone/25">{index}</span>}
      </div>
      <h2 className="mt-6 font-display text-[clamp(2.6rem,6.5vw,5.4rem)] uppercase leading-[0.92] tracking-[-0.01em] text-bone">
        {title}
        {accent && (
          <span className="mt-1 block font-editorial text-[0.52em] font-normal italic tracking-[-0.01em] text-crimson">
            {accent}
          </span>
        )}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-6 max-w-2xl text-sm leading-7 text-bone/60 sm:text-[15px]",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
