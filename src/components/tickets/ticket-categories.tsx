import { ArrowUpRight, Info } from "lucide-react";
import { formatNaira } from "@/lib/utils";
import { TICKET_URL } from "@/lib/site";

type Category = {
  id: string;
  name: string;
  priceNaira: number;
  channel: string;
  note: string | null;
  verified: boolean;
};

export function TicketCategories({
  categories,
  showActions = true,
}: {
  categories: Category[];
  showActions?: boolean;
}) {
  const online = categories.filter((category) => category.channel === "ONLINE");
  const gate = categories.filter((category) => category.channel === "GATE");

  return (
    <div>
      <div className="grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => {
          const isOnline = category.channel === "ONLINE";
          return (
            <div key={category.id} className="relative bg-ink p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-bone/35">
                  {isOnline ? "Online" : "At gate"}
                </span>
                {!category.verified && (
                  <span
                    className="inline-flex items-center gap-1 text-[8px] uppercase tracking-[0.12em] text-crimson/70"
                    title="Price transcribed from the flyer"
                  >
                    <Info size={10} aria-hidden="true" /> Flyer price
                  </span>
                )}
              </div>
              <h3 className="mt-4 font-display text-2xl uppercase leading-none tracking-wide text-bone">
                {category.name}
              </h3>
              <p className="mt-3 font-display text-3xl text-chrome">{formatNaira(category.priceNaira)}</p>
              {category.note && (
                <p className="mt-3 text-[10px] leading-4 text-bone/35">{category.note}</p>
              )}
              {showActions && isOnline && (
                <a
                  href={TICKET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex w-full items-center justify-between border border-crimson/40 px-3 py-3 text-[9px] font-bold uppercase tracking-[0.18em] text-crimson transition-colors hover:bg-crimson hover:text-ink"
                >
                  Buy online
                  <ArrowUpRight size={13} aria-hidden="true" />
                  <span className="sr-only">(opens Popout Tickets in a new tab)</span>
                </a>
              )}
              {showActions && !isOnline && (
                <p className="mt-5 border border-white/10 px-3 py-3 text-center text-[9px] font-semibold uppercase tracking-[0.16em] text-bone/35">
                  Available at the gate
                </p>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex flex-col gap-3 border border-white/10 bg-white/[0.02] p-4 text-[11px] leading-5 text-bone/45 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl">
          Prices are transcribed from the official Atlantis 4.0 flyer and are not yet marked as
          verified in the dashboard. Confirm the current price and availability on Popout Tickets
          before purchase.
        </p>
        <a
          href={TICKET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-bone/70 transition-colors hover:text-crimson"
        >
          Official checkout <ArrowUpRight size={13} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
