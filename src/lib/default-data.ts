import type {
  CollectionRecord,
  ProductRecord,
  SiteSettingsRecord
} from "@/types/database";

/**
 * Default baseline data for STEPUP STORIES when Supabase tables are empty or
 * before environment variables are connected.
 *
 * STRICT CONTENT RULES:
 * - Zero fake contact details, zero fake addresses, zero fake phone numbers, zero fake social links.
 * - Zero invented product specifications, movements, water resistance, or fake prices.
 * - No "sample", "demo", "lorem ipsum", or developer instructions visible to visitors.
 * - Editorial backdrops use replaceable slots in `/images/generated/...` editable via `/admin`.
 */

export const defaultSiteSettings: SiteSettingsRecord = {
  id: 1,
  business_name: "STEPUP STORIES",
  tagline: "Every Second Marks an Ascent",
  hero_headline: "Timepieces Crafted for Defining Moments",
  hero_subheadline:
    "Explore the curated collections of STEPUP STORIES. Designed with architectural precision, understated warmth, and enduring character.",
  hero_backdrop_url: "/images/generated/hero-backdrop.webp",
  story_backdrop_url: "/images/generated/story-craftsmanship.webp",
  og_image_url: "/images/generated/og-backdrop.webp",
  about_story_title: "The Architecture of Personal Ascent",
  about_story_body:
    "Founded on the belief that every milestone deserves a lasting companion, STEPUP STORIES unites geometric restraint with intimate horological craft. Inspired by our octagonal crest—where ascending steps meet timeless typography and a single crimson-burgundy accent—each collection is conceived for individuals who measure time not merely in hours, but in chapters of growth.",
  // All business contact fields remain null/empty until configured by the owner in /admin
  contact_email: null,
  contact_phone: null,
  address: null,
  opening_hours: null,
  private_viewing_details: null,
  footer_text:
    "Timepieces crafted for defining moments. Private viewings and acquisitions arranged through our concierge.",
  social_links: []
};

export const defaultCollections: CollectionRecord[] = [
  {
    id: "11111111-1111-4111-8111-111111111101",
    slug: "signature",
    name: "Signature",
    subtitle: "The Emblem of Ascent",
    description:
      "Octagonal silhouettes and warm champagne-gold accents that embody the core identity of STEPUP STORIES.",
    cover_image_url: "/images/generated/collection-signature.webp",
    cover_image_alt: "Abstract dark obsidian and champagne-gold backdrop for the Signature collection",
    sort_order: 1,
    published: true
  },
  {
    id: "11111111-1111-4111-8111-111111111102",
    slug: "automatic-classics",
    name: "Automatic Classics",
    subtitle: "Timeless Proportions",
    description:
      "Traditional horological poise balanced with deep charcoal tones and refined architectural indices.",
    cover_image_url: "/images/generated/collection-automatic-classics.webp",
    cover_image_alt: "Abstract dark charcoal and brushed bronze backdrop for Automatic Classics",
    sort_order: 2,
    published: true
  },
  {
    id: "11111111-1111-4111-8111-111111111103",
    slug: "modern-minimal",
    name: "Modern Minimal",
    subtitle: "Pure Architectural Form",
    description:
      "Clean dial geometry and slim profiles conceived for effortless contemporary wear.",
    cover_image_url: "/images/generated/collection-modern-minimal.webp",
    cover_image_alt: "Minimalist matte obsidian backdrop with a fine champagne-gold light line",
    sort_order: 3,
    published: true
  },
  {
    id: "11111111-1111-4111-8111-111111111104",
    slug: "limited-editions",
    name: "Limited Editions",
    subtitle: "Rare & Numbered",
    description:
      "Exclusive releases crafted in small runs with distinctive burgundy and champagne-gold detailing.",
    cover_image_url: "/images/generated/collection-limited-editions.webp",
    cover_image_alt: "Deep burgundy velvet and dark charcoal marble collector backdrop",
    sort_order: 4,
    published: true
  },
  {
    id: "11111111-1111-4111-8111-111111111105",
    slug: "everyday-icons",
    name: "Everyday Icons",
    subtitle: "Versatile Sophistication",
    description:
      "Designed to accompany every milestone from morning briefings to evening gatherings.",
    cover_image_url: "/images/generated/collection-everyday-icons.webp",
    cover_image_alt: "Refined dark anthracite stone surface illuminated by warm golden rim light",
    sort_order: 5,
    published: true
  }
];

