export const COLORS = {
  // Luxury Dark Charcoal Base (matches https://stepup-stories.vercel.app/)
  bgObsidian: "#07090B",
  bgCharcoal: "#0F1317",
  bgSurface: "#151A20",
  bgElevated: "#1C222A",
  bgGlass: "rgba(21, 26, 32, 0.92)",

  // Warm Champagne Gold Accents
  goldChampagne: "#D4B475",
  goldBright: "#EAD3A3",
  goldMuted: "#9E8452",
  goldSubtleBg: "rgba(212, 180, 117, 0.12)",
  goldBorder: "rgba(212, 180, 117, 0.28)",

  // Restrained Burgundy Accents
  burgundyAccent: "#8F1D35",
  burgundyHighlight: "#C4304E",
  burgundySubtleBg: "rgba(143, 29, 53, 0.22)",

  // WCAG AA Checked Cream & Muted Text
  textPrimary: "#F6F3EC",
  textSecondary: "#C9C4B9",
  textMuted: "#9A9488",

  // Semantic Status Colors
  success: "#34D399",
  successBg: "rgba(52, 211, 153, 0.14)",
  warning: "#FBBF24",
  warningBg: "rgba(251, 191, 36, 0.14)",
  danger: "#F87171",
  dangerBg: "rgba(248, 113, 113, 0.14)",
  borderSubtle: "rgba(255, 255, 255, 0.08)"
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40
} as const;

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999
} as const;
