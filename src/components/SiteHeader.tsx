"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, Search } from "lucide-react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/collections", label: "Collections" },
  { href: "/catalog", label: "Timepieces" },
  { href: "/orders/track", label: "Track Order" },
  { href: "/about", label: "Brand Story" },
  { href: "/concierge", label: "Concierge" }
];

export function SiteHeader({ businessName }: { businessName: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-50 h-20 border-b border-gold/25 bg-obsidian/90 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-bright"
          aria-label={`${businessName} Home`}
        >
          <Image
            src="/assets/brand/logo.jpg"
            alt={`${businessName} Official Emblem`}
            width={92}
            height={52}
            priority
            className="h-12 w-auto rounded border border-gold/30 object-cover transition duration-300 group-hover:border-gold-bright"
          />
          <span className="font-serif text-lg font-semibold tracking-[0.18em] text-gold transition-colors duration-200 group-hover:text-gold-bright sm:text-xl">
            {businessName}
          </span>
        </Link>

        <nav aria-label="Primary Navigation" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`relative py-1 text-xs uppercase tracking-[0.18em] transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-full after:origin-left after:bg-gold-bright after:transition-transform after:duration-300 ${
                      isActive
                        ? "font-semibold text-gold-bright after:scale-x-100"
                        : "text-cream-secondary after:scale-x-0 hover:text-gold-bright hover:after:scale-x-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/catalog"
            aria-label="Search and filter timepieces"
            className="btn-luxury inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 bg-surface text-gold hover:border-gold-bright hover:text-gold-bright"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </Link>

          <Link
            href="/concierge?type=private_viewing"
            className="btn-luxury hidden rounded border border-gold/50 bg-gold/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-gold-bright hover:bg-gold hover:text-obsidian sm:inline-flex"
          >
            Book a Private Viewing
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            className="btn-luxury inline-flex h-10 w-10 items-center justify-center rounded border border-gold/30 bg-surface text-gold hover:border-gold-bright lg:hidden"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          id="mobile-nav-drawer"
          className="animate-page-enter border-b border-gold/40 bg-charcoal px-4 py-6 shadow-2xl lg:hidden"
        >
          <ul className="flex flex-col space-y-3">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block border-b border-gold/10 py-2.5 text-sm uppercase tracking-[0.16em] text-cream transition-colors hover:text-gold-bright"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <Link
                href="/concierge?type=private_viewing"
                className="btn-luxury inline-flex w-full items-center justify-center rounded bg-gold px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-obsidian hover:bg-gold-bright"
              >
                Book a Private Viewing
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
