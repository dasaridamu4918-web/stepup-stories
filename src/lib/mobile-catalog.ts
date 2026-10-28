import { defaultCollections, defaultProducts } from "@/lib/default-data";
import type { CollectionRecord, ProductRecord, ProductSpecItem } from "@/types/database";

export interface MobileProductRecord {
  id: string;
  slug: string;
  /** Public product name: uses generic descriptive name unless brand_verified is true */
  name: string;
  /** Generic descriptive name based strictly on visible watch details */
  generic_name: string;
  /** Brand visible in photos (only shown publicly if brand_verified === true) */
  brand_candidate: string | null;
  brand_verified: boolean;
  limited_edition_verified: boolean;
  collection_id: string;
  collection_slug: string;
  collection_name: string;
  short_description: string;
  description: string;
  price_amount: number;
  original_price_amount: number;
  savings_amount: number;
  discount_percent: number;
  price_currency: "INR";
  price_display: string;
  original_price_display: string;
  savings_display: string;
  stock_quantity: number;
  availability_status: "available" | "out_of_stock" | "archived";
  featured: boolean;
  published: boolean;
  sort_order: number;
  specs: ProductSpecItem[];
  images: {
    id: string;
    url: string;
    alt_text: string;
    is_primary: boolean;
    sort_order: number;
  }[];
  created_at: string;
}

export interface MobileCollectionRecord {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  cover_image_url: string;
  product_count: number;
  sort_order: number;
}

const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://stepup-stories.vercel.app";

/**
 * Mapping of product IDs to verified-safe generic names, descriptions, and visible-only specs
 * so that unverified brand names, movement claims, water-resistance claims, or limited-edition
 * claims are never published unless explicitly verified in Admin.
 */
const VERIFIED_SAFE_OVERRIDES: Record<
  string,
  {
    generic_name: string;
    brand_candidate: string | null;
    short_description: string;
    description: string;
    specs: ProductSpecItem[];
    stock_quantity: number;
  }
