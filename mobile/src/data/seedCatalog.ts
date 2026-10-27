import { MobileCollection, MobileProduct } from "../types/store";
import { calculateSavings } from "../constants/indianStates";

export const WEBSITE_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "https://stepup-stories.vercel.app";

/**
 * Enforces the store's strict authenticity & brand verification policy:
 * Use branded product names ONLY when `brand_verified === true`.
 * Otherwise always return the accurate generic descriptive name.
 */
export function resolvePublicProductName(product: {
  name?: string;
  generic_name: string;
  brand_candidate?: string | null;
  brand_verified: boolean;
}): string {
  if (product.brand_verified && product.brand_candidate && product.name) {
    return product.name;
  }
  return product.generic_name;
}

export const SEED_COLLECTIONS: MobileCollection[] = [
  {
    id: "11111111-1111-4111-8111-111111111105",
    slug: "everyday-icons",
    name: "Everyday Icons",
    subtitle: "Versatile Sophistication",
    description:
      "Designed to accompany every milestone from morning briefings to evening gatherings.",
    cover_image_url: `${WEBSITE_BASE_URL}/images/generated/collection-everyday-icons.webp`,
    sort_order: 1
  },
  {
    id: "11111111-1111-4111-8111-111111111103",
    slug: "modern-minimal",
    name: "Modern Minimal",
    subtitle: "Pure Architectural Form",
    description:
      "Clean dial geometry and slim profiles conceived for effortless contemporary wear.",
    cover_image_url: `${WEBSITE_BASE_URL}/images/generated/collection-modern-minimal.webp`,
    sort_order: 2
  },
  {
    id: "11111111-1111-4111-8111-111111111101",
    slug: "signature",
    name: "Signature",
    subtitle: "The Emblem of Ascent",
    description:
      "Octagonal silhouettes and warm champagne-gold accents that embody the core identity of STEPUP STORIES.",
    cover_image_url: `${WEBSITE_BASE_URL}/images/generated/collection-signature.webp`,
    sort_order: 3
  },
  {
    id: "11111111-1111-4111-8111-111111111102",
    slug: "automatic-classics",
    name: "Automatic Classics",
    subtitle: "Timeless Proportions",
    description:
      "Traditional horological poise balanced with deep charcoal tones and refined architectural indices.",
    cover_image_url: `${WEBSITE_BASE_URL}/images/generated/collection-automatic-classics.webp`,
    sort_order: 4
  },
  {
    id: "11111111-1111-4111-8111-111111111104",
    slug: "limited-editions",
    name: "Limited Editions",
    subtitle: "Curated Collector Releases",
    description:
      "Distinctive dial compositions with warm gold-tone and burgundy accents.",
    cover_image_url: `${WEBSITE_BASE_URL}/images/generated/collection-limited-editions.webp`,
    sort_order: 5
  }
];

function createProduct(
  raw: Omit<
    MobileProduct,
    "savings_amount" | "discount_percent" | "price_currency" | "name"
  > & { branded_title?: string }
): MobileProduct {
  const { savingsAmount, discountPercent } = calculateSavings(
    raw.price_amount,
    raw.original_price_amount
  );
  const publicName =
    raw.brand_verified && raw.branded_title ? raw.branded_title : raw.generic_name;

  return {
    ...raw,
    name: publicName,
    savings_amount: savingsAmount,
    discount_percent: discountPercent,
    price_currency: "INR"
  };
}

