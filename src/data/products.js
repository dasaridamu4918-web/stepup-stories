/**
 * STEPUP STORIES — Editable Watch Catalog & Site Configuration
 *
 * HOW TO EDIT:
 * 1. To update watch names, descriptions, prices, or editable specifications,
 *    modify the objects inside `products` below.
 * 2. To add your own watch photos, place your image files into `/public/assets/watches/<collection-slug>/`
 *    matching the `image` and `gallery` paths below (or update the paths to match your filenames).
 * 3. While an image file is not yet added to `/public/assets/watches/...`, the website automatically
 *    displays a bespoke luxury dark-gradient placeholder with a watch silhouette and the product name.
 *    As soon as you drop the photo into the folder, the real photo will appear automatically!
 */

export const siteConfig = {
  brandName: "STEPUP STORIES",
  tagline: "Every Second Marks an Ascent",
  heroHeadline: "Timepieces Crafted for Defining Moments",
  heroIntro:
    "Explore the curated collections of STEPUP STORIES. Designed with architectural precision, understated warmth, and enduring character.",
  brandAssets: {
    logo: "/assets/brand/logo.jpg",
    logoAnimation: "/assets/brand/logo-animation.mp4"
  },
  enquiry: {
    // Replace with your live WhatsApp link, mailto: link, or form URL
    defaultLink: "#enquire-placeholder",
    email: "concierge@stepupstories.example.com",
    whatsappLabel: "Enquire via WhatsApp",
    emailLabel: "Enquire via Email",
    buyLabel: "Request Private Acquisition"
  },
  contact: {
    address: "Sample Boutique Address — Edit in src/data/products.js",
    email: "concierge@stepupstories.example.com",
    phone: "+00 000 000 0000 (Sample Contact)",
    hours: "Mon – Sat: 10:00 AM – 8:00 PM (Editable)"
  },
  socials: [
    { label: "Instagram", url: "#instagram-placeholder", handle: "@stepupstories" },
    { label: "Pinterest", url: "#pinterest-placeholder", handle: "STEPUP STORIES" },
    { label: "YouTube", url: "#youtube-placeholder", handle: "STEPUP STORIES Official" },
    { label: "WhatsApp Concierge", url: "#whatsapp-placeholder", handle: "Direct Concierge" }
  ]
};

export const collections = [
  {
    id: "signature",
    name: "Signature",
    subtitle: "The Emblem of Ascent",
    description:
      "Sample collection description — Octagonal silhouettes and signature champagne-gold accents that embody the core identity of STEPUP STORIES.",
    featuredImage: "/assets/watches/signature/signature-01-front.jpg",
    itemCountLabel: "2 Timepieces"
  },
  {
    id: "automatic-classics",
    name: "Automatic Classics",
    subtitle: "Timeless Proportions",
    description:
      "Sample collection description — Traditional horological poise balanced with deep charcoal dials and refined indices.",
    featuredImage: "/assets/watches/automatic-classics/automatic-01-front.jpg",
    itemCountLabel: "2 Timepieces"
  },
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    subtitle: "Pure Architectural Form",
    description:
      "Sample collection description — Clean dial geometry and slim profiles designed for effortless contemporary wear.",
    featuredImage: "/assets/watches/modern-minimal/minimal-01-front.jpg",
    itemCountLabel: "2 Timepieces"
  },
  {
    id: "limited-editions",
    name: "Limited Editions",
    subtitle: "Rare & Numbered",
    description:
      "Sample collection description — Exclusive releases crafted in small runs with distinctive burgundy and gold detailing.",
    featuredImage: "/assets/watches/limited-editions/limited-01-front.jpg",
    itemCountLabel: "2 Timepieces"
  },
  {
    id: "everyday-icons",
    name: "Everyday Icons",
    subtitle: "Versatile Sophistication",
    description:
      "Sample collection description — Designed to accompany every milestone from morning briefings to evening gatherings.",
    featuredImage: "/assets/watches/everyday-icons/everyday-01-front.jpg",
    itemCountLabel: "2 Timepieces"
  }
];