> = {
  "22222222-2222-4222-8222-222222222200": {
    generic_name: "Octagonal Bezel Utility Green Analog-Digital Watch",
    brand_candidate: "Casio G-SHOCK",
    short_description:
      "Octagonal matte black bezel paired with a utility olive green case and strap, featuring a dual-display analog-digital dial.",
    description:
      "Pairs a sculpted octagonal matte black bezel with an olive green case and matching strap. Its multi-layered matte black dial combines central analog hands, a 9 o'clock day indicator sub-dial, and a negative digital LCD display with four side push-buttons.",
    specs: [
      { key: "Collection", value: "Signature" },
      { key: "Display", value: "Analog-digital with day sub-dial and negative LCD" },
      { key: "Bezel", value: "Octagonal matte black bezel" },
      { key: "Case & Strap", value: "Utility olive green case and strap" },
      { key: "Controls", value: "Four side push-buttons" }
    ],
    stock_quantity: 12
  },
  "22222222-2222-4222-8222-222222222206": {
    generic_name: "Worldtimer-Inspired Black & Gold Watch",
    brand_candidate: null,
    short_description:
      "Dark dial with a globe-style center, city names around the dial, date window, dark case with warm metallic accents, and black stitched strap.",
    description:
      "Features a dark dial with a globe-style center, an inner 24-hour ring, city names around the outer dial perimeter, and a 6 o'clock date window. Framed by a dark case with warm metallic accents and paired with a black textured strap with contrast stitching.",
    specs: [
      { key: "Collection", value: "Everyday Icons" },
      { key: "Dial", value: "Dark dial with globe-style center and 24-hour ring" },
      { key: "Outer Ring", value: "City names around the dial perimeter" },
      { key: "Calendar", value: "Date window at 6 o'clock" },
      { key: "Strap", value: "Black textured strap with contrast stitching" }
    ],
    stock_quantity: 15
  },
  "22222222-2222-4222-8222-222222222207": {
    generic_name: "Emerald Green Dial Rose-Gold-Tone Statement Watch",
    brand_candidate: "HOBLET",
    short_description:
      "Green dial with sub-dial details and a date window, paired with a dark textured bezel, rose-gold-tone case, and green strap.",
    description:
      "Features a green dial with decorative sub-dial details and a 6 o'clock date window. Framed by a dark textured bezel and a rose-gold-tone case, fitted with a matching green strap with tonal stitching.",
    specs: [
      { key: "Collection", value: "Everyday Icons" },
      { key: "Dial", value: "Green dial with sub-dial details" },
      { key: "Calendar", value: "Date window at 6 o'clock" },
      { key: "Bezel & Case", value: "Dark textured bezel and rose-gold-tone case" },
      { key: "Strap", value: "Green strap with tonal stitching" }
    ],
    stock_quantity: 18
  },
  "22222222-2222-4222-8222-222222222208": {
    generic_name: "Blue-Grey Dial Roman Numeral Chronograph-Style Watch",
    brand_candidate: "Fossil",
    short_description:
      "Rich blue-grey dial with Roman numeral accents, warm gold-tone details, multiple sub-dials, date window, and dark-tone metal bracelet.",
    description:
      "A rich blue-grey dial, Roman numeral accents, and warm gold-tone details give this watch a polished everyday look. Completed with a dark-tone metal link bracelet, three sub-dials, and a date window.",
    specs: [
      { key: "Collection", value: "Everyday Icons" },
      { key: "Display", value: "Analog with three sub-dials and date window" },
      { key: "Dial", value: "Blue-grey dial with Roman numerals and gold-tone accents" },
      { key: "Bracelet", value: "Dark-tone metal link bracelet" }
    ],
    stock_quantity: 14
  },
  "22222222-2222-4222-8222-222222222209": {
    generic_name: "Black Dial Tri-Color Strap Sport Analog Watch",
    brand_candidate: "Tommy Hilfiger",
    short_description:
      "Clean black dial, polished markers, date window, and black strap with red, white, and blue center stripes.",
    description:
      "A clean black dial, polished markers, and red, white, and blue strap accents give this watch a sporty everyday look with a three-hand analog display and a 3 o'clock date window.",
    specs: [
      { key: "Collection", value: "Everyday Icons" },
      { key: "Dial & Case", value: "Black dial and dark case" },
      { key: "Display", value: "Analog with date window" },
      { key: "Strap", value: "Black strap with red, white, and blue accents" }
    ],
    stock_quantity: 16
  },
  "22222222-2222-4222-8222-222222222210": {
    generic_name: "Black Dial Gold-Tone Multi-Dial Brown Strap Watch",
    brand_candidate: "Fossil",
    short_description:
      "Bold black dial, textured bezel, and warm gold-tone accents paired with a classic brown strap and multi-dial face.",
    description:
      "A bold black dial, textured bezel, and warm gold-tone accents give this watch a refined look. The brown strap adds a classic touch, while the multi-dial layout and date window bring extra detail to the face.",
    specs: [
      { key: "Collection", value: "Modern Minimal" },
      { key: "Display", value: "Analog with multiple sub-dials and date window" },
      { key: "Dial & Bezel", value: "Black dial and textured bezel with gold-tone accents" },
      { key: "Strap", value: "Brown strap" }
    ],
    stock_quantity: 10
  },
  "22222222-2222-4222-8222-222222222211": {
    generic_name: "Black Motif Dial Ridged-Bezel Dress Watch",
    brand_candidate: "Gucci",
    short_description:
      "Textured black dial, gold-tone hands, and decorative star and insect motifs paired with a ridged bezel and black strap.",
    description:
      "A textured black dial, gold-tone hands, and decorative star and insect motifs give this watch a distinctive look. The ridged gold-tone bezel and black strap complete its refined dress style.",
    specs: [
      { key: "Collection", value: "Modern Minimal" },
      { key: "Display", value: "Two-hand analog" },
      { key: "Dial", value: "Textured black dial with gold-tone decorative motifs" },
      { key: "Bezel", value: "Ridged gold-tone bezel" },
      { key: "Strap", value: "Black strap" }
    ],
    stock_quantity: 9
  },
  "22222222-2222-4222-8222-222222222212": {
    generic_name: "Sporty Tachymeter-Bezel Multi-Dial Black Strap Watch",
    brand_candidate: "Tissot",
    short_description:
      "Sporty multi-dial face, tachymeter-style bezel markings, date window, and textured black strap.",
    description:
      "A sporty multi-dial face, tachymeter-style bezel markings, and textured black strap give this watch a bold, versatile look with three sub-dials and a 4 o'clock date window.",
    specs: [
      { key: "Collection", value: "Everyday Icons" },
      { key: "Display", value: "Analog with three sub-dials and date window" },
      { key: "Bezel", value: "Tachymeter-style markings" },
      { key: "Strap", value: "Black textured strap" }
    ],
    stock_quantity: 14
  },
  "22222222-2222-4222-8222-222222222213": {
    generic_name: "Red-Accent Racing Chronograph-Style Watch",
    brand_candidate: "Ferrari",
    short_description:
      "Black watch with a dark textured dial, red dial accents, racing-style bezel markings, multiple sub-dials, a date window, and a black strap with red details.",
    description:
      "A black watch featuring a dark textured dial with red dial accents, racing-style bezel markings, multiple sub-dials, a date window, and a black strap with red details.",
    specs: [
      { key: "Collection", value: "Everyday Icons" },
      { key: "Dial", value: "Dark textured dial with red accents" },
      { key: "Display", value: "Analog with multiple sub-dials and date window" },
      { key: "Bezel", value: "Racing-style bezel markings" },
      { key: "Strap", value: "Black strap with red details" }
    ],
    stock_quantity: 12
  },
  "22222222-2222-4222-8222-222222222214": {
    generic_name: "Orange-Accent Racing Chronograph-Style Watch",
    brand_candidate: "Ferrari",
    short_description:
      "Black watch with a dark textured dial, orange dial accents, racing-style bezel markings, multiple sub-dials, a date window, and a black strap with orange details.",
    description:
      "A black watch featuring a dark textured dial with orange dial accents, racing-style bezel markings, multiple sub-dials, a date window, and a black strap with orange details.",
    specs: [
      { key: "Collection", value: "Everyday Icons" },
      { key: "Dial", value: "Dark textured dial with orange accents" },
      { key: "Display", value: "Analog with multiple sub-dials and date window" },
      { key: "Bezel", value: "Racing-style bezel markings" },
      { key: "Strap", value: "Black strap with orange details" }
    ],
    stock_quantity: 12
  },
  "22222222-2222-4222-8222-222222222215": {
    generic_name: "Charcoal Dial Blue-Accent Chronograph-Style Watch",
    brand_candidate: "Casio Edifice",
    short_description:
      "Dark-tone metal bracelet and case paired with a layered charcoal dial, blue accents, multiple sub-dials, and a date display.",
    description:
      "Paired with a dark-tone metal case and matching link bracelet, this watch features a layered charcoal dial highlighted by blue accents, multiple sub-dials, and a date display at 3 o'clock.",
    specs: [
      { key: "Collection", value: "Signature" },
      { key: "Dial", value: "Charcoal dial with blue accents" },
      { key: "Display", value: "Analog with multiple sub-dials and date display" },
      { key: "Case & Bracelet", value: "Dark-tone metal case and link bracelet" }
    ],
    stock_quantity: 8
  },
  "22222222-2222-4222-8222-222222222216": {
    generic_name: "Two-Tone Silver & Gold Chronograph-Style Watch",
    brand_candidate: "Casio Edifice",
    short_description:
      "White and silver-tone dial with warm gold-tone accents, multiple sub-dials, a date display, and a silver-and-gold-tone link bracelet.",
    description:
      "Featuring a textured white and silver-tone dial highlighted by warm gold-tone accents, multiple sub-dials, and a date display at 3 o'clock, paired with a coordinated silver-and-gold-tone metal link bracelet.",
    specs: [
      { key: "Collection", value: "Signature" },
      { key: "Dial", value: "White/silver dial with gold-tone accents" },
      { key: "Display", value: "Analog with multiple sub-dials and date display" },
      { key: "Bracelet", value: "Silver-and-gold-tone metal link bracelet" }
    ],
    stock_quantity: 9
  },
  "22222222-2222-4222-8222-222222222217": {
    generic_name: "Blue Rectangular Dial Watch",
    brand_candidate: "Tissot",
    short_description:
      "Rectangular blue dial with warm gold-tone hands and accents, framed by a dark-tone case and paired with a blue strap.",
    description:
      "Defined by a sleek rectangular blue dial with warm gold-tone hands and geometric inner-frame accents, this watch pairs a dark-tone rectangular case with a coordinated blue strap.",
    specs: [
      { key: "Collection", value: "Everyday Icons" },
      { key: "Dial", value: "Rectangular blue dial with gold-tone hands and accents" },
      { key: "Display", value: "Two-hand analog" },
      { key: "Case", value: "Dark-tone rectangular case" },
      { key: "Strap", value: "Blue strap" }
    ],
    stock_quantity: 15
  },
  "22222222-2222-4222-8222-222222222218": {
    generic_name: "White Dial Roman Numeral Gold-Tone Watch",
    brand_candidate: "Fossil",
    short_description:
      "Clean white dial with Roman numeral accents, multiple sub-dials, and a date display, paired with a warm gold-tone case and bracelet.",
    description:
      "Paired with a warm gold-tone case and matching link bracelet, this watch features a clean white dial accented with gold-tone Roman numerals, baton markers, multiple sub-dials, and a date display.",
    specs: [
      { key: "Collection", value: "Limited Editions" },
      { key: "Dial", value: "White dial with Roman numeral accents" },
      { key: "Display", value: "Analog with multiple sub-dials and date display" },
      { key: "Case & Bracelet", value: "Gold-tone case and link bracelet" }
    ],
    stock_quantity: 7
  },
  "22222222-2222-4222-8222-222222222219": {
    generic_name: "Sculpted Gold-Tone Champagne Dial Day-Date Watch",
    brand_candidate: "Rado DiaStar",
    short_description:
      "Sculpted gold-tone case and link bracelet paired with a champagne-colored dial, decorative markers, and a day-date display.",
    description:
      "Defined by a sculpted gold-tone case and matching link bracelet, this timepiece features a champagne-colored dial accented with decorative markers, a contrasting dark vertical center band, and a 6 o'clock day-date display.",
    specs: [
      { key: "Collection", value: "Automatic Classics" },
      { key: "Dial", value: "Champagne-colored dial with decorative markers" },
      { key: "Display", value: "Analog with day-date display" },
      { key: "Case & Bracelet", value: "Gold-tone case and link bracelet" }
    ],
    stock_quantity: 6
  },
  "22222222-2222-4222-8222-222222222220": {
    generic_name: "White Dial Tonneau-Style Dress Watch",
    brand_candidate: "Franck Muller",
    short_description:
      "Tonneau-shaped case with a light textured dial, oversized Arabic numerals, blue-tone hands, and a black textured strap.",
    description:
      "Shaped with a curved tonneau case, this dress watch showcases a light textured dial with oversized Arabic numerals, blue-tone hands, a 6 o'clock date window, and a black textured strap.",
    specs: [
      { key: "Collection", value: "Modern Minimal" },
      { key: "Case", value: "Tonneau-shaped case" },
      { key: "Dial", value: "Light textured dial with oversized Arabic numerals" },
      { key: "Hands", value: "Blue-tone hands" },
      { key: "Display", value: "Analog with 6 o'clock date window" },
      { key: "Strap", value: "Black textured strap" }
    ],
    stock_quantity: 8
  },
  "22222222-2222-4222-8222-222222222221": {
    generic_name: "Blue Dial Multi-Dial Watch",
    brand_candidate: "Omega De Ville",
    short_description:
      "Concentric blue dial with three sub-dials and a date window, paired with a silver-tone multi-link bracelet.",
    description:
      "Paired with a silver-tone case and multi-link bracelet, this watch features a concentric blue dial accented with baton markers, multiple sub-dials, and a date window.",
    specs: [
      { key: "Collection", value: "Signature" },
      { key: "Dial", value: "Blue dial with concentric ring detailing" },
      { key: "Display", value: "Analog with multiple sub-dials and date window" },
      { key: "Bracelet", value: "Silver-tone multi-link bracelet" }
    ],
    stock_quantity: 6
  },
  "22222222-2222-4222-8222-222222222222": {
    generic_name: "Black Dial Gold-Accent Watch",
    brand_candidate: "Fossil",
    short_description:
      "Black dial with warm gold-tone hands and markers, multiple sub-dials, and a date window, paired with a dark-tone link bracelet.",
    description:
      "Paired with a dark-tone link bracelet and matching case, this watch features a matte black dial accented with warm gold-tone hands and markers, multiple sub-dials, and an angled date window.",
    specs: [
      { key: "Collection", value: "Modern Minimal" },
      { key: "Dial", value: "Black dial with gold-tone hands and markers" },
      { key: "Display", value: "Analog with multiple sub-dials and date window" },
      { key: "Bracelet", value: "Dark-tone link bracelet" }
    ],
    stock_quantity: 11
  },
  "22222222-2222-4222-8222-222222222223": {
    generic_name: "Green Dial Fluted-Bezel Date Watch",
    brand_candidate: "Rolex",
    short_description:
      "Green dial with a fluted bezel, date window with a magnifying lens, and metal link bracelet.",
    description:
      "Designed with a rich green dial and Roman numeral markers, this watch features a classic fluted bezel, a 3 o'clock date window beneath a magnifying lens, and a multi-link metal bracelet.",
    specs: [
      { key: "Collection", value: "Modern Minimal" },
      { key: "Dial", value: "Green dial with Roman numeral markers" },
      { key: "Bezel", value: "Fluted bezel" },
      { key: "Display", value: "Analog with magnified date window" },
      { key: "Bracelet", value: "Metal link bracelet" }
    ],
    stock_quantity: 14
  },
  "22222222-2222-4222-8222-222222222224": {
    generic_name: "Black Dial Gold-Tone Watch",
    brand_candidate: "Emporio Armani",
    short_description:
      "Black dial with gold-tone hands, markers, and multiple sub-dials, paired with a gold-tone case and link bracelet.",
    description:
      "Finished with a warm gold-tone case and multi-link bracelet, this watch features a contrasting black dial accented with gold-tone hands and baton markers, multiple sub-dials, and an angled date display.",
    specs: [
      { key: "Collection", value: "Modern Minimal" },
      { key: "Dial", value: "Black dial with gold-tone hands and markers" },
      { key: "Case & Bracelet", value: "Gold-tone case and link bracelet" },
      { key: "Display", value: "Analog with multiple sub-dials and date display" }
    ],
    stock_quantity: 10
  }
};

