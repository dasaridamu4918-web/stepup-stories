"use client";

import React, { useEffect, useRef, useState } from "react";

export function HeroEmblemMedia() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    if (mq.matches) return;

    const videoEl = videoRef.current;
    if (!videoEl) return;

    videoEl.muted = true;
    videoEl.defaultMuted = true;
    videoEl.playsInline = true;

    const startPlayback = () => {
      const source = videoEl.querySelector("source[data-src]");
      if (source && !source.getAttribute("src")) {
        source.setAttribute("src", source.getAttribute("data-src") || "");
        videoEl.load();
      }
      videoEl
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    };

    const timer = window.setTimeout(startPlayback, 250);
    return () => window.clearTimeout(timer);
  }, []);

  const togglePlay = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    if (videoEl.paused) {
      videoEl
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      videoEl.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-gold/45 bg-[#080b0c] shadow-2xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/brand/logo.jpg"
        alt="STEPUP STORIES Official Emblem"
        width={960}
        height={540}
        className="h-full w-full object-cover"
      />
      {!reducedMotion && (
        <>
          <video
            ref={videoRef}
            poster="/assets/brand/logo.jpg"
            muted
            playsInline
            loop
            preload="none"
            aria-label="STEPUP STORIES official animated emblem"
            className={`
              absolute inset-0 h-full w-full object-cover transition-opacity duration-500
              ${isPlaying ? "opacity-100" : "opacity-0"}
            `}
          >
            <source data-src="/assets/brand/logo-animation.mp4" type="video/mp4" />
          </video>
          <div className="absolute bottom-3 right-3 z-10">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause emblem animation" : "Play emblem animation"}
              className="rounded border border-gold/35 bg-obsidian/80 px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-gold-bright backdrop-blur-md transition hover:border-gold-bright"
            >
              {isPlaying ? "Pause Motion" : "Play Motion"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
