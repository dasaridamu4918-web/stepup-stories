"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HorizontalCarouselProps {
  ariaLabel: string;
  children: React.ReactNode;
  itemClassName?: string;
}

export function HorizontalCarousel({
  ariaLabel,
  children,
  itemClassName = "w-[82vw] sm:w-[320px] lg:w-[280px]"
}: HorizontalCarouselProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const { scrollLeft, scrollWidth, clientWidth } = track;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateScrollButtons();
    track.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons, { passive: true });

    return () => {
      track.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [updateScrollButtons]);

  const scrollByDirection = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const step = Math.max(track.clientWidth * 0.78, 280) * direction;

    track.scrollBy({
      left: step,
      behavior: prefersReducedMotion ? "auto" : "smooth"
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollByDirection(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollByDirection(-1);
    }
  };

  const items = React.Children.toArray(children);

  return (
    <div className="relative" role="region" aria-label={ariaLabel}>
      {/* Carousel Controls */}
      <div className="mb-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => scrollByDirection(-1)}
          disabled={!canScrollLeft}
          aria-label={`Previous items in ${ariaLabel}`}
          className="btn-luxury inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold/35 bg-surface text-gold-bright disabled:cursor-not-allowed disabled:opacity-35 hover:border-gold-bright hover:bg-gold/10"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => scrollByDirection(1)}
          disabled={!canScrollRight}
          aria-label={`Next items in ${ariaLabel}`}
          className="btn-luxury inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold/35 bg-surface text-gold-bright disabled:cursor-not-allowed disabled:opacity-35 hover:border-gold-bright hover:bg-gold/10"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Swipeable & Keyboard-Navigable Track */}
      <div
        ref={trackRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label={`${ariaLabel} — use left and right arrow keys or swipe horizontally`}
        className="carousel-track flex snap-x snap-mandatory gap-6 overflow-x-auto pb-3 pt-1 focus-visible:rounded-xl"
      >
        {items.map((child, idx) => (
          <div
            key={idx}
            className={` shrink-0 snap-start ${itemClassName}`}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