export function formatInr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export function toAbsoluteAssetUrl(url: string, baseUrl = DEFAULT_BASE_URL): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function buildMobileCatalog(
  baseUrl = DEFAULT_BASE_URL,
  liveProducts?: ProductRecord[],
  liveCollections?: CollectionRecord[]
): {
  collections: MobileCollectionRecord[];
  products: MobileProductRecord[];
} {
  const sourceProducts = liveProducts ?? defaultProducts;
  const sourceCollections = liveCollections ?? defaultCollections;

  const validProducts = sourceProducts.filter(
    (p) =>
      p.published &&
      p.images &&
      p.images.length > 0 &&
      typeof p.price_amount === "number" &&
      p.price_amount > 0
  );

  const products: MobileProductRecord[] = validProducts.map((p: ProductRecord) => {
    const override = VERIFIED_SAFE_OVERRIDES[p.id];
    const price = p.price_amount ?? 0;
    const originalPrice =
      p.original_price_amount && p.original_price_amount > price
        ? p.original_price_amount
        : price;
    const savingsAmount = Math.max(0, originalPrice - price);
    const discountPercent =
      originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 1000) / 10
        : 0;

    const collection =
      sourceCollections.find((c) => c.id === p.collection_id) ?? sourceCollections[0]!;

    const genericName = override ? override.generic_name : p.name;
    // By default, brand_verified is false unless verified by store admin
    const brandVerified = false;
    const publicName = brandVerified && override?.brand_candidate ? p.name : genericName;
    const stockQuantity =
      typeof p.stock_count === "number"
        ? p.stock_count
        : (override?.stock_quantity ?? 10);

    return {
      id: p.id,
      slug: p.slug,
      name: publicName,
      generic_name: genericName,
      brand_candidate: override?.brand_candidate ?? null,
      brand_verified: brandVerified,
      limited_edition_verified: false,
      collection_id: collection.id,
      collection_slug: collection.slug,
      collection_name: collection.name,
      short_description: p.short_description ?? override?.short_description ?? "",
      description: p.description ?? override?.description ?? "",
      price_amount: price,
      original_price_amount: originalPrice,
      savings_amount: savingsAmount,
      discount_percent: discountPercent,
      price_currency: "INR",
      price_display: formatInr(price),
      original_price_display: formatInr(originalPrice),
      savings_display: savingsAmount > 0 ? `Save ${formatInr(savingsAmount)}` : "",
      stock_quantity: stockQuantity,
      availability_status:
        stockQuantity <= 0
          ? "out_of_stock"
          : p.availability_status === "archived"
            ? "archived"
            : "available",
      featured: p.featured,
      published: p.published,
      sort_order: p.sort_order,
      specs: p.specs?.length ? p.specs : (override?.specs ?? []),
      images: p.images.map((img) => ({
        id: img.id,
        url: toAbsoluteAssetUrl(img.url, baseUrl),
        alt_text: img.alt_text.replace(
          override?.brand_candidate ?? "__NONE__",
          genericName
        ),
        is_primary: img.is_primary,
        sort_order: img.sort_order
      })),
      created_at: p.created_at
    };
  });

  const collections: MobileCollectionRecord[] = sourceCollections
    .filter((c: CollectionRecord) => c.published)
    .map((c: CollectionRecord) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      subtitle: c.subtitle ?? "",
      description: c.description ?? "",
      cover_image_url: toAbsoluteAssetUrl(c.cover_image_url ?? "", baseUrl),
      product_count: products.filter((p) => p.collection_id === c.id).length,
      sort_order: c.sort_order
    }));

  return { collections, products };
}
