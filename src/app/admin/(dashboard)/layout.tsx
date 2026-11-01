import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";
import { AdminNav } from "@/components/admin/nav";
import { Wordmark } from "@/components/brand/wordmark";
import { requireAdmin } from "@/server/auth";
import { logoutAction } from "@/app/admin/actions";
import { getEmailConfig } from "@/server/email";
import { getWebhookSecret } from "@/server/ticketing";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const emailConfigured = getEmailConfig().configured;
  const webhookConfigured = Boolean(getWebhookSecret());
  const demoMode = process.env.DEMO_MODE === "true";

  return (
    <div className="flex min-h-[100svh] flex-col lg:flex-row">
      <aside className="border-b border-white/10 bg-[#0a0a0a] lg:sticky lg:top-0 lg:h-[100svh] lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 px-4 py-4 lg:block lg:px-5 lg:py-6">
          <Link href="/admin" aria-label="Organizer overview">
            <Wordmark size="sm" chrome asLink={false} />
          </Link>
          <div className="lg:mt-4">
            <p className="text-[8px] font-bold uppercase tracking-[0.24em] text-crimson">
              Organizer console
            </p>
            <p className="mt-1 text-[10px] text-bone/35">WESTHAN.ENT · internal</p>
          </div>
        </div>

        <div className="px-2 pb-3 lg:px-3">
          <AdminNav />
        </div>

        <div className="mt-auto hidden space-y-3 border-t border-white/10 px-5 py-5 lg:block">
          <div className="space-y-1.5 text-[9px] uppercase tracking-[0.14em]">
            <p className="flex items-center justify-between gap-2">
              <span className="text-bone/30">Email</span>
              <span className={emailConfigured ? "text-emerald-300/70" : "text-amber-200/60"}>
                {emailConfigured ? "configured" : "not configured"}
              </span>
            </p>
            <p className="flex items-center justify-between gap-2">
              <span className="text-bone/30">Webhook</span>
              <span className={webhookConfigured ? "text-emerald-300/70" : "text-amber-200/60"}>
                {webhookConfigured ? "secret set" : "no secret"}
              </span>
            </p>
            {demoMode && (
              <p className="border border-amber-400/30 bg-amber-400/[0.07] px-2 py-1.5 text-[8px] leading-4 text-amber-200/70">
                DEMO_MODE — sandbox flows enabled
              </p>
            )}
          </div>
          <Link href="/" className="link-arrow text-bone/45">
            <ArrowLeft size={12} aria-hidden="true" /> View public site
          </Link>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="border-b border-white/10 bg-[#0a0a0a]">
          <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
            <div className="min-w-0">
              <p className="truncate text-[11px] text-bone/70">{session.name}</p>
              <p className="truncate text-[9px] text-bone/30">{session.email}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="border border-crimson/35 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.16em] text-crimson">
                {session.role}
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 border border-white/15 px-3 py-2 text-[8px] font-bold uppercase tracking-[0.16em] text-bone/50 transition-colors hover:border-crimson hover:text-crimson"
                >
                  <LogOut size={12} aria-hidden="true" /> Sign out
                </button>
              </form>
            </div>
          </div>
        </header>

        <main id="main" className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>

        <footer className="border-t border-white/10 px-4 py-4 text-[9px] uppercase tracking-[0.16em] text-bone/20 sm:px-6 lg:px-8">
          Atlantis organizer console · all actions are logged · never share credentials or private
          card links
        </footer>
      </div>
    </div>
  );
}
