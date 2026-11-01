import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, ArrowLeft, LockKeyhole } from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import { loginAction } from "@/app/admin/actions";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  const demoMode = process.env.DEMO_MODE === "true";
  const next = searchParams.next?.startsWith("/admin") ? searchParams.next : "/admin";

  return (
    <main id="main" className="grain flex min-h-[100svh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between">
          <Wordmark size="sm" chrome asLink={false} />
          <Link href="/" className="link-arrow text-bone/40">
            <ArrowLeft size={12} aria-hidden="true" /> Site
          </Link>
        </div>

        <div className="mt-8 border border-white/12 bg-[#0b0b0b]">
          <div className="border-b border-white/10 p-6">
            <p className="text-[8px] font-bold uppercase tracking-[0.24em] text-crimson">
              Organizer access
            </p>
            <h1 className="mt-3 font-display text-3xl uppercase leading-none text-bone">
              Sign in
            </h1>
            <p className="mt-2 text-[11px] leading-5 text-bone/35">
              This console is restricted to WESTHAN.ENT staff. Every session and change is logged.
            </p>
          </div>

          <form action={loginAction} className="space-y-4 p-6">
            <input type="hidden" name="next" value={next} />
            {searchParams.error && (
              <div
                role="alert"
                className="flex items-start gap-2 border border-crimson/40 bg-crimson/[0.08] p-3 text-[10px] leading-5 text-[#ff8a86]"
              >
                <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                {searchParams.error}
              </div>
            )}

            <label className="block">
              <span className="block text-[8px] font-semibold uppercase tracking-[0.18em] text-bone/40">
                Email
              </span>
              <input
                name="email"
                type="email"
                required
                autoComplete="username"
                className="mt-1.5 w-full border border-white/12 bg-ink px-3 py-3 text-sm text-bone focus:border-crimson"
              />
            </label>

            <label className="block">
              <span className="block text-[8px] font-semibold uppercase tracking-[0.18em] text-bone/40">
                Password
              </span>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="current-password"
                className="mt-1.5 w-full border border-white/12 bg-ink px-3 py-3 text-sm text-bone focus:border-crimson"
              />
            </label>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 bg-crimson px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ink transition-colors hover:bg-[#ff4b46]"
            >
              <LockKeyhole size={13} aria-hidden="true" /> Enter console
            </button>
          </form>
        </div>

        {demoMode && (
          <div className="mt-4 border border-amber-400/25 bg-amber-400/[0.05] p-4">
            <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-amber-200/80">
              Demo mode is on
            </p>
            <p className="mt-1.5 text-[10px] leading-5 text-bone/40">
              Local credentials are in your <code className="text-bone/60">.env.local</code> and the
              project README. They are never printed in the page source.
            </p>
          </div>
        )}

        <p className="mt-5 text-center text-[9px] leading-4 text-bone/25">
          Sessions expire after 8 hours. Do not sign in on a shared device.
        </p>
      </div>
    </main>
  );
}