export const defaultProducts: ProductRecord[] = [
  {
    id: "22222222-2222-4222-8222-222222222201",
    slug: "signature-edition-i",
    name: "Signature Edition I",
    reference_code: null,
    collection_id: "11111111-1111-4111-8111-111111111101",
    collection: defaultCollections[0],
    short_description:
      "Octagonal case architecture with warm champagne-gold finishing and deep charcoal dial.",
    description:
      "The inaugural expression of the Signature pillar, uniting octagonal geometry with understated luxury.",
    price_amount: null,
    price_currency: null,
    price_display: null,
    availability_status: "available",
    featured: true,
    published: true,
    sort_order: 1,
    specs: [],
    images: [],
    created_at: "2026-10-24T00:00:00.000Z"
  },
  {
    id: "22222222-2222-4222-8222-222222222202",
    slug: "automatic-classic-i",
    name: "Automatic Classic I",
    reference_code: null,
    collection_id: "11111111-1111-4111-8111-111111111102",
    collection: defaultCollections[1],
    short_description:
      "Balanced proportions and refined dial symmetry crafted for enduring distinction.",
    description:
      "A study in classical horological poise, pairing dark charcoal depth with crisp champagne-gold markers.",
    price_amount: null,
    price_currency: null,
    price_display: null,
    availability_status: "available",
    featured: true,
    published: true,
    sort_order: 2,
    specs: [],
    images: [],
    created_at: "2026-10-24T01:00:00.000Z"
  },
  {
    id: "22222222-2222-4222-8222-222222222203",
    slug: "modern-minimal-i",
    name: "Modern Minimal I",
    reference_code: null,
    collection_id: "11111111-1111-4111-8111-111111111103",
    collection: defaultCollections[2],
    short_description:
      "Uncluttered dial geometry and a slender silhouette for contemporary formal and daily wear.",
    description:
      "Distilled to the essentials of form and light, Modern Minimal I offers quiet confidence on the wrist.",
    price_amount: null,
    price_currency: null,
    price_display: null,
    availability_status: "available",
    featured: true,
    published: true,
    sort_order: 3,
    specs: [],
    images: [],
    created_at: "2026-10-24T02:00:00.000Z"
  },
  {
    id: "22222222-2222-4222-8222-222222222204",
    slug: "limited-edition-i",
    name: "Limited Edition I",
    reference_code: null,
    collection_id: "11111111-1111-4111-8111-111111111104",
    collection: defaultCollections[3],
    short_description:
      "Collector release distinguished by restrained burgundy and champagne-gold accents.",
    description:
      "Conceived for private collectors seeking a rare expression of the STEPUP STORIES octagonal crest.",
    price_amount: null,
    price_currency: null,
    price_display: null,
    availability_status: "private_viewing_only",
    featured: true,
    published: true,
    sort_order: 4,
    specs: [],
    images: [],
    created_at: "2026-10-24T03:00:00.000Z"
  },
  {
    id: "22222222-2222-4222-8222-222222222205",
    slug: "everyday-icon-i",
    name: "Everyday Icon I",
    reference_code: null,
    collection_id: "11111111-1111-4111-8111-111111111105",
    collection: defaultCollections[4],
    short_description:
      "Versatile silhouette engineered to transition effortlessly across every chapter of the day.",
    description:
      "Commanding yet understated, Everyday Icon I brings architectural refinement to daily wear.",
    price_amount: null,
    price_currency: null,
    price_display: null,
    availability_status: "available",
    featured: false,
    published: true,
    sort_order: 5,
    specs: [],
    images: [],
    created_at: "2026-10-24T04:00:00.000Z"
  }
];

export const scrollStorySequenceConfig = {
  frameCount: 240,
  desktopPathPattern: "/assets/story/frames/frame-{index}.webp",
  mobilePathPattern: "/assets/story/frames-mobile/frame-{index}.webp",
  indexPadding: 3,
  mobileBreakpoint: 768,
  frameWidth: 720,
  frameHeight: 1280,
  scrollLengthDesktop: "340vh",
  scrollLengthMobile: "250vh",
  initialPreloadCount: 25,
  priorityWindowRadius: 12,
  maxConcurrentLoads: 4,
  reducedMotionFrame: 120,
  canvasAriaLabel:
    "Interactive 240-frame scroll sequence showcasing the STEPUP STORIES timepiece architecture in motion.",
  captions: [
    {
      id: "chapter-01",
      startFrame: 1,
      endFrame: 52,
      eyebrow: "CHAPTER I — THE SILHOUETTE",
      title: "Sculpted Octagonal Presence",
      body: "Every surface is proportioned to catch warm champagne-gold light against deep obsidian shadows."
    },
    {
      id: "chapter-02",
      startFrame: 68,
      endFrame: 125,
      eyebrow: "CHAPTER II — THE ARCHITECTURE",
      title: "Layers of Horological Craft",
      body: "As the case separates in motion, the crystal, bezel ring, and openworked bridges reveal their structural harmony."
    },
    {
      id: "chapter-03",
      startFrame: 140,
      endFrame: 195,
      eyebrow: "CHAPTER III — THE CALIBRE WITHIN",
      title: "Equilibrium in Motion",
      body: "Suspended in space, the mechanical heart balances intricate skeletonized plates with enduring poise."
    },
    {
      id: "chapter-04",
      startFrame: 205,
      endFrame: 240,
      eyebrow: "CHAPTER IV — THE ASCENT COMPLETE",
      title: "Reunited for Defining Moments",
      body: "Sealed once more into a singular emblem of personal ascent."
    }
  ]
};
