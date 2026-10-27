"use client";

import React, { useState } from "react";
import Image from "next/image";
import type { ProductImageRecord } from "@/types/database";

export function ProductDetailGallery({
  images,
  productName
}: {
  images: ProductImageRecord[];
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const current = images[activeIndex] ?? images[0] ?? null;

  return (
    <div>
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-gold/30 bg-gradient-to-b from-[#13181f] via-[#0c1015] to-[#07090c] shadow-2xl">
        {current ? (
          <Image
            src={current.url}
            alt={current.alt_text || `${productName} view ${activeIndex + 1}`}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
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
              onClick={() => setActiveIndex(idx)}
              aria-current={idx === activeIndex ? "true" : undefined}
              aria-label={`View photograph ${idx + 1}`}
              className={`relative aspect-square overflow-hidden rounded-md border transition ${
                idx === activeIndex
                  ? "border-gold-bright ring-2 ring-gold/50"
                  : "border-gold/20 opacity-75 hover:opacity-100"
              }`}
            >
              <Image
                src={img.url}
                alt={img.alt_text || `${productName} thumbnail ${idx + 1}`}
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
