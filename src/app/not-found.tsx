import React from "react";
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-obsidian px-4 py-20 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
        404 — Page Not Found
      </p>
      <h1 className="mt-3 font-serif text-4xl font-medium text-cream sm:text-5xl">
        This Chapter Could Not Be Located
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-cream-secondary">
        The page or timepiece you requested is either unavailable or has been moved within the STEPUP STORIES archive.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          href="/"
          className="rounded bg-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-obsidian transition hover:bg-gold-bright"
        >
          Return Home
        </Link>
        <Link
          href="/catalog"
          className="rounded border border-gold/50 px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-gold-bright transition hover:bg-gold/10"
        >
          Browse Timepieces
        </Link>
      </div>
    </div>
  );
}