export const products = [
  {
    id: "signature-01",
    name: "Sample Watch Name — Signature 01",
    reference: "REF. SUS-SIG-01 (Editable)",
    collectionId: "signature",
    collectionName: "Signature",
    shortDescription: "Sample short description — Replace with your own watch introduction and styling notes.",
    description:
      "Sample full description — Edit this field in src/data/products.js to describe the design inspiration, dial texture, and presence on the wrist for Signature 01. No unverified specifications are assumed.",
    price: "Price on request",
    featured: true,
    badge: "Signature Piece",
    image: "/assets/watches/signature/signature-01-front.jpg",
    gallery: [
      {
        src: "/assets/watches/signature/signature-01-front.jpg",
        caption: "Front Dial View (Placeholder)"
      },
      {
        src: "/assets/watches/signature/signature-01-angle.jpg",
        caption: "Case Profile View (Placeholder)"
      },
      {
        src: "/assets/watches/signature/signature-01-back.jpg",
        caption: "Caseback View (Placeholder)"
      },
      {
        src: "/assets/watches/signature/signature-01-wrist.jpg",
        caption: "On-Wrist View (Placeholder)"
      }
    ],
    details: [
      { label: "Reference", value: "Editable field (e.g. SUS-SIG-01)" },
      { label: "Case Dimensions", value: "Editable specification" },
      { label: "Case Material", value: "Editable specification" },
      { label: "Dial Finish", value: "Editable specification" },
      { label: "Movement", value: "Editable specification" },
      { label: "Strap / Bracelet", value: "Editable specification" }
    ],
    enquiryUrl: "#enquire-signature-01",
    buyUrl: "#buy-signature-01"
  },
  {
    id: "signature-02",
    name: "Sample Watch Name — Signature 02",
    reference: "REF. SUS-SIG-02 (Editable)",
    collectionId: "signature",
    collectionName: "Signature",
    shortDescription: "Sample short description — Replace with your own watch introduction and styling notes.",
    description:
      "Sample full description — Edit this field in src/data/products.js to share the story and visual highlights of Signature 02.",
    price: "Price on request",
    featured: true,
    badge: "Featured",
    image: "/assets/watches/signature/signature-02-front.jpg",
    gallery: [
      {
        src: "/assets/watches/signature/signature-02-front.jpg",
        caption: "Front Dial View (Placeholder)"
      },
      {
        src: "/assets/watches/signature/signature-02-angle.jpg",
        caption: "Crown & Bezel Detail (Placeholder)"
      },
      {
        src: "/assets/watches/signature/signature-02-clasp.jpg",
        caption: "Clasp Detail (Placeholder)"
      }
    ],
    details: [
      { label: "Reference", value: "Editable field (e.g. SUS-SIG-02)" },
      { label: "Case Dimensions", value: "Editable specification" },
      { label: "Case Material", value: "Editable specification" },
      { label: "Dial Finish", value: "Editable specification" },
      { label: "Movement", value: "Editable specification" },
      { label: "Strap / Bracelet", value: "Editable specification" }
    ],
    enquiryUrl: "#enquire-signature-02",
    buyUrl: "#buy-signature-02"
  },
  {
    id: "automatic-01",
    name: "Sample Watch Name — Automatic Classic 01",
    reference: "REF. SUS-AUT-01 (Editable)",
    collectionId: "automatic-classics",
    collectionName: "Automatic Classics",
    shortDescription: "Sample short description — Replace with your own watch introduction and styling notes.",
    description:
      "Sample full description — Edit this field in src/data/products.js with your official copy for Automatic Classic 01.",
    price: "Price on request",
    featured: true,
    badge: "Classic",
    image: "/assets/watches/automatic-classics/automatic-01-front.jpg",
    gallery: [
      {
        src: "/assets/watches/automatic-classics/automatic-01-front.jpg",
        caption: "Front Dial View (Placeholder)"
      },
      {
        src: "/assets/watches/automatic-classics/automatic-01-angle.jpg",
        caption: "Three-Quarter View (Placeholder)"
      },
      {
        src: "/assets/watches/automatic-classics/automatic-01-back.jpg",
        caption: "Caseback View (Placeholder)"
      }
    ],
    details: [
      { label: "Reference", value: "Editable field (e.g. SUS-AUT-01)" },
      { label: "Case Dimensions", value: "Editable specification" },
      { label: "Case Material", value: "Editable specification" },
      { label: "Dial Finish", value: "Editable specification" },
      { label: "Movement", value: "Editable specification" },
      { label: "Strap / Bracelet", value: "Editable specification" }
    ],
    enquiryUrl: "#enquire-automatic-01",
    buyUrl: "#buy-automatic-01"
  },
  {
    id: "automatic-02",
    name: "Sample Watch Name — Automatic Classic 02",
    reference: "REF. SUS-AUT-02 (Editable)",
    collectionId: "automatic-classics",
    collectionName: "Automatic Classics",
    shortDescription: "Sample short description — Replace with your own watch introduction and styling notes.",
    description:
      "Sample full description — Edit this field in src/data/products.js with your official copy for Automatic Classic 02.",
    price: "Price on request",
    featured: false,
    badge: "Collection Piece",
    image: "/assets/watches/automatic-classics/automatic-02-front.jpg",
    gallery: [
      {
        src: "/assets/watches/automatic-classics/automatic-02-front.jpg",
        caption: "Front Dial View (Placeholder)"
      },
      {
        src: "/assets/watches/automatic-classics/automatic-02-side.jpg",
        caption: "Side Profile View (Placeholder)"
      }
    ],
    details: [
      { label: "Reference", value: "Editable field (e.g. SUS-AUT-02)" },
      { label: "Case Dimensions", value: "Editable specification" },
      { label: "Case Material", value: "Editable specification" },
      { label: "Dial Finish", value: "Editable specification" },
      { label: "Movement", value: "Editable specification" },
      { label: "Strap / Bracelet", value: "Editable specification" }
    ],
    enquiryUrl: "#enquire-automatic-02",
    buyUrl: "#buy-automatic-02"
  },
  {
    id: "minimal-01",
    name: "Sample Watch Name — Modern Minimal 01",
    reference: "REF. SUS-MIN-01 (Editable)",
    collectionId: "modern-minimal",
    collectionName: "Modern Minimal",
    shortDescription: "Sample short description — Replace with your own watch introduction and styling notes.",
    description:
      "Sample full description — Edit this field in src/data/products.js with your official copy for Modern Minimal 01.",
    price: "Price on request",
    featured: true,
    badge: "Minimalist",
    image: "/assets/watches/modern-minimal/minimal-01-front.jpg",
    gallery: [
      {
        src: "/assets/watches/modern-minimal/minimal-01-front.jpg",
        caption: "Front Dial View (Placeholder)"
      },
      {
        src: "/assets/watches/modern-minimal/minimal-01-profile.jpg",
        caption: "Slim Profile View (Placeholder)"
      },
      {
        src: "/assets/watches/modern-minimal/minimal-01-wrist.jpg",
        caption: "On-Wrist View (Placeholder)"
      }
    ],
    details: [
      { label: "Reference", value: "Editable field (e.g. SUS-MIN-01)" },
      { label: "Case Dimensions", value: "Editable specification" },
      { label: "Case Material", value: "Editable specification" },
      { label: "Dial Finish", value: "Editable specification" },
      { label: "Movement", value: "Editable specification" },
      { label: "Strap / Bracelet", value: "Editable specification" }
    ],
    enquiryUrl: "#enquire-minimal-01",
    buyUrl: "#buy-minimal-01"
  },
  {
    id: "minimal-02",
    name: "Sample Watch Name — Modern Minimal 02",
    reference: "REF. SUS-MIN-02 (Editable)",
    collectionId: "modern-minimal",
    collectionName: "Modern Minimal",
    shortDescription: "Sample short description — Replace with your own watch introduction and styling notes.",
    description:
      "Sample full description — Edit this field in src/data/products.js with your official copy for Modern Minimal 02.",
    price: "Price on request",
    featured: false,
    badge: "Collection Piece",
    image: "/assets/watches/modern-minimal/minimal-02-front.jpg",
    gallery: [
      {
        src: "/assets/watches/modern-minimal/minimal-02-front.jpg",
        caption: "Front Dial View (Placeholder)"
      },
      {
        src: "/assets/watches/modern-minimal/minimal-02-angle.jpg",
        caption: "Angle View (Placeholder)"
      }
    ],
    details: [
      { label: "Reference", value: "Editable field (e.g. SUS-MIN-02)" },
      { label: "Case Dimensions", value: "Editable specification" },
      { label: "Case Material", value: "Editable specification" },
      { label: "Dial Finish", value: "Editable specification" },
      { label: "Movement", value: "Editable specification" },
      { label: "Strap / Bracelet", value: "Editable specification" }
    ],
    enquiryUrl: "#enquire-minimal-02",
    buyUrl: "#buy-minimal-02"
  },
  {
    id: "limited-01",
    name: "Sample Watch Name — Limited Edition 01",
    reference: "REF. SUS-LIM-01 (Editable)",
    collectionId: "limited-editions",
    collectionName: "Limited Editions",
    shortDescription: "Sample short description — Replace with your own watch introduction and styling notes.",
    description:
      "Sample full description — Edit this field in src/data/products.js with your official copy for Limited Edition 01.",
    price: "Price on request",
    featured: true,
    badge: "Limited Edition",
    image: "/assets/watches/limited-editions/limited-01-front.jpg",
    gallery: [
      {
        src: "/assets/watches/limited-editions/limited-01-front.jpg",
        caption: "Front Dial View (Placeholder)"
      },
      {
        src: "/assets/watches/limited-editions/limited-01-detail.jpg",
        caption: "Dial Detail View (Placeholder)"
      },
      {
        src: "/assets/watches/limited-editions/limited-01-back.jpg",
        caption: "Numbered Caseback View (Placeholder)"
      }
    ],
    details: [
      { label: "Reference", value: "Editable field (e.g. SUS-LIM-01)" },
      { label: "Edition Quantity", value: "Editable specification" },
      { label: "Case Dimensions", value: "Editable specification" },
      { label: "Case Material", value: "Editable specification" },
      { label: "Dial Finish", value: "Editable specification" },
      { label: "Strap / Bracelet", value: "Editable specification" }
    ],
    enquiryUrl: "#enquire-limited-01",
    buyUrl: "#buy-limited-01"
  },
  {
    id: "limited-02",
    name: "Sample Watch Name — Limited Edition 02",
    reference: "REF. SUS-LIM-02 (Editable)",
    collectionId: "limited-editions",
    collectionName: "Limited Editions",
    shortDescription: "Sample short description — Replace with your own watch introduction and styling notes.",
    description:
      "Sample full description — Edit this field in src/data/products.js with your official copy for Limited Edition 02.",
    price: "Price on request",
    featured: false,
    badge: "Limited Edition",
    image: "/assets/watches/limited-editions/limited-02-front.jpg",
    gallery: [
      {
        src: "/assets/watches/limited-editions/limited-02-front.jpg",
        caption: "Front Dial View (Placeholder)"
      },
      {
        src: "/assets/watches/limited-editions/limited-02-angle.jpg",
        caption: "Angle View (Placeholder)"
      }
    ],
    details: [
      { label: "Reference", value: "Editable field (e.g. SUS-LIM-02)" },
      { label: "Edition Quantity", value: "Editable specification" },
      { label: "Case Dimensions", value: "Editable specification" },
      { label: "Case Material", value: "Editable specification" },
      { label: "Dial Finish", value: "Editable specification" },
      { label: "Strap / Bracelet", value: "Editable specification" }
    ],
    enquiryUrl: "#enquire-limited-02",
    buyUrl: "#buy-limited-02"
  },
  {
    id: "everyday-01",
    name: "Sample Watch Name — Everyday Icon 01",
    reference: "REF. SUS-EVD-01 (Editable)",
    collectionId: "everyday-icons",
    collectionName: "Everyday Icons",
    shortDescription: "Sample short description — Replace with your own watch introduction and styling notes.",
    description:
      "Sample full description — Edit this field in src/data/products.js with your official copy for Everyday Icon 01.",
    price: "Price on request",
    featured: true,
    badge: "Everyday Icon",
    image: "/assets/watches/everyday-icons/everyday-01-front.jpg",
    gallery: [
      {
        src: "/assets/watches/everyday-icons/everyday-01-front.jpg",
        caption: "Front Dial View (Placeholder)"
      },
      {
        src: "/assets/watches/everyday-icons/everyday-01-angle.jpg",
        caption: "Bracelet & Case View (Placeholder)"
      },
      {
        src: "/assets/watches/everyday-icons/everyday-01-wrist.jpg",
        caption: "On-Wrist View (Placeholder)"
      }
    ],
    details: [
      { label: "Reference", value: "Editable field (e.g. SUS-EVD-01)" },
      { label: "Case Dimensions", value: "Editable specification" },
      { label: "Case Material", value: "Editable specification" },
      { label: "Dial Finish", value: "Editable specification" },
      { label: "Movement", value: "Editable specification" },
      { label: "Strap / Bracelet", value: "Editable specification" }
    ],
    enquiryUrl: "#enquire-everyday-01",
    buyUrl: "#buy-everyday-01"
  },
  {
    id: "everyday-02",
    name: "Sample Watch Name — Everyday Icon 02",
    reference: "REF. SUS-EVD-02 (Editable)",
    collectionId: "everyday-icons",
    collectionName: "Everyday Icons",
    shortDescription: "Sample short description — Replace with your own watch introduction and styling notes.",
    description:
      "Sample full description — Edit this field in src/data/products.js with your official copy for Everyday Icon 02.",
    price: "Price on request",
    featured: false,
    badge: "Everyday Icon",
    image: "/assets/watches/everyday-icons/everyday-02-front.jpg",
    gallery: [
      {
        src: "/assets/watches/everyday-icons/everyday-02-front.jpg",
        caption: "Front Dial View (Placeholder)"
      },
      {
        src: "/assets/watches/everyday-icons/everyday-02-side.jpg",
        caption: "Side View (Placeholder)"
      }
    ],
    details: [
      { label: "Reference", value: "Editable field (e.g. SUS-EVD-02)" },
      { label: "Case Dimensions", value: "Editable specification" },
      { label: "Case Material", value: "Editable specification" },
      { label: "Dial Finish", value: "Editable specification" },
      { label: "Movement", value: "Editable specification" },
      { label: "Strap / Bracelet", value: "Editable specification" }
    ],
    enquiryUrl: "#enquire-everyday-02",
    buyUrl: "#buy-everyday-02"
  }
];
