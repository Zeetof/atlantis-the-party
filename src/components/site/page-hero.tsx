import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  eyebrow: string;
  title: ReactNode;
  accent?: ReactNode;
  description?: ReactNode;
  image?: { src: string; alt: string; priority?: boolean };
  meta?: { label: string; value: string }[];
  children?: ReactNode;
  align?: "left" | "center";
  compact?: boolean;
};

export function PageHero({
  eyebrow,
  title,
  accent,
  description,
  image,
  meta,
  children,
  align = "left",
  compact = false,
}: PageHeroProps) {
  return (
    <section className="grain relative overflow-hidden border-b border-white/10 pb-14 pt-32 sm:pt-36 lg:pb-20 lg:pt-44">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute -right-20 top-0 h-[36rem] w-[36rem] rounded-full opacity-50 blur-[100px]"
          style={{
            background:
              "radial-gradient(circle, rgba(229,57,53,0.16) 0%, rgba(229,57,53,0.03) 45%, transparent 70%)",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-white/5" />
      </div>

      <div className="shell">
        <div className={cn("grid gap-12", image ? "lg:grid-cols-[1.1fr_0.9fr] lg:items-center" : "")}>
          <div className={cn(align === "center" && "mx-auto max-w-3xl text-center")}>
            <p className={cn("eyebrow", align === "center" && "justify-center")}>{eyebrow}</p>
            <h1
              className={cn(
                "mt-6 font-display uppercase leading-[0.86] tracking-[-0.01em] text-bone",
                compact
                  ? "text-[clamp(2.8rem,6vw,4.8rem)]"
                  : "text-[clamp(3.4rem,8vw,7rem)]",
              )}
            >
              {title}
              {accent && (
                <span className="mt-4 block font-editorial text-[clamp(1.9rem,4vw,3.2rem)] font-normal normal-case italic leading-none tracking-normal text-crimson">
                  {accent}
                </span>
              )}
            </h1>
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
            {meta && (
              <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/10 pt-6">
                {meta.map((item) => (
                  <div key={item.label}>
                    <dt className="text-[8px] font-semibold uppercase tracking-[0.24em] text-bone/30">
                      {item.label}
                    </dt>
                    <dd className="mt-1.5 text-sm text-bone/80">{item.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {children && <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{children}</div>}
          </div>

          {image && (
            <div className="relative mx-auto w-full max-w-[360px] lg:ml-auto lg:mr-0 lg:max-w-[400px]">
              <div aria-hidden="true" className="absolute -bottom-3 -right-3 left-6 top-6 border border-crimson/30" />
              <div className="relative aspect-[4/5] overflow-hidden border border-white/15 shadow-card">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  priority={image.priority}
                  sizes="(min-width: 1024px) 400px, 80vw"
                  className="object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