export const SEED_PRODUCTS: MobileProduct[] = [
  createProduct({
    id: "22222222-2222-4222-8222-222222222224",
    slug: "black-dial-gold-tone-watch",
    generic_name: "Black Dial Gold-Tone Watch",
    branded_title: "Emporio Armani Black Dial Gold-Tone Watch",
    brand_candidate: "Emporio Armani",
    brand_verified: false,
    limited_edition_verified: false,
    collection_id: "11111111-1111-4111-8111-111111111103",
    collection_slug: "modern-minimal",
    collection_name: "Modern Minimal",
    short_description:
      "Black dial with gold-tone hands, markers, and multiple sub-dials, paired with a gold-tone case and link bracelet.",
    description:
      "Finished with a warm gold-tone case and multi-link bracelet, this watch features a contrasting black dial accented with gold-tone hands and baton markers, multiple sub-dials, and an angled date display.",
    price_amount: 2499,
    original_price_amount: 2899,
    stock_quantity: 10,
    availability_status: "available",
    featured: true,
    published: true,
    sort_order: 1,
    specs: [
      { key: "Collection", value: "Modern Minimal" },
      { key: "Dial", value: "Black dial with gold-tone hands and markers" },
      { key: "Case & Bracelet", value: "Gold-tone case and link bracelet" },
      { key: "Display", value: "Analog with multiple sub-dials and date display" }
    ],
    images: [
      {
        id: "img-20-1",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/black-dial-gold-tone-1.png`,
        alt_text: "Black Dial Gold-Tone Watch front overhead view",
        is_primary: true,
        sort_order: 0
      },
      {
        id: "img-20-2",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/black-dial-gold-tone-2.png`,
        alt_text: "Black Dial Gold-Tone Watch angled three-quarter studio view",
        is_primary: false,
        sort_order: 1
      },
      {
        id: "img-20-3",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/black-dial-gold-tone-3.png`,
        alt_text: "Black Dial Gold-Tone Watch top-down flat-lay view",
        is_primary: false,
        sort_order: 2
      },
      {
        id: "img-20-4",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/black-dial-gold-tone-4.png`,
        alt_text: "Black Dial Gold-Tone Watch side profile showing crown and pushers",
        is_primary: false,
        sort_order: 3
      },
      {
        id: "img-20-5",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/black-dial-gold-tone-5.png`,
        alt_text: "Black Dial Gold-Tone Watch macro close-up of black dial and sub-dials",
        is_primary: false,
        sort_order: 4
      }
    ],
    created_at: "2026-10-27T13:15:00.000Z"
  }),
  createProduct({
    id: "22222222-2222-4222-8222-222222222223",
    slug: "green-dial-fluted-bezel-date-watch",
    generic_name: "Green Dial Fluted-Bezel Date Watch",
    branded_title: "ROLEX Green Dial Fluted-Bezel Date Watch",
    brand_candidate: "Rolex",
    brand_verified: false,
    limited_edition_verified: false,
    collection_id: "11111111-1111-4111-8111-111111111103",
    collection_slug: "modern-minimal",
    collection_name: "Modern Minimal",
    short_description:
      "Green dial with a fluted bezel, date window with a magnifying lens, and metal link bracelet.",
    description:
      "Designed with a rich green dial and Roman numeral markers, this watch features a classic fluted bezel, a 3 o'clock date window beneath a magnifying lens, and a multi-link metal bracelet.",
    price_amount: 1499,
    original_price_amount: 1699,
    stock_quantity: 14,
    availability_status: "available",
    featured: true,
    published: true,
    sort_order: 2,
    specs: [
      { key: "Collection", value: "Modern Minimal" },
      { key: "Dial", value: "Green dial with Roman numeral markers" },
      { key: "Bezel", value: "Fluted bezel" },
      { key: "Display", value: "Analog with magnified date window" },
      { key: "Bracelet", value: "Metal link bracelet" }
    ],
    images: [
      {
        id: "img-19-1",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/green-dial-fluted-bezel-1.png`,
        alt_text: "Green Dial Fluted-Bezel Date Watch front overhead view",
        is_primary: true,
        sort_order: 0
      },
      {
        id: "img-19-2",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/green-dial-fluted-bezel-2.png`,
        alt_text: "Green Dial Fluted-Bezel Date Watch angled three-quarter studio view",
        is_primary: false,
        sort_order: 1
      },
      {
        id: "img-19-3",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/green-dial-fluted-bezel-3.png`,
        alt_text: "Green Dial Fluted-Bezel Date Watch top-down flat-lay view",
        is_primary: false,
        sort_order: 2
      },
      {
        id: "img-19-4",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/green-dial-fluted-bezel-4.png`,
        alt_text: "Green Dial Fluted-Bezel Date Watch side profile showing crown and fluted bezel",
        is_primary: false,
        sort_order: 3
      },
      {
        id: "img-19-5",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/green-dial-fluted-bezel-5.png`,
        alt_text: "Green Dial Fluted-Bezel Date Watch macro close-up of green dial and magnified date window",
        is_primary: false,
        sort_order: 4
      }
    ],
    created_at: "2026-10-27T13:00:00.000Z"
  }),
  createProduct({
    id: "22222222-2222-4222-8222-222222222222",
    slug: "black-dial-gold-accent-watch",
    generic_name: "Black Dial Gold-Accent Watch",
    branded_title: "Fossil Black Dial Gold-Accent Chronograph-Style Watch",
    brand_candidate: "Fossil",
    brand_verified: false,
    limited_edition_verified: false,
    collection_id: "11111111-1111-4111-8111-111111111103",
    collection_slug: "modern-minimal",
    collection_name: "Modern Minimal",
    short_description:
      "Black dial with warm gold-tone hands and markers, multiple sub-dials, and a date window, paired with a dark-tone link bracelet.",
    description:
      "Paired with a dark-tone link bracelet and matching case, this watch features a matte black dial accented with warm gold-tone hands and markers, multiple sub-dials, and an angled date window.",
    price_amount: 2499,
    original_price_amount: 2699,
    stock_quantity: 11,
    availability_status: "available",
    featured: true,
    published: true,
    sort_order: 3,
    specs: [
      { key: "Collection", value: "Modern Minimal" },
      { key: "Dial", value: "Black dial with gold-tone hands and markers" },
      { key: "Display", value: "Analog with multiple sub-dials and date window" },
      { key: "Bracelet", value: "Dark-tone link bracelet" }
    ],
    images: [
      {
        id: "img-18-1",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/black-dial-gold-accent-1.png`,
        alt_text: "Black Dial Gold-Accent Watch front overhead view",
        is_primary: true,
        sort_order: 0
      },
      {
        id: "img-18-2",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/black-dial-gold-accent-2.png`,
        alt_text: "Black Dial Gold-Accent Watch angled three-quarter studio view",
        is_primary: false,
        sort_order: 1
      },
      {
        id: "img-18-3",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/black-dial-gold-accent-3.png`,
        alt_text: "Black Dial Gold-Accent Watch top-down flat-lay view",
        is_primary: false,
        sort_order: 2
      },
      {
        id: "img-18-4",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/black-dial-gold-accent-4.png`,
        alt_text: "Black Dial Gold-Accent Watch side profile showing crown and pushers",
        is_primary: false,
        sort_order: 3
      },
      {
        id: "img-18-5",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/black-dial-gold-accent-5.png`,
        alt_text: "Black Dial Gold-Accent Watch macro close-up of black dial and gold-tone hands",
        is_primary: false,
        sort_order: 4
      }
    ],
    created_at: "2026-10-27T12:45:00.000Z"
  }),
  createProduct({
    id: "22222222-2222-4222-8222-222222222221",
    slug: "blue-dial-multi-dial-watch",
    generic_name: "Blue Dial Multi-Dial Watch",
    branded_title: "Omega De Ville Blue Dial Multi-Dial Watch",
    brand_candidate: "Omega De Ville",
    brand_verified: false,
    limited_edition_verified: false,
    collection_id: "11111111-1111-4111-8111-111111111101",
    collection_slug: "signature",
    collection_name: "Signature",
    short_description:
      "Concentric blue dial with three sub-dials and a date window, paired with a silver-tone multi-link bracelet.",
    description:
      "Paired with a silver-tone case and multi-link bracelet, this watch features a concentric blue dial accented with baton markers, multiple sub-dials, and a date window.",
    price_amount: 3699,
    original_price_amount: 3999,
    stock_quantity: 6,
    availability_status: "available",
    featured: true,
    published: true,
    sort_order: 4,
    specs: [
      { key: "Collection", value: "Signature" },
      { key: "Dial", value: "Blue dial with concentric ring detailing" },
      { key: "Display", value: "Analog with multiple sub-dials and date window" },
      { key: "Bracelet", value: "Silver-tone multi-link bracelet" }
    ],
    images: [
      {
        id: "img-17-1",
        url: `${WEBSITE_BASE_URL}/assets/watches/signature/blue-dial-multi-dial-1.jpg`,
        alt_text: "Blue Dial Multi-Dial Watch front overhead view",
        is_primary: true,
        sort_order: 0
      },
      {
        id: "img-17-2",
        url: `${WEBSITE_BASE_URL}/assets/watches/signature/blue-dial-multi-dial-2.jpg`,
        alt_text: "Blue Dial Multi-Dial Watch angled three-quarter studio view",
        is_primary: false,
        sort_order: 1
      },
      {
        id: "img-17-3",
        url: `${WEBSITE_BASE_URL}/assets/watches/signature/blue-dial-multi-dial-3.jpg`,
        alt_text: "Blue Dial Multi-Dial Watch full vertical bracelet and clasp view",
        is_primary: false,
        sort_order: 2
      },
      {
        id: "img-17-4",
        url: `${WEBSITE_BASE_URL}/assets/watches/signature/blue-dial-multi-dial-4.jpg`,
        alt_text: "Blue Dial Multi-Dial Watch low-angle side profile view",
        is_primary: false,
        sort_order: 3
      },
      {
        id: "img-17-5",
        url: `${WEBSITE_BASE_URL}/assets/watches/signature/blue-dial-multi-dial-5.jpg`,
        alt_text: "Blue Dial Multi-Dial Watch macro close-up of blue dial and sub-dials",
        is_primary: false,
        sort_order: 4
      }
    ],
    created_at: "2026-10-27T12:30:00.000Z"
  }),
  createProduct({
    id: "22222222-2222-4222-8222-222222222220",
    slug: "white-dial-tonneau-style-dress-watch",
    generic_name: "White Dial Tonneau-Style Dress Watch",
    branded_title: "Franck Muller Tonneau-Style Dress Watch",
    brand_candidate: "Franck Muller",
    brand_verified: false,
    limited_edition_verified: false,
    collection_id: "11111111-1111-4111-8111-111111111103",
    collection_slug: "modern-minimal",
    collection_name: "Modern Minimal",
    short_description:
      "Tonneau-shaped case with a light textured dial, oversized Arabic numerals, blue-tone hands, and a black textured strap.",
    description:
      "Shaped with a curved tonneau case, this dress watch showcases a light textured dial with oversized Arabic numerals, blue-tone hands, a 6 o'clock date window, and a black textured strap.",
    price_amount: 2999,
    original_price_amount: 3499,
    stock_quantity: 8,
    availability_status: "available",
    featured: true,
    published: true,
    sort_order: 5,
    specs: [
      { key: "Collection", value: "Modern Minimal" },
      { key: "Case", value: "Tonneau-shaped case" },
      { key: "Dial", value: "Light textured dial with oversized Arabic numerals" },
      { key: "Hands", value: "Blue-tone hands" },
      { key: "Display", value: "Analog with 6 o'clock date window" },
      { key: "Strap", value: "Black textured strap" }
    ],
    images: [
      {
        id: "img-16-1",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/white-dial-tonneau-dress-1.jpg`,
        alt_text: "White Dial Tonneau-Style Dress Watch front overhead view",
        is_primary: true,
        sort_order: 0
      },
      {
        id: "img-16-2",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/white-dial-tonneau-dress-2.jpg`,
        alt_text: "White Dial Tonneau-Style Dress Watch angled horizontal studio view",
        is_primary: false,
        sort_order: 1
      },
      {
        id: "img-16-3",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/white-dial-tonneau-dress-3.jpg`,
        alt_text: "White Dial Tonneau-Style Dress Watch full vertical strap and buckle view",
        is_primary: false,
        sort_order: 2
      },
      {
        id: "img-16-4",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/white-dial-tonneau-dress-4.jpg`,
        alt_text: "White Dial Tonneau-Style Dress Watch side profile view",
        is_primary: false,
        sort_order: 3
      },
      {
        id: "img-16-5",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/white-dial-tonneau-dress-5.jpg`,
        alt_text: "White Dial Tonneau-Style Dress Watch macro close-up of textured dial",
        is_primary: false,
        sort_order: 4
      }
    ],
    created_at: "2026-10-27T12:15:00.000Z"
  }),
  createProduct({
    id: "22222222-2222-4222-8222-222222222219",
    slug: "rado-diastar-gold-tone-automatic-watch",
    generic_name: "Sculpted Gold-Tone Champagne Dial Day-Date Watch",
    branded_title: "Rado DiaStar Gold-Tone Automatic Watch",
    brand_candidate: "Rado DiaStar",
    brand_verified: false,
    limited_edition_verified: false,
    collection_id: "11111111-1111-4111-8111-111111111102",
    collection_slug: "automatic-classics",
    collection_name: "Automatic Classics",
    short_description:
      "Sculpted gold-tone case and link bracelet paired with a champagne-colored dial, decorative markers, and a day-date display.",
    description:
      "Defined by a sculpted gold-tone case and matching link bracelet, this timepiece features a champagne-colored dial accented with decorative markers, a contrasting dark vertical center band, and a day-date display.",
    price_amount: 3499,
    original_price_amount: 3999,
    stock_quantity: 6,
    availability_status: "available",
    featured: true,
    published: true,
    sort_order: 6,
    specs: [
      { key: "Collection", value: "Automatic Classics" },
      { key: "Dial", value: "Champagne-colored dial with decorative markers" },
      { key: "Display", value: "Analog with day-date display" },
      { key: "Case & Bracelet", value: "Gold-tone case and link bracelet" }
    ],
    images: [
      {
        id: "img-15-1",
        url: `${WEBSITE_BASE_URL}/assets/watches/automatic-classics/rado-diastar-gold-tone-1.jpg`,
        alt_text: "Sculpted Gold-Tone Champagne Dial Day-Date Watch front overhead view",
        is_primary: true,
        sort_order: 0
      },
      {
        id: "img-15-2",
        url: `${WEBSITE_BASE_URL}/assets/watches/automatic-classics/rado-diastar-gold-tone-2.jpg`,
        alt_text: "Sculpted Gold-Tone Champagne Dial Day-Date Watch angled studio view",
        is_primary: false,
        sort_order: 1
      },
      {
        id: "img-15-3",
        url: `${WEBSITE_BASE_URL}/assets/watches/automatic-classics/rado-diastar-gold-tone-3.jpg`,
        alt_text: "Sculpted Gold-Tone Champagne Dial Day-Date Watch full vertical bracelet view",
        is_primary: false,
        sort_order: 2
      },
      {
        id: "img-15-4",
        url: `${WEBSITE_BASE_URL}/assets/watches/automatic-classics/rado-diastar-gold-tone-4.jpg`,
        alt_text: "Sculpted Gold-Tone Champagne Dial Day-Date Watch low-angle side profile view",
        is_primary: false,
        sort_order: 3
      },
      {
        id: "img-15-5",
        url: `${WEBSITE_BASE_URL}/assets/watches/automatic-classics/rado-diastar-gold-tone-5.jpg`,
        alt_text: "Sculpted Gold-Tone Champagne Dial Day-Date Watch macro close-up of champagne dial",
        is_primary: false,
        sort_order: 4
      }
    ],
    created_at: "2026-10-27T12:00:00.000Z"
  }),
  createProduct({
    id: "22222222-2222-4222-8222-222222222218",
    slug: "fossil-white-dial-gold-tone-watch",
    generic_name: "White Dial Roman Numeral Gold-Tone Watch",
    branded_title: "Fossil White Dial Gold-Tone Watch",
    brand_candidate: "Fossil",
    brand_verified: false,
    limited_edition_verified: false,
    collection_id: "11111111-1111-4111-8111-111111111104",
    collection_slug: "limited-editions",
    collection_name: "Limited Editions",
    short_description:
      "Clean white dial with Roman numeral accents, multiple sub-dials, and a date display, paired with a warm gold-tone case and bracelet.",
    description:
      "Paired with a warm gold-tone case and matching link bracelet, this watch features a clean white dial accented with gold-tone Roman numerals, baton markers, multiple sub-dials, and a date display.",
    price_amount: 2499,
    original_price_amount: 2899,
    stock_quantity: 7,
    availability_status: "available",
    featured: true,
    published: true,
    sort_order: 7,
    specs: [
      { key: "Collection", value: "Limited Editions" },
      { key: "Dial", value: "White dial with Roman numeral accents" },
      { key: "Display", value: "Analog with multiple sub-dials and date display" },
      { key: "Case & Bracelet", value: "Gold-tone case and link bracelet" }
    ],
    images: [
      {
        id: "img-14-1",
        url: `${WEBSITE_BASE_URL}/assets/watches/limited-editions/fossil-white-dial-gold-tone-1.jpg`,
        alt_text: "White Dial Roman Numeral Gold-Tone Watch front overhead view",
        is_primary: true,
        sort_order: 0
      },
      {
        id: "img-14-2",
        url: `${WEBSITE_BASE_URL}/assets/watches/limited-editions/fossil-white-dial-gold-tone-2.jpg`,
        alt_text: "White Dial Roman Numeral Gold-Tone Watch angled horizontal studio view",
        is_primary: false,
        sort_order: 1
      },
      {
        id: "img-14-3",
        url: `${WEBSITE_BASE_URL}/assets/watches/limited-editions/fossil-white-dial-gold-tone-3.jpg`,
        alt_text: "White Dial Roman Numeral Gold-Tone Watch full vertical bracelet view",
        is_primary: false,
        sort_order: 2
      },
      {
        id: "img-14-4",
        url: `${WEBSITE_BASE_URL}/assets/watches/limited-editions/fossil-white-dial-gold-tone-4.jpg`,
        alt_text: "White Dial Roman Numeral Gold-Tone Watch side profile view",
        is_primary: false,
        sort_order: 3
      },
      {
        id: "img-14-5",
        url: `${WEBSITE_BASE_URL}/assets/watches/limited-editions/fossil-white-dial-gold-tone-5.jpg`,
        alt_text: "White Dial Roman Numeral Gold-Tone Watch macro close-up of white dial",
        is_primary: false,
        sort_order: 4
      }
    ],
    created_at: "2026-10-27T11:45:00.000Z"
  }),
  createProduct({
    id: "22222222-2222-4222-8222-222222222217",
    slug: "blue-rectangular-dial-watch",
    generic_name: "Blue Rectangular Dial Watch",
    branded_title: "Tissot Blue Rectangular Dial Watch",
    brand_candidate: "Tissot",
    brand_verified: false,
    limited_edition_verified: false,
    collection_id: "11111111-1111-4111-8111-111111111105",
    collection_slug: "everyday-icons",
    collection_name: "Everyday Icons",
    short_description:
      "Rectangular blue dial with warm gold-tone hands and accents, framed by a dark-tone case and paired with a blue strap.",
    description:
      "Defined by a sleek rectangular blue dial with warm gold-tone hands and geometric inner-frame accents, this watch pairs a dark-tone rectangular case with a coordinated blue strap for a clean, contemporary silhouette.",
    price_amount: 1499,
    original_price_amount: 1699,
    stock_quantity: 15,
    availability_status: "available",
    featured: true,
    published: true,
    sort_order: 8,
    specs: [
      { key: "Collection", value: "Everyday Icons" },
      { key: "Dial", value: "Rectangular blue dial with gold-tone hands and accents" },
      { key: "Display", value: "Two-hand analog" },
      { key: "Case", value: "Dark-tone rectangular case" },
      { key: "Strap", value: "Blue strap" }
    ],
    images: [
      {
        id: "img-13-1",
        url: `${WEBSITE_BASE_URL}/assets/watches/everyday-icons/blue-rectangular-dial-1.jpg`,
        alt_text: "Blue Rectangular Dial Watch front overhead view",
        is_primary: true,
        sort_order: 0
      },
      {
        id: "img-13-2",
        url: `${WEBSITE_BASE_URL}/assets/watches/everyday-icons/blue-rectangular-dial-2.jpg`,
        alt_text: "Blue Rectangular Dial Watch angled horizontal studio view",
        is_primary: false,
        sort_order: 1
      },
      {
        id: "img-13-3",
        url: `${WEBSITE_BASE_URL}/assets/watches/everyday-icons/blue-rectangular-dial-3.jpg`,
        alt_text: "Blue Rectangular Dial Watch side profile view",
        is_primary: false,
        sort_order: 2
      },
      {
        id: "img-13-4",
        url: `${WEBSITE_BASE_URL}/assets/watches/everyday-icons/blue-rectangular-dial-4.jpg`,
        alt_text: "Blue Rectangular Dial Watch macro close-up of rectangular blue dial",
        is_primary: false,
        sort_order: 3
      }
    ],
    created_at: "2026-10-27T11:30:00.000Z"
  }),
  createProduct({
    id: "22222222-2222-4222-8222-222222222216",
    slug: "casio-edifice-two-tone-chronograph-style-watch",
    generic_name: "Two-Tone Silver & Gold Chronograph-Style Watch",
    branded_title: "Casio Edifice Two-Tone Chronograph-Style Watch",
    brand_candidate: "Casio Edifice",
    brand_verified: false,
    limited_edition_verified: false,
    collection_id: "11111111-1111-4111-8111-111111111101",
    collection_slug: "signature",
    collection_name: "Signature",
    short_description:
      "White and silver-tone dial with warm gold-tone accents, multiple sub-dials, a date display, and a silver-and-gold-tone link bracelet.",
    description:
      "Featuring a textured white and silver-tone dial highlighted by warm gold-tone accents, multiple sub-dials, and a date display at 3 o'clock, this watch is paired with a coordinated silver-and-gold-tone metal link bracelet.",
    price_amount: 2999,
    original_price_amount: 3699,
    stock_quantity: 9,
    availability_status: "available",
    featured: true,
    published: true,
    sort_order: 9,
    specs: [
      { key: "Collection", value: "Signature" },
      { key: "Dial", value: "White/silver dial with gold-tone accents" },
      { key: "Display", value: "Analog with multiple sub-dials and date display" },
      { key: "Bracelet", value: "Silver-and-gold-tone metal link bracelet" }
    ],
    images: [
      {
        id: "img-12-1",
        url: `${WEBSITE_BASE_URL}/assets/watches/signature/casio-edifice-two-tone-1.jpg`,
        alt_text: "Two-Tone Silver & Gold Chronograph-Style Watch front studio view",
        is_primary: true,
        sort_order: 0
      },
      {
        id: "img-12-2",
        url: `${WEBSITE_BASE_URL}/assets/watches/signature/casio-edifice-two-tone-2.jpg`,
        alt_text: "Two-Tone Silver & Gold Chronograph-Style Watch angled studio view",
        is_primary: false,
        sort_order: 1
      },
      {
        id: "img-12-3",
        url: `${WEBSITE_BASE_URL}/assets/watches/signature/casio-edifice-two-tone-3.jpg`,
        alt_text: "Two-Tone Silver & Gold Chronograph-Style Watch full bracelet view",
        is_primary: false,
        sort_order: 2
      },
      {
        id: "img-12-4",
        url: `${WEBSITE_BASE_URL}/assets/watches/signature/casio-edifice-two-tone-4.jpg`,
        alt_text: "Two-Tone Silver & Gold Chronograph-Style Watch macro dial close-up",
        is_primary: false,
        sort_order: 3
      }
    ],
    created_at: "2026-10-27T11:15:00.000Z"
  }),
  createProduct({
    id: "22222222-2222-4222-8222-222222222215",
    slug: "casio-edifice-blue-accent-chronograph-style-watch",
    generic_name: "Charcoal Dial Blue-Accent Chronograph-Style Watch",
    branded_title: "Casio Edifice Blue-Accent Chronograph-Style Watch",
    brand_candidate: "Casio Edifice",
    brand_verified: false,
    limited_edition_verified: false,
    collection_id: "11111111-1111-4111-8111-111111111101",
    collection_slug: "signature",
    collection_name: "Signature",
    short_description:
      "Dark-tone metal bracelet and case paired with a layered charcoal dial, blue accents, multiple sub-dials, and a date display.",
    description:
      "Paired with a dark-tone metal case and matching link bracelet, this watch features a layered charcoal dial highlighted by blue accents, multiple sub-dials, and a date display at 3 o'clock.",
    price_amount: 2999,
    original_price_amount: 3699,
    stock_quantity: 8,
    availability_status: "available",
    featured: true,
    published: true,
    sort_order: 10,
    specs: [
      { key: "Collection", value: "Signature" },
      { key: "Dial", value: "Charcoal dial with blue accents" },
      { key: "Display", value: "Analog with multiple sub-dials and date display" },
      { key: "Case & Bracelet", value: "Dark-tone metal case and link bracelet" }
    ],
    images: [
      {
        id: "img-11-1",
        url: `${WEBSITE_BASE_URL}/assets/watches/signature/casio-edifice-blue-accent-1.jpg`,
        alt_text: "Charcoal Dial Blue-Accent Chronograph-Style Watch front overhead view",
        is_primary: true,
        sort_order: 0
      },
      {
        id: "img-11-2",
        url: `${WEBSITE_BASE_URL}/assets/watches/signature/casio-edifice-blue-accent-2.jpg`,
        alt_text: "Charcoal Dial Blue-Accent Chronograph-Style Watch angled studio view",
        is_primary: false,
        sort_order: 1
      },
      {
        id: "img-11-3",
        url: `${WEBSITE_BASE_URL}/assets/watches/signature/casio-edifice-blue-accent-3.jpg`,
        alt_text: "Charcoal Dial Blue-Accent Chronograph-Style Watch side profile view",
        is_primary: false,
        sort_order: 2
      },
      {
        id: "img-11-4",
        url: `${WEBSITE_BASE_URL}/assets/watches/signature/casio-edifice-blue-accent-4.jpg`,
        alt_text: "Charcoal Dial Blue-Accent Chronograph-Style Watch full bracelet view",
        is_primary: false,
        sort_order: 3
      },
      {
        id: "img-11-5",
        url: `${WEBSITE_BASE_URL}/assets/watches/signature/casio-edifice-blue-accent-5.jpg`,
        alt_text: "Charcoal Dial Blue-Accent Chronograph-Style Watch macro dial close-up",
        is_primary: false,
        sort_order: 4
      }
    ],
    created_at: "2026-10-27T11:00:00.000Z"
  }),
  createProduct({
    id: "22222222-2222-4222-8222-222222222214",
    slug: "orange-accent-racing-chronograph-style-watch",
    generic_name: "Orange-Accent Racing Chronograph-Style Watch",
    branded_title: "Ferrari Racing Chronograph-Style Watch — Orange Edition",
    brand_candidate: "Ferrari",
    brand_verified: false,
    limited_edition_verified: false,
    collection_id: "11111111-1111-4111-8111-111111111105",
    collection_slug: "everyday-icons",
    collection_name: "Everyday Icons",
    short_description:
      "Black watch with a dark textured dial, orange dial accents, racing-style bezel markings, multiple sub-dials, a date window, and a black strap with orange details.",
    description:
      "A black watch featuring a dark textured dial with orange dial accents, racing-style bezel markings, multiple sub-dials, a date window, and a black strap with orange details.",
    price_amount: 1499,
    original_price_amount: 1699,
    stock_quantity: 12,
    availability_status: "available",
    featured: true,
    published: true,
    sort_order: 11,
    specs: [
      { key: "Collection", value: "Everyday Icons" },
      { key: "Dial", value: "Dark textured dial with orange accents" },
      { key: "Display", value: "Analog with multiple sub-dials and date window" },
      { key: "Bezel", value: "Racing-style bezel markings" },
      { key: "Strap", value: "Black strap with orange details" }
    ],
    images: [
      {
        id: "img-7-1",
        url: `${WEBSITE_BASE_URL}/assets/watches/everyday-icons/racing-chronograph-orange-1.jpg`,
        alt_text: "Orange-Accent Racing Chronograph-Style Watch front overhead view",
        is_primary: true,
        sort_order: 0
      },
      {
        id: "img-7-2",
        url: `${WEBSITE_BASE_URL}/assets/watches/everyday-icons/racing-chronograph-orange-2.jpg`,
        alt_text: "Orange-Accent Racing Chronograph-Style Watch angled studio view",
        is_primary: false,
        sort_order: 1
      },
      {
        id: "img-7-3",
        url: `${WEBSITE_BASE_URL}/assets/watches/everyday-icons/racing-chronograph-orange-3.jpg`,
        alt_text: "Orange-Accent Racing Chronograph-Style Watch full vertical strap view",
        is_primary: false,
        sort_order: 2
      },
      {
        id: "img-7-4",
        url: `${WEBSITE_BASE_URL}/assets/watches/everyday-icons/racing-chronograph-orange-4.jpg`,
        alt_text: "Orange-Accent Racing Chronograph-Style Watch side profile view",
        is_primary: false,
        sort_order: 3
      },
      {
        id: "img-7-5",
        url: `${WEBSITE_BASE_URL}/assets/watches/everyday-icons/racing-chronograph-orange-5.jpg`,
        alt_text: "Orange-Accent Racing Chronograph-Style Watch macro dial close-up",
        is_primary: false,
        sort_order: 4
      }
    ],
    created_at: "2026-10-27T10:35:00.000Z"
  }),
  createProduct({
    id: "22222222-2222-4222-8222-222222222213",
    slug: "red-accent-racing-chronograph-style-watch",
    generic_name: "Red-Accent Racing Chronograph-Style Watch",
    branded_title: "Ferrari Racing Chronograph-Style Watch — Red Edition",
    brand_candidate: "Ferrari",
    brand_verified: false,
    limited_edition_verified: false,
    collection_id: "11111111-1111-4111-8111-111111111105",
    collection_slug: "everyday-icons",
    collection_name: "Everyday Icons",
    short_description:
      "Black watch with a dark textured dial, red dial accents, racing-style bezel markings, multiple sub-dials, a date window, and a black strap with red details.",
    description:
      "A black watch featuring a dark textured dial with red dial accents, racing-style bezel markings, multiple sub-dials, a date window, and a black strap with red details.",
    price_amount: 1499,
    original_price_amount: 1699,
    stock_quantity: 12,
    availability_status: "available",
    featured: true,
    published: true,
    sort_order: 12,
    specs: [
      { key: "Collection", value: "Everyday Icons" },
      { key: "Dial", value: "Dark textured dial with red accents" },
      { key: "Display", value: "Analog with multiple sub-dials and date window" },
      { key: "Bezel", value: "Racing-style bezel markings" },
      { key: "Strap", value: "Black strap with red details" }
    ],
    images: [
      {
        id: "img-10-1",
        url: `${WEBSITE_BASE_URL}/assets/watches/everyday-icons/racing-chronograph-red-1.jpg`,
        alt_text: "Red-Accent Racing Chronograph-Style Watch front overhead view",
        is_primary: true,
        sort_order: 0
      },
      {
        id: "img-10-2",
        url: `${WEBSITE_BASE_URL}/assets/watches/everyday-icons/racing-chronograph-red-2.jpg`,
        alt_text: "Red-Accent Racing Chronograph-Style Watch side profile view",
        is_primary: false,
        sort_order: 1
      },
      {
        id: "img-10-3",
        url: `${WEBSITE_BASE_URL}/assets/watches/everyday-icons/racing-chronograph-red-3.jpg`,
        alt_text: "Red-Accent Racing Chronograph-Style Watch full strap view",
        is_primary: false,
        sort_order: 2
      },
      {
        id: "img-10-4",
        url: `${WEBSITE_BASE_URL}/assets/watches/everyday-icons/racing-chronograph-red-4.jpg`,
        alt_text: "Red-Accent Racing Chronograph-Style Watch macro dial close-up",
        is_primary: false,
        sort_order: 3
      }
    ],
    created_at: "2026-10-27T10:30:00.000Z"
  }),
  createProduct({
    id: "22222222-2222-4222-8222-222222222212",
    slug: "tissot-chronograph-style-watch",
    generic_name: "Sporty Tachymeter-Bezel Multi-Dial Black Strap Watch",
    branded_title: "Tissot Chronograph-Style Watch",
    brand_candidate: "Tissot",
    brand_verified: false,
    limited_edition_verified: false,
    collection_id: "11111111-1111-4111-8111-111111111105",
    collection_slug: "everyday-icons",
    collection_name: "Everyday Icons",
    short_description:
      "Sporty multi-dial face, tachymeter-style bezel markings, date window, and textured black strap.",
    description:
      "A sporty multi-dial face, tachymeter-style bezel markings, and black strap give this watch a bold, versatile look with three sub-dials and a date window.",
    price_amount: 1499,
    original_price_amount: 1699,
    stock_quantity: 14,
    availability_status: "available",
    featured: false,
    published: true,
    sort_order: 13,
    specs: [
      { key: "Collection", value: "Everyday Icons" },
      { key: "Display", value: "Analog with sub-dials and date window" },
      { key: "Bezel", value: "Tachymeter-style markings" },
      { key: "Strap", value: "Black textured strap" }
    ],
    images: [
      {
        id: "img-9-1",
        url: `${WEBSITE_BASE_URL}/assets/watches/everyday-icons/tissot-chronograph-style-1.jpg`,
        alt_text: "Sporty Tachymeter-Bezel Multi-Dial Black Strap Watch angled studio view",
        is_primary: true,
        sort_order: 0
      },
      {
        id: "img-9-2",
        url: `${WEBSITE_BASE_URL}/assets/watches/everyday-icons/tissot-chronograph-style-2.jpg`,
        alt_text: "Sporty Tachymeter-Bezel Multi-Dial Black Strap Watch flat-lay view",
        is_primary: false,
        sort_order: 1
      },
      {
        id: "img-9-3",
        url: `${WEBSITE_BASE_URL}/assets/watches/everyday-icons/tissot-chronograph-style-3.jpg`,
        alt_text: "Sporty Tachymeter-Bezel Multi-Dial Black Strap Watch side profile view",
        is_primary: false,
        sort_order: 2
      },
      {
        id: "img-9-4",
        url: `${WEBSITE_BASE_URL}/assets/watches/everyday-icons/tissot-chronograph-style-4.jpg`,
        alt_text: "Sporty Tachymeter-Bezel Multi-Dial Black Strap Watch macro dial close-up",
        is_primary: false,
        sort_order: 3
      },
      {
        id: "img-9-5",
        url: `${WEBSITE_BASE_URL}/assets/watches/everyday-icons/tissot-chronograph-style-5.jpg`,
        alt_text: "Sporty Tachymeter-Bezel Multi-Dial Black Strap Watch alternate dial view",
        is_primary: false,
        sort_order: 4
      }
    ],
    created_at: "2026-10-27T10:00:00.000Z"
  }),
  createProduct({
    id: "22222222-2222-4222-8222-222222222211",
    slug: "gucci-black-motif-dress-watch",
    generic_name: "Black Motif Dial Ridged-Bezel Dress Watch",
    branded_title: "Gucci Black Motif Dress Watch",
    brand_candidate: "Gucci",
    brand_verified: false,
    limited_edition_verified: false,
    collection_id: "11111111-1111-4111-8111-111111111103",
    collection_slug: "modern-minimal",
    collection_name: "Modern Minimal",
    short_description:
      "Textured black dial, gold-tone hands, and decorative star and insect motifs paired with a ridged bezel and black strap.",
    description:
      "A textured black dial, gold-tone hands, and decorative star and insect motifs give this watch a distinctive look. The ridged bezel and black strap complete its refined style.",
    price_amount: 2499,
    original_price_amount: 2799,
    stock_quantity: 9,
    availability_status: "available",
    featured: false,
    published: true,
    sort_order: 14,
    specs: [
      { key: "Collection", value: "Modern Minimal" },
      { key: "Display", value: "Two-hand analog" },
      { key: "Dial", value: "Textured black dial with gold-tone decorative motifs" },
      { key: "Bezel", value: "Ridged gold-tone bezel" },
      { key: "Strap", value: "Black strap" }
    ],
    images: [
      {
        id: "img-8-1",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/gucci-black-motif-dress-1.jpg`,
        alt_text: "Black Motif Dial Ridged-Bezel Dress Watch front overhead view",
        is_primary: true,
        sort_order: 0
      },
      {
        id: "img-8-2",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/gucci-black-motif-dress-2.jpg`,
        alt_text: "Black Motif Dial Ridged-Bezel Dress Watch angled studio view",
        is_primary: false,
        sort_order: 1
      },
      {
        id: "img-8-3",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/gucci-black-motif-dress-3.jpg`,
        alt_text: "Black Motif Dial Ridged-Bezel Dress Watch side profile view",
        is_primary: false,
        sort_order: 2
      },
      {
        id: "img-8-4",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/gucci-black-motif-dress-4.jpg`,
        alt_text: "Black Motif Dial Ridged-Bezel Dress Watch full flat-lay view",
        is_primary: false,
        sort_order: 3
      },
      {
        id: "img-8-5",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/gucci-black-motif-dress-5.jpg`,
        alt_text: "Black Motif Dial Ridged-Bezel Dress Watch macro dial close-up",
        is_primary: false,
        sort_order: 4
      }
    ],
    created_at: "2026-10-27T09:30:00.000Z"
  }),
  createProduct({
    id: "22222222-2222-4222-8222-222222222210",
    slug: "fossil-black-dial-multi-dial-watch",
    generic_name: "Black Dial Gold-Tone Multi-Dial Brown Strap Watch",
    branded_title: "Fossil Black Dial Multi-Dial Watch",
    brand_candidate: "Fossil",
    brand_verified: false,
    limited_edition_verified: false,
    collection_id: "11111111-1111-4111-8111-111111111103",
    collection_slug: "modern-minimal",
    collection_name: "Modern Minimal",
    short_description:
      "Bold black dial, textured bezel, and warm gold-tone accents paired with a classic brown strap and multi-dial face.",
    description:
      "A bold black dial, textured bezel, and warm gold-tone accents give this watch a refined look. The brown strap adds a classic touch, while the multi-dial layout and date window bring extra detail to the face.",
    price_amount: 1799,
    original_price_amount: 2399,
    stock_quantity: 10,
    availability_status: "available",
    featured: false,
    published: true,
    sort_order: 15,
    specs: [
      { key: "Collection", value: "Modern Minimal" },
      { key: "Display", value: "Analog with multiple sub-dials and date window" },
      { key: "Dial & Bezel", value: "Black dial and textured bezel with gold-tone accents" },
      { key: "Strap", value: "Brown strap" }
    ],
    images: [
      {
        id: "img-6-1",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/fossil-black-dial-multi-dial-1.jpg`,
        alt_text: "Black Dial Gold-Tone Multi-Dial Brown Strap Watch front overhead view",
        is_primary: true,
        sort_order: 0
      },
      {
        id: "img-6-2",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/fossil-black-dial-multi-dial-2.jpg`,
        alt_text: "Black Dial Gold-Tone Multi-Dial Brown Strap Watch angled studio view",
        is_primary: false,
        sort_order: 1
      },
      {
        id: "img-6-3",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/fossil-black-dial-multi-dial-3.jpg`,
        alt_text: "Black Dial Gold-Tone Multi-Dial Brown Strap Watch full strap view",
        is_primary: false,
        sort_order: 2
      },
      {
        id: "img-6-4",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/fossil-black-dial-multi-dial-4.jpg`,
        alt_text: "Black Dial Gold-Tone Multi-Dial Brown Strap Watch side profile view",
        is_primary: false,
        sort_order: 3
      },
      {
        id: "img-6-5",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/fossil-black-dial-multi-dial-5.jpg`,
        alt_text: "Black Dial Gold-Tone Multi-Dial Brown Strap Watch macro dial close-up",
        is_primary: false,
        sort_order: 4
      }
    ],
    created_at: "2026-10-27T09:00:00.000Z"
  }),
  createProduct({
    id: "22222222-2222-4222-8222-222222222209",
    slug: "tommy-hilfiger-sport-inspired-analog-watch",
    generic_name: "Black Dial Tri-Color Strap Sport Analog Watch",
    branded_title: "Tommy Hilfiger Sport-Inspired Analog Watch",
    brand_candidate: "Tommy Hilfiger",
    brand_verified: false,
    limited_edition_verified: false,
    collection_id: "11111111-1111-4111-8111-111111111105",
    collection_slug: "everyday-icons",
    collection_name: "Everyday Icons",
    short_description:
      "Clean black dial, polished markers, date window, and black strap with red, white, and blue center stripes.",
    description:
      "A clean black dial, polished markers, and red, white, and blue strap accents give this watch a sporty everyday look. It features a three-hand analog display and a date window.",
    price_amount: 1499,
    original_price_amount: 1799,
    stock_quantity: 16,
    availability_status: "available",
    featured: false,
    published: true,
    sort_order: 16,
    specs: [
      { key: "Collection", value: "Everyday Icons" },
      { key: "Dial & Case", value: "Black dial and dark case" },
      { key: "Display", value: "Analog with date window" },
      { key: "Strap", value: "Black strap with red, white, and blue accents" }
    ],
    images: [
      {
        id: "img-5-1",
        url: `${WEBSITE_BASE_URL}/assets/watches/everyday-icons/tommy-hilfiger-sport-1.jpg`,
        alt_text: "Black Dial Tri-Color Strap Sport Analog Watch front overhead view",
        is_primary: true,
        sort_order: 0
      },
      {
        id: "img-5-2",
        url: `${WEBSITE_BASE_URL}/assets/watches/everyday-icons/tommy-hilfiger-sport-2.jpg`,
        alt_text: "Black Dial Tri-Color Strap Sport Analog Watch angled studio view",
        is_primary: false,
        sort_order: 1
      },
      {
        id: "img-5-3",
        url: `${WEBSITE_BASE_URL}/assets/watches/everyday-icons/tommy-hilfiger-sport-3.jpg`,
        alt_text: "Black Dial Tri-Color Strap Sport Analog Watch full strap view",
        is_primary: false,
        sort_order: 2
      },
      {
        id: "img-5-4",
        url: `${WEBSITE_BASE_URL}/assets/watches/everyday-icons/tommy-hilfiger-sport-4.jpg`,
        alt_text: "Black Dial Tri-Color Strap Sport Analog Watch side profile view",
        is_primary: false,
        sort_order: 3
      },
      {
        id: "img-5-5",
        url: `${WEBSITE_BASE_URL}/assets/watches/everyday-icons/tommy-hilfiger-sport-5.jpg`,
        alt_text: "Black Dial Tri-Color Strap Sport Analog Watch macro dial close-up",
        is_primary: false,
        sort_order: 4
      }
    ],
    created_at: "2026-10-27T08:30:00.000Z"
  }),
  createProduct({
    id: "22222222-2222-4222-8222-222222222208",
    slug: "fossil-blue-dial-chronograph-style-watch",
    generic_name: "Blue-Grey Dial Roman Numeral Chronograph-Style Watch",
    branded_title: "Fossil Blue Dial Chronograph-Style Watch",
    brand_candidate: "Fossil",
    brand_verified: false,
    limited_edition_verified: false,
    collection_id: "11111111-1111-4111-8111-111111111105",
    collection_slug: "everyday-icons",
    collection_name: "Everyday Icons",
    short_description:
      "Rich blue-grey dial with Roman numeral accents, warm gold-tone details, multiple sub-dials, date window, and dark-tone metal bracelet.",
    description:
      "A rich blue-grey dial, Roman numeral accents, and warm gold-tone details give this watch a distinctive, polished look. Its dark metal bracelet, multi-dial face, and date window make it an easy match for everyday wear.",
    price_amount: 1499,
    original_price_amount: 1899,
    stock_quantity: 14,
    availability_status: "available",
    featured: false,
    published: true,
    sort_order: 17,
    specs: [
      { key: "Collection", value: "Everyday Icons" },
      { key: "Display", value: "Analog with three sub-dials and date window" },
      { key: "Dial", value: "Blue-grey dial with Roman numerals and gold-tone accents" },
      { key: "Bracelet", value: "Dark-tone metal link bracelet" }
    ],
    images: [
      {
        id: "img-4-1",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/fossil-modern-minimal-1.jpg`,
        alt_text: "Blue-Grey Dial Roman Numeral Chronograph-Style Watch front overhead view",
        is_primary: true,
        sort_order: 0
      },
      {
        id: "img-4-2",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/fossil-modern-minimal-2.jpg`,
        alt_text: "Blue-Grey Dial Roman Numeral Chronograph-Style Watch horizontal studio view",
        is_primary: false,
        sort_order: 1
      },
      {
        id: "img-4-3",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/fossil-modern-minimal-3.jpg`,
        alt_text: "Blue-Grey Dial Roman Numeral Chronograph-Style Watch full bracelet view",
        is_primary: false,
        sort_order: 2
      },
      {
        id: "img-4-4",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/fossil-modern-minimal-4.jpg`,
        alt_text: "Blue-Grey Dial Roman Numeral Chronograph-Style Watch side profile view",
        is_primary: false,
        sort_order: 3
      },
      {
        id: "img-4-5",
        url: `${WEBSITE_BASE_URL}/assets/watches/modern-minimal/fossil-modern-minimal-5.jpg`,
        alt_text: "Blue-Grey Dial Roman Numeral Chronograph-Style Watch macro dial close-up",
        is_primary: false,
        sort_order: 4
      }
    ],
    created_at: "2026-10-27T08:00:00.000Z"
  }),
  createProduct({
    id: "22222222-2222-4222-8222-222222222207",
    slug: "hoblet-emerald-green-dial-statement-watch",
    generic_name: "Emerald Green Dial Rose-Gold-Tone Statement Watch",
    branded_title: "HOBLET — Emerald Green Dial Statement Watch",
    brand_candidate: "HOBLET",
    brand_verified: false,
    limited_edition_verified: false,
    collection_id: "11111111-1111-4111-8111-111111111105",
    collection_slug: "everyday-icons",
    collection_name: "Everyday Icons",
    short_description:
      "Green dial with sub-dial details and a date window, paired with a dark textured bezel, rose-gold-tone case, and green strap.",
    description:
      "Features a green dial with decorative sub-dial details and a 6 o'clock date window. Framed by a dark textured bezel and a rose-gold-tone case, it is fitted with a matching green strap with tonal stitching.",
    price_amount: 1299,
    original_price_amount: 1699,
    stock_quantity: 18,
    availability_status: "available",
    featured: false,
    published: true,
    sort_order: 18,
    specs: [
      { key: "Collection", value: "Everyday Icons" },
      { key: "Dial", value: "Green dial with sub-dial details" },
      { key: "Calendar", value: "Date window at 6 o'clock" },
      { key: "Bezel & Case", value: "Dark textured bezel and rose-gold-tone case" },
      { key: "Strap", value: "Green strap with tonal stitching" }
    ],
    images: [
      {
        id: "img-3-1",
        url: `${WEBSITE_BASE_URL}/assets/watches/everyday-icons/hoblet-emerald-green-1.jpg`,
        alt_text: "Emerald Green Dial Rose-Gold-Tone Statement Watch front overhead view",
        is_primary: true,
        sort_order: 0
      },
      {
        id: "img-3-2",
        url: `${WEBSITE_BASE_URL}/assets/watches/everyday-icons/hoblet-emerald-green-2.jpg`,
        alt_text: "Emerald Green Dial Rose-Gold-Tone Statement Watch horizontal studio view",
        is_primary: false,
        sort_order: 1
      },
      {
        id: "img-3-3",
        url: `${WEBSITE_BASE_URL}/assets/watches/everyday-icons/hoblet-emerald-green-3.jpg`,
        alt_text: "Emerald Green Dial Rose-Gold-Tone Statement Watch full strap view",
        is_primary: false,
        sort_order: 2
      },
      {
        id: "img-3-4",
        url: `${WEBSITE_BASE_URL}/assets/watches/everyday-icons/hoblet-emerald-green-4.jpg`,
        alt_text: "Emerald Green Dial Rose-Gold-Tone Statement Watch side profile view",
        is_primary: false,
        sort_order: 3
      },
      {
        id: "img-3-5",
        url: `${WEBSITE_BASE_URL}/assets/watches/everyday-icons/hoblet-emerald-green-5.jpg`,
        alt_text: "Emerald Green Dial Rose-Gold-Tone Statement Watch macro dial close-up",
        is_primary: false,
        sort_order: 4
      }
    ],
    created_at: "2026-10-27T07:30:00.000Z"
  }),
  createProduct({
    id: "22222222-2222-4222-8222-222222222206",
    slug: "worldtimer-inspired-black-gold-watch",
    generic_name: "Worldtimer-Inspired Black & Gold Watch",
    branded_title: "Worldtimer-Inspired Black & Gold Watch",
    brand_candidate: null,
    brand_verified: false,
    limited_edition_verified: false,
    collection_id: "11111111-1111-4111-8111-111111111105",
    collection_slug: "everyday-icons",
    collection_name: "Everyday Icons",
    short_description:
      "Dark dial with a globe-style center, city names around the dial, date window, dark case with warm metallic accents, and black stitched strap.",
    description:
      "Features a dark dial with a globe-style center, an inner 24-hour ring, city names around the outer dial perimeter, and a 6 o'clock date window. Framed by a dark case with warm metallic accents, it is paired with a black textured strap finished with contrast stitching.",
    price_amount: 1799,
    original_price_amount: 2099,
    stock_quantity: 15,
    availability_status: "available",
    featured: false,
    published: true,
    sort_order: 19,
    specs: [
      { key: "Collection", value: "Everyday Icons" },
      { key: "Dial", value: "Dark dial with globe-style center and 24-hour ring" },
      { key: "Outer Ring", value: "City names around the dial" },
      { key: "Calendar", value: "Date window at 6 o'clock" },
      { key: "Case", value: "Dark case with warm metallic accents" },
      { key: "Strap", value: "Black textured strap with contrast stitching" }
    ],
    images: [
      {
        id: "img-2-1",
        url: `${WEBSITE_BASE_URL}/assets/watches/everyday-icons/worldtimer-inspired-black-gold-1.jpg`,
        alt_text: "Worldtimer-Inspired Black & Gold Watch front view",
        is_primary: true,
        sort_order: 0
      },
      {
        id: "img-2-2",
        url: `${WEBSITE_BASE_URL}/assets/watches/everyday-icons/worldtimer-inspired-black-gold-2.jpg`,
        alt_text: "Worldtimer-Inspired Black & Gold Watch angled view",
        is_primary: false,
        sort_order: 1
      },
      {
        id: "img-2-3",
        url: `${WEBSITE_BASE_URL}/assets/watches/everyday-icons/worldtimer-inspired-black-gold-3.jpg`,
        alt_text: "Worldtimer-Inspired Black & Gold Watch side profile view",
        is_primary: false,
        sort_order: 2
      },
      {
        id: "img-2-4",
        url: `${WEBSITE_BASE_URL}/assets/watches/everyday-icons/worldtimer-inspired-black-gold-4.jpg`,
        alt_text: "Worldtimer-Inspired Black & Gold Watch macro dial close-up",
        is_primary: false,
        sort_order: 3
      }
    ],
    created_at: "2026-10-27T07:05:00.000Z"
  }),
  createProduct({
    id: "22222222-2222-4222-8222-222222222200",
    slug: "casio-g-shock-utility-green",
    generic_name: "Octagonal Bezel Utility Green Analog-Digital Watch",
    branded_title: "Casio G-SHOCK Utility Green",
    brand_candidate: "Casio G-SHOCK",
    brand_verified: false,
    limited_edition_verified: false,
    collection_id: "11111111-1111-4111-8111-111111111101",
    collection_slug: "signature",
    collection_name: "Signature",
    short_description:
      "Octagonal matte black bezel paired with a utility olive green case and strap, featuring a dual-display analog-digital dial.",
    description:
      "Pairs a sculpted octagonal matte black bezel with an olive green case and matching strap. Its multi-layered matte black dial combines central analog hands, a 9 o'clock day indicator sub-dial, and a negative digital LCD display with four side push-button controls.",
    price_amount: 1839,
    original_price_amount: 2299,
    stock_quantity: 12,
    availability_status: "available",
    featured: true,
    published: true,
    sort_order: 20,
    specs: [
      { key: "Collection", value: "Signature" },
      { key: "Display", value: "Analog-digital with day sub-dial and negative LCD" },
      { key: "Bezel", value: "Octagonal matte black bezel" },
      { key: "Case & Strap", value: "Utility olive green case and strap" },
      { key: "Controls", value: "Four side push-buttons" }
    ],
    images: [
      {
        id: "img-1-1",
        url: `${WEBSITE_BASE_URL}/assets/watches/signature/casio-g-shock-utility-green-1.jpg`,
        alt_text: "Octagonal Bezel Utility Green Analog-Digital Watch front studio view",
        is_primary: true,
        sort_order: 0
      },
      {
        id: "img-1-2",
        url: `${WEBSITE_BASE_URL}/assets/watches/signature/casio-g-shock-utility-green-2.jpg`,
        alt_text: "Octagonal Bezel Utility Green Analog-Digital Watch angled view",
        is_primary: false,
        sort_order: 1
      },
      {
        id: "img-1-3",
        url: `${WEBSITE_BASE_URL}/assets/watches/signature/casio-g-shock-utility-green-3.jpg`,
        alt_text: "Octagonal Bezel Utility Green Analog-Digital Watch side profile view",
        is_primary: false,
        sort_order: 2
      },
      {
        id: "img-1-4",
        url: `${WEBSITE_BASE_URL}/assets/watches/signature/casio-g-shock-utility-green-4.jpg`,
        alt_text: "Octagonal Bezel Utility Green Analog-Digital Watch macro dial close-up",
        is_primary: false,
        sort_order: 3
      }
    ],
    created_at: "2026-10-27T06:30:00.000Z"
  })
];
