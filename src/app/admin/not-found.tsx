import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60svh] flex-col items-start justify-center gap-4">
      <p className="text-[8px] font-bold uppercase tracking-[0.24em] text-crimson">Not found</p>
      <h1 className="font-display text-4xl uppercase leading-none text-bone">
        No record here
      </h1>
      <p className="max-w-md text-[11px] leading-5 text-bone/40">
        The record you followed may have been removed, or the identifier is invalid. Return to the
        overview and retry from the list.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin"
          className="bg-bone px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.16em] text-ink hover:bg-white"
        >
          Organizer overview
        </Link>
        <Link
          href="/admin/claims"
          className="border border-white/20 px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.16em] text-bone/65 hover:border-crimson hover:text-crimson"
        >
          Claims queue
        </Link>
      </div>
    </div>
  );
}
