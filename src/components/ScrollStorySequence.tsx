"use client";

import React, { useEffect, useRef, useState } from "react";
import { scrollStorySequenceConfig } from "@/lib/default-data";

export function ScrollStorySequence() {
  const cfg = scrollStorySequenceConfig;
  const sectionRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [reducedMotion, setReducedMotion] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(1);
  const [progress, setProgress] = useState(0);
  const [posterHidden, setPosterHidden] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const sectionEl = sectionRef.current;
    const trackEl = trackRef.current;
    const stickyEl = stickyRef.current;
    const canvas = canvasRef.current;
    if (!sectionEl || !trackEl || !stickyEl || !canvas) return;

    const totalFrames = cfg.frameCount;
    const padIndex = (n: number) => String(n).padStart(cfg.indexPadding, "0");
    const isMobile = () => window.innerWidth <= cfg.mobileBreakpoint;
    const getFrameUrl = (idx: number) => {
      const pattern = isMobile() ? cfg.mobilePathPattern : cfg.desktopPathPattern;
      return pattern.replace("{index}", padIndex(idx));
    };

    const frames: (HTMLImageElement | null)[] = new Array(totalFrames + 1).fill(null);
    const frameStatus: number[] = new Array(totalFrames + 1).fill(0);
    let activeLoads = 0;
    let loaderStarted = false;
    let targetFrameFloat = 1;
    let currentFrameFloat = 1;
    let lastDrawnFrameIndex = -1;
    let rafId: number | null = null;
    let unmounted = false;

    const ctx = canvas.getContext("2d", { alpha: false });

    function getNearestLoadedFrame(desired: number): number {
      if (frames[desired]) return desired;
      for (let offset = 1; offset < totalFrames; offset++) {
        const low = desired - offset;
        if (low >= 1 && frames[low]) return low;
        const high = desired + offset;
        if (high <= totalFrames && frames[high]) return high;
      }
      return -1;
    }

    function drawFrame(frameIndex: number) {
      if (!stickyEl || !canvas || !ctx) return;
      const rect = stickyEl.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = Math.max(1, Math.round(rect.width * dpr));
      const ch = Math.max(1, Math.round(rect.height * dpr));
      const resized = canvas.width !== cw || canvas.height !== ch;

      if (resized) {
        canvas.width = cw;
        canvas.height = ch;
      }

      const resolvedIdx = getNearestLoadedFrame(frameIndex);
      if (resolvedIdx === -1) return;
      if (!resized && resolvedIdx === lastDrawnFrameIndex) return;

      const img = frames[resolvedIdx];
      if (!img) return;

      const iw = img.naturalWidth || cfg.frameWidth;
      const ih = img.naturalHeight || cfg.frameHeight;

      ctx.fillStyle = "#050608";
      ctx.fillRect(0, 0, cw, ch);

      const scale = isMobile()
        ? Math.max(cw / iw, ch / ih)
        : Math.min(cw / iw, ch / ih);

      const drawW = iw * scale;
      const drawH = ih * scale;
      const drawX = (cw - drawW) * 0.5;
      const drawY = (ch - drawH) * 0.5;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      lastDrawnFrameIndex = resolvedIdx;
      setPosterHidden(true);
    }

    function computeScroll() {
      if (!trackEl || !stickyEl) return 0;
      const rect = trackEl.getBoundingClientRect();
      const scrollable = Math.max(1, rect.height - stickyEl.offsetHeight);
      const scrolled = 80 - rect.top;
      const clamped = Math.max(0, Math.min(1, scrolled / scrollable));
      targetFrameFloat = 1 + clamped * (totalFrames - 1);
      return clamped;
    }

    function tick() {
      if (unmounted) return;
      const prog = computeScroll();
      const diff = targetFrameFloat - currentFrameFloat;
      if (Math.abs(diff) > 0.05) {
        currentFrameFloat += diff * 0.28;
      } else {
        currentFrameFloat = targetFrameFloat;
      }

      const displayFrame = Math.max(
        1,
        Math.min(totalFrames, Math.round(currentFrameFloat))
      );
      drawFrame(displayFrame);
      setCurrentFrame(displayFrame);
      setProgress(prog);

      if (Math.abs(targetFrameFloat - currentFrameFloat) > 0.05) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        rafId = null;
      }
    }

    function requestTick() {
      if (rafId === null && !unmounted) {
        rafId = window.requestAnimationFrame(tick);
      }
    }

    function loadSingleFrame(index: number, onDone?: () => void) {
      if (unmounted || index < 1 || index > totalFrames || frameStatus[index] !== 0) {
        onDone?.();
        return;
      }
      frameStatus[index] = 1;
      activeLoads++;

      const img = new window.Image();
      img.decoding = "async";
      img.onload = () => {
        if (unmounted) return;
        frames[index] = img;
        frameStatus[index] = 2;
        activeLoads--;
        if (Math.abs(index - Math.round(currentFrameFloat)) <= 4 || lastDrawnFrameIndex === -1) {
          requestTick();
        }
        onDone?.();
      };
      img.onerror = () => {
        frameStatus[index] = -1;
        activeLoads--;
        onDone?.();
      };
      img.src = getFrameUrl(index);
    }

    function pickNextFrame(): number {
      const center = Math.max(1, Math.min(totalFrames, Math.round(targetFrameFloat)));
      for (let off = 0; off <= cfg.priorityWindowRadius; off++) {
        const fwd = center + off;
        if (fwd <= totalFrames && frameStatus[fwd] === 0) return fwd;
        const bwd = center - off;
        if (bwd >= 1 && frameStatus[bwd] === 0) return bwd;
      }
      for (let i = 1; i <= cfg.initialPreloadCount; i++) {
        if (frameStatus[i] === 0) return i;
      }
      for (let i = 1; i <= totalFrames; i++) {
        if (frameStatus[i] === 0) return i;
      }
      return -1;
    }

    function pumpQueue() {
      if (unmounted) return;
      while (activeLoads < cfg.maxConcurrentLoads) {
        const nextIdx = pickNextFrame();
        if (nextIdx === -1) break;
        loadSingleFrame(nextIdx, pumpQueue);
      }
    }

    function startLoading() {
      if (loaderStarted || unmounted) return;
      loaderStarted = true;
      loadSingleFrame(1, () => {
        requestTick();
        pumpQueue();
      });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          startLoading();
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(sectionEl);

    const onScroll = () => {
      if (loaderStarted) pumpQueue();
      requestTick();
    };
    const onResize = () => {
      lastDrawnFrameIndex = -1;
      requestTick();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    requestTick();

    return () => {
      unmounted = true;
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, [cfg, reducedMotion]);

  if (reducedMotion) {
    return (
      <section
        id="in-motion"
        aria-label="Horological Architecture"
        className="border-b border-gold/20 bg-obsidian py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            Horological Architecture
          </p>
          <h2 className="mt-2 font-serif text-3xl text-cream sm:text-4xl">
            Inside the Timepiece
          </h2>
          <div className="mt-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-2">
            <div className="mx-auto max-w-md overflow-hidden rounded-xl border border-gold/40 bg-[#050608]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/story/frames/frame-120.webp"
                alt="STEPUP STORIES Timepiece Exploded Architecture"
                width={720}
                height={1280}
                loading="lazy"
                className="h-auto w-full"
              />
            </div>
            <div className="space-y-5">
              {cfg.captions.map((cap) => (
                <article
                  key={cap.id}
                  className="rounded-lg border border-gold/25 border-l-4 border-l-gold bg-surface p-6"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                    {cap.eyebrow}
                  </p>
                  <h3 className="mt-1 font-serif text-2xl text-cream">{cap.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-cream-secondary">
                    {cap.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      id="in-motion"
      aria-label="Interactive timepiece frame-sequence story"
      className="relative border-b border-gold/20 bg-obsidian"
    >
      <div
        ref={trackRef}
        className="relative h-[250vh] w-full md:h-[340vh]"
      >
        <div
          ref={stickyRef}
          className="sticky top-20 flex h-[calc(100dvh-5rem)] w-full items-center justify-center overflow-hidden bg-[#050608]"
        >
          {/* Champagne-Gold Progress Line */}
          <div className="absolute left-0 right-0 top-0 z-20 h-0.5 bg-gold/15" aria-hidden="true">
            <div
              className="h-full w-full origin-left bg-gradient-to-r from-gold to-gold-bright transition-transform duration-75"
              style={{ transform: `scaleX(${progress.toFixed(4)})` }}
            />
          </div>

          {/* Instant First-Frame Poster */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/story/frames-mobile/frame-001.webp"
            srcSet="/assets/story/frames-mobile/frame-001.webp 540w, /assets/story/frames/frame-001.webp 720w"
            sizes="(max-width: 768px) 100vw, 720px"
            alt="STEPUP STORIES Timepiece Opening Frame"
            width={720}
            height={1280}
            className={`pointer-events-none absolute inset-0 z-10 h-full w-full object-cover transition-opacity duration-300 md:object-contain ${
              posterHidden ? "opacity-0" : "opacity-100"
            }`}
          />

          <canvas
            ref={canvasRef}
            role="img"
            aria-label={cfg.canvasAriaLabel}
            className="relative z-10 block h-full w-full"
          />

          {/* HUD Overlay */}
          <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-b from-obsidian/55 via-transparent to-obsidian/80">
            <div className="mx-auto flex h-full max-w-7xl flex-col justify-between px-4 py-6 sm:px-6 lg:px-8">
              <div
                aria-hidden="true"
                className="inline-flex items-center gap-2 self-start rounded-full border border-gold/30 bg-obsidian/75 px-3.5 py-1.5 text-[11px] tracking-[0.18em] text-gold-bright backdrop-blur-md"
              >
                <span className="h-2 w-2 rounded-full bg-burgundy-bright" />
                <span>
                  FRAME {String(currentFrame).padStart(3, "0")} / {cfg.frameCount}
                </span>
              </div>

              <div className="relative mb-4 mt-auto min-h-[165px] w-full max-w-md" aria-live="polite">
                {cfg.captions.map((cap) => {
                  const active =
                    currentFrame >= cap.startFrame && currentFrame <= cap.endFrame;
                  return (
                    <article
                      key={cap.id}
                      className={`
                        absolute bottom-0 left-0 w-full rounded-lg border border-gold/45 border-l-4 border-l-gold bg-obsidian/85 p-5 shadow-2xl backdrop-blur-md transition-all duration-300
                        ${active ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}
                      `}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                        {cap.eyebrow}
                      </p>
                      <h3 className="mt-1 font-serif text-2xl font-medium text-cream">
                        {cap.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-cream-secondary">
                        {cap.body}
                      </p>
                    </article>
                  );
                })}
              </div>

              <div
                aria-hidden="true"
                className={`flex flex-col items-center gap-1.5 self-center transition-opacity duration-300 ${
                  progress > 0.04 ? "opacity-0" : "opacity-100"
                }`}
              >
                <span className="rounded-full border border-gold/30 bg-obsidian/80 px-3.5 py-1 text-[11px] uppercase tracking-[0.2em] text-gold-bright">
                  Scroll to Explore Craft
                </span>
                <span className="h-6 w-px bg-gradient-to-b from-gold-bright to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
