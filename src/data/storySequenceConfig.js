/**
 * STEPUP STORIES — Scroll-Controlled Frame Sequence Story Configuration
 *
 * Edit this single file to adjust:
 * - Frame count, directory paths, and filename pattern
 * - Scroll track length on desktop and mobile
 * - Reduced-motion static fallback frame index
 * - Preload batch sizes
 * - Captions and the exact frame ranges where each caption fades in and out
 */

export const storySequenceConfig = {
  frameCount: 240,

  // Relative paths that resolve cleanly on Vite, Vercel, and GitHub Pages
  desktopPathPattern: "./assets/story/frames/frame-{index}.webp",
  mobilePathPattern: "./assets/story/frames-mobile/frame-{index}.webp",
  indexPadding: 3, // Pads 1 -> "001", 240 -> "240"

  // Viewport breakpoint (px) below which 540x960 mobile frames are loaded
  mobileBreakpoint: 768,

  // Intrinsic aspect ratio of the supplied 9:16 vertical frames
  frameWidth: 720,
  frameHeight: 1280,

  // Scroll track lengths (unhurried, natural scroll speed — never hijacks scrolling)
  scrollLengthDesktop: "360vh",
  scrollLengthMobile: "260vh",

  // Immediate preload count so the opening scrub is instant, without blocking page load
  initialPreloadCount: 25,
  // Number of frames around the current scroll position prioritized during background loading
  priorityWindowRadius: 12,
  maxConcurrentLoads: 4,

  // Frame shown when `prefers-reduced-motion: reduce` is active (good middle exploded view)
  reducedMotionFrame: 120,

  // Accessible label for the <canvas>
  canvasAriaLabel:
    "Interactive 240-frame scroll sequence showcasing the STEPUP STORIES skeleton timepiece deconstruction and reassembly.",

  // Editable captions mapped to frame ranges (1 to 240)
  captions: [
    {
      id: "caption-01",
      startFrame: 1,
      endFrame: 52,
      eyebrow: "CHAPTER I — THE SILHOUETTE",
      title: "Sample Caption 01 — Sculpted Octagonal Presence",
      body: "Edit in src/data/storySequenceConfig.js — Every angle is brushed and chamfered to catch warm champagne-gold light against deep obsidian shadows."
    },
    {
      id: "caption-02",
      startFrame: 68,
      endFrame: 125,
      eyebrow: "CHAPTER II — THE ARCHITECTURE",
      title: "Sample Caption 02 — Layers of Horological Craft",
      body: "Edit in src/data/storySequenceConfig.js — As the case separates, each crystal, bezel ring, and openworked bridge reveals its structural harmony."
    },
    {
      id: "caption-03",
      startFrame: 140,
      endFrame: 195,
      eyebrow: "CHAPTER III — THE CALIBRE WITHIN",
      title: "Sample Caption 03 — Precision in Every Gear Train",
      body: "Edit in src/data/storySequenceConfig.js — Suspended in equilibrium, the mechanical heart balances intricate skeletonized plates with enduring poise."
    },
    {
      id: "caption-04",
      startFrame: 205,
      endFrame: 240,
      eyebrow: "CHAPTER IV — THE ASCENT COMPLETE",
      title: "Sample Caption 04 — Reunited for Defining Moments",
      body: "Edit in src/data/storySequenceConfig.js — Sealed once more into a singular emblem of personal ascent. Scroll onward to explore the collections."
    }
  ]
};
