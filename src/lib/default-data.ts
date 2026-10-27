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
    id: "22222222-2222-4222-8222-222222222200",
    slug: "casio-g-shock-utility-green",
    name: "Casio G-SHOCK Utility Green",
    reference_code: null,
    collection_id: "11111111-1111-4111-8111-111111111101",
    collection: defaultCollections[0],
    short_description:
      "Octagonal matte black bezel paired with a utility olive green case and strap, featuring a dual-display analog-digital dial.",
    description:
      "Presented in the Signature collection, the Casio G-SHOCK Utility Green pairs a sculpted octagonal matte black bezel with an olive green case and matching strap. Its multi-layered matte black dial combines luminous central hands, a 9 o'clock day indicator subdial, and a negative digital LCD display with side push-button controls.",
    price_amount: 1839,
    original_price_amount: 2299,
    discount_percent: 20,
    price_currency: "INR",
    price_display: "₹1,839",
    availability_status: "available",
    featured: true,
    published: true,
    sort_order: 1,
    specs: [
      { key: "Brand", value: "Casio G-SHOCK" },
      { key: "Collection", value: "Signature" },
      {
        key: "Display",
        value: "Analog-Digital (Dual-Hand Analog, Day Subdial & Negative LCD)"
      },
      { key: "Bezel", value: "Octagonal Matte Black Bezel" },
      { key: "Case & Strap", value: "Utility Olive Green" },
      { key: "Dial Markings", value: "WR 20BAR, DST, HND, MUTE, AL, SIG" },
      { key: "Controls", value: "4 Side Push-Buttons (Light, Start, Mode, Adjust)" }
    ],
    images: [
      {
        id: "33333333-3333-4333-8333-333333333301",
        product_id: "22222222-2222-4222-8222-222222222200",
        storage_path: null,
        url: "/assets/watches/signature/casio-g-shock-utility-green-1.jpg",
        alt_text: "Casio G-SHOCK Utility Green front studio view",
        is_primary: true,
        sort_order: 0,
        width: 1200,
        height: 1500
      },
      {
        id: "33333333-3333-4333-8333-333333333302",
        product_id: "22222222-2222-4222-8222-222222222200",
        storage_path: null,
        url: "/assets/watches/signature/casio-g-shock-utility-green-2.jpg",
        alt_text: "Casio G-SHOCK Utility Green angled three-quarter view",
        is_primary: false,
        sort_order: 1,
        width: 1200,
        height: 1500
      },
      {
        id: "33333333-3333-4333-8333-333333333303",
        product_id: "22222222-2222-4222-8222-222222222200",
        storage_path: null,
        url: "/assets/watches/signature/casio-g-shock-utility-green-3.jpg",
        alt_text: "Casio G-SHOCK Utility Green side profile and pushers view",
        is_primary: false,
        sort_order: 2,
        width: 1200,
        height: 1500
      },
      {
        id: "33333333-3333-4333-8333-333333333304",
        product_id: "22222222-2222-4222-8222-222222222200",
        storage_path: null,
        url: "/assets/watches/signature/casio-g-shock-utility-green-4.jpg",
        alt_text: "Casio G-SHOCK Utility Green macro dial close-up",
        is_primary: false,
        sort_order: 3,
        width: 1200,
        height: 1500
      }
    ],
    created_at: "2026-10-27T06:30:00.000Z"
  },
  {
    id: "22222222-2222-4222-8222-222222222206",
    slug: "worldtimer-inspired-black-gold-watch",
    name: "Worldtimer-Inspired Black & Gold Watch",
    reference_code: null,
    collection_id: "11111111-1111-4111-8111-111111111105",
    collection: defaultCollections[4],
    short_description:
      "Dark dial with a globe-style center, city names around the dial, date window, dark case with warm metallic accents, and black stitched strap.",
    description:
      "Presented in the Everyday Icons collection, the Worldtimer-Inspired Black & Gold Watch features a dark dial with a globe-style center, an inner 24-hour ring, city names around the outer dial perimeter, and a 6 o'clock date window. Framed by a dark case with warm metallic accents, it is paired with a black textured strap finished with contrast stitching.",
    price_amount: 1799,
    original_price_amount: 2099,
    discount_percent: 14,
    savings_label: "Save ₹300",
    price_currency: "INR",
    price_display: "₹1,799",
    availability_status: "available",
    featured: true,
    published: true,
    sort_order: 2,
    specs: [
      { key: "Collection", value: "Everyday Icons" },
      { key: "Dial", value: "Dark Dial with Globe-Style Center & 24-Hour Ring" },
      { key: "Outer Ring", value: "City Names Around the Dial" },
      { key: "Calendar", value: "Date Window at 6 O'Clock" },
      { key: "Case", value: "Dark Case with Warm Metallic Accents" },
      { key: "Strap", value: "Black Textured Strap with Contrast Stitching" }
    ],
    images: [
      {
        id: "33333333-3333-4333-8333-333333333305",
        product_id: "22222222-2222-4222-8222-222222222206",
        storage_path: null,
        url: "/assets/watches/everyday-icons/worldtimer-inspired-black-gold-1.jpg",
        alt_text: "Worldtimer-Inspired Black & Gold Watch front view showing dark globe dial and city ring",
        is_primary: true,
        sort_order: 0,
        width: 1200,
        height: 1500
      },
      {
        id: "33333333-3333-4333-8333-333333333306",
        product_id: "22222222-2222-4222-8222-222222222206",
        storage_path: null,
        url: "/assets/watches/everyday-icons/worldtimer-inspired-black-gold-2.jpg",
        alt_text: "Worldtimer-Inspired Black & Gold Watch three-quarter angled view showing case and black stitched strap",
        is_primary: false,
        sort_order: 1,
        width: 1200,
        height: 1500
      },
      {
        id: "33333333-3333-4333-8333-333333333307",
        product_id: "22222222-2222-4222-8222-222222222206",
        storage_path: null,
        url: "/assets/watches/everyday-icons/worldtimer-inspired-black-gold-3.jpg",
        alt_text: "Worldtimer-Inspired Black & Gold Watch side profile showing crown and strap stitching",
        is_primary: false,
        sort_order: 2,
        width: 1200,
        height: 1500
      },
      {
        id: "33333333-3333-4333-8333-333333333308",
        product_id: "22222222-2222-4222-8222-222222222206",
        storage_path: null,
        url: "/assets/watches/everyday-icons/worldtimer-inspired-black-gold-4.jpg",
        alt_text: "Worldtimer-Inspired Black & Gold Watch close-up of globe-style center and city names",
        is_primary: false,
        sort_order: 3,
        width: 1200,
        height: 1500
      }
    ],
    created_at: "2026-10-27T07:05:00.000Z"
  },
  {
    id: "22222222-2222-4222-8222-222222222207",
    slug: "hoblet-emerald-green-dial-statement-watch",
    name: "HOBLET — Emerald Green Dial Statement Watch",
    reference_code: null,
    collection_id: "11111111-1111-4111-8111-111111111105",
    collection: defaultCollections[4],
    short_description:
      "Green dial with subdial-style details and a date window, paired with a dark textured bezel, rose-gold-tone case, and green strap.",
    description:
      "Presented in the Everyday Icons collection, the HOBLET — Emerald Green Dial Statement Watch features a green dial with subdial-style details and a 6 o'clock date window. Framed by a dark textured bezel and a rose-gold-tone case, it is fitted with a matching green strap with tonal stitching.",
    price_amount: 1299,
    original_price_amount: 1699,
    discount_percent: 24,
    savings_label: "Save ₹400",
    price_currency: "INR",
    price_display: "₹1,299",
    availability_status: "available",
    featured: true,
    published: true,
    sort_order: 3,
    specs: [
      { key: "Collection", value: "Everyday Icons" },
      { key: "Dial", value: "Green Dial with Subdial-Style Details" },
      { key: "Calendar", value: "Date Window at 6 O'Clock" },
      { key: "Bezel", value: "Dark Textured Bezel" },
      { key: "Case", value: "Rose-Gold-Tone Case" },
      { key: "Strap", value: "Green Strap with Tonal Stitching" }
    ],
    images: [
      {
        id: "33333333-3333-4333-8333-333333333309",
        product_id: "22222222-2222-4222-8222-222222222207",
        storage_path: null,
        url: "/assets/watches/everyday-icons/hoblet-emerald-green-1.jpg",
        alt_text: "HOBLET — Emerald Green Dial Statement Watch front overhead view",
        is_primary: true,
        sort_order: 0,
        width: 1200,
        height: 1500
      },
      {
        id: "33333333-3333-4333-8333-333333333310",
        product_id: "22222222-2222-4222-8222-222222222207",
        storage_path: null,
        url: "/assets/watches/everyday-icons/hoblet-emerald-green-2.jpg",
        alt_text: "HOBLET — Emerald Green Dial Statement Watch horizontal studio view",
        is_primary: false,
        sort_order: 1,
        width: 1200,
        height: 1500
      },
      {
        id: "33333333-3333-4333-8333-333333333311",
        product_id: "22222222-2222-4222-8222-222222222207",
        storage_path: null,
        url: "/assets/watches/everyday-icons/hoblet-emerald-green-3.jpg",
        alt_text: "HOBLET — Emerald Green Dial Statement Watch full strap and case view",
        is_primary: false,
        sort_order: 2,
        width: 1200,
        height: 1500
      },
      {
        id: "33333333-3333-4333-8333-333333333312",
        product_id: "22222222-2222-4222-8222-222222222207",
        storage_path: null,
        url: "/assets/watches/everyday-icons/hoblet-emerald-green-4.jpg",
        alt_text: "HOBLET — Emerald Green Dial Statement Watch low-angle side profile view",
        is_primary: false,
        sort_order: 3,
        width: 1200,
        height: 1500
      },
      {
        id: "33333333-3333-4333-8333-333333333313",
        product_id: "22222222-2222-4222-8222-222222222207",
        storage_path: null,
        url: "/assets/watches/everyday-icons/hoblet-emerald-green-5.jpg",
        alt_text: "HOBLET — Emerald Green Dial Statement Watch macro close-up of green dial and textured bezel",
        is_primary: false,
        sort_order: 4,
        width: 1200,
        height: 1500
      }
    ],
    created_at: "2026-10-27T07:30:00.000Z"
  },
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
    sort_order: 2,
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
