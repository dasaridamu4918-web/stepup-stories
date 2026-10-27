"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductImageRecord } from "@/types/database";

export function ProductDetailGallery({
  images,
  productName
}: {
  images: ProductImageRecord[];
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const selectIndex = (nextIdx: number) => {
    if (images.length === 0) return;
    const bounded = (nextIdx + images.length) % images.length;
    setActiveIndex(bounded);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (images.length <= 1) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      selectIndex(activeIndex + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      selectIndex(activeIndex - 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null || images.length <= 1) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const deltaX = endX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        selectIndex(activeIndex + 1);
      } else {
        selectIndex(activeIndex - 1);
      }
    }
  };

  return (
    <div onKeyDown={handleKeyDown}>
      <div
        tabIndex={images.length > 1 ? 0 : undefined}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label={
          images.length > 1
            ? `${productName} gallery — photograph ${activeIndex + 1} of ${images.length}. Use left and right arrow keys or swipe to change view.`
            : `${productName} photograph`
        }
        className="group relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-gold/30 bg-gradient-to-b from-[#13181f] via-[#0c1015] to-[#07090c] shadow-2xl focus-visible:rounded-xl"
      >
        {images.length > 0 ? (
          <>
            {images.map((img, idx) => {
              const isCurrent = idx === activeIndex;
              return (
                <div
                  key={img.id}
                  aria-hidden={!isCurrent}
                  className={`absolute inset-0 transition-all duration-300 ease-out ${
                    isCurrent
                      ? "z-10 scale-100 opacity-100"
                      : "pointer-events-none z-0 scale-[1.015] opacity-0"
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={img.alt_text || `${productName} view ${idx + 1}`}
                    fill
                    priority={idx === 0}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              );
            })}

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => selectIndex(activeIndex - 1)}
                  aria-label="Previous photograph"
                  className="btn-luxury absolute left-3 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gold/40 bg-obsidian/80 text-gold-bright backdrop-blur-sm hover:border-gold-bright hover:bg-obsidian"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => selectIndex(activeIndex + 1)}
                  aria-label="Next photograph"
                  className="btn-luxury absolute right-3 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gold/40 bg-obsidian/80 text-gold-bright backdrop-blur-sm hover:border-gold-bright hover:bg-obsidian"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <div
                  aria-live="polite"
                  className="absolute bottom-3 right-3 z-20 rounded border border-gold/30 bg-obsidian/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-cream-secondary backdrop-blur-sm"
                >
                  {activeIndex + 1} / {images.length}
                </div>
              </>
            )}
          </>
        ) : (
          /* Neutral, unlabelled studio placeholder when no watch photo is uploaded yet */
          <div
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center p-12"
          >
            <div className="relative flex h-56 w-56 items-center justify-center">
              <div className="absolute inset-0 rotate-45 rounded-2xl border border-gold/25 bg-obsidian/50" />
              <div className="h-40 w-40 rounded-full border border-gold/30 bg-gradient-to-br from-gold/10 to-transparent" />
              <div className="h-2.5 w-2.5 rounded-full bg-burgundy-bright/80" />
            </div>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div
          role="list"
          aria-label="Product photograph thumbnails"
          className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5"
        >
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => selectIndex(idx)}
              aria-current={idx === activeIndex ? "true" : undefined}
              aria-label={`View photograph ${idx + 1}`}
              className={`btn-luxury relative aspect-square overflow-hidden rounded-md border ${
                idx === activeIndex
                  ? "border-gold-bright ring-2 ring-gold/50"
                  : "border-gold/20 opacity-75 hover:border-gold/55 hover:opacity-100"
              }`}
            >
              <Image
                src={img.url}
                alt={img.alt_text || `${productName} thumbnail ${idx + 1}`}
                fill
                sizes="120px"
                className="object-cover transition-transform duration-300 hover:scale-105"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
