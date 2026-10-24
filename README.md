# STEPUP STORIES — Luxury Timepiece Collection Website

A dark-themed, responsive luxury watch showcase built with **Vite + Vanilla HTML, CSS Variables, and ES Modules** for **STEPUP STORIES**.

---

## Quick Start

```bash
npm install
npm run dev
```

To build for production:

```bash
npm run build
npm run preview
```

---

## Project Folder Structure

```text
stepup-stories/
├── index.html                  # Semantic HTML layout & sections
├── public/
│   └── assets/
│       ├── brand/
│       │   ├── logo.jpg            # Supplied official logo (untouched)
│       │   └── logo-animation.mp4  # Supplied official logo animation (untouched)
│       └── watches/                # Drop your watch photos into these folders:
│           ├── signature/
│           ├── automatic-classics/
│           ├── modern-minimal/
│           ├── limited-editions/
│           └── everyday-icons/
└── src/
    ├── main.js                 # Carousels, search, filters, modal & reduced-motion logic
    ├── data/
    │   └── products.js         # Single source of truth for watches, collections & links
    └── styles/
        └── main.css            # CSS variables (palette, fonts, spacing) & responsive styles
```

---

## How to Swap in Your Watch Photos

1. Open `public/assets/watches/` and place your product photos inside the matching collection subfolder:
   - `public/assets/watches/signature/signature-01-front.jpg`
   - `public/assets/watches/automatic-classics/automatic-01-front.jpg`
   - `public/assets/watches/modern-minimal/minimal-01-front.jpg`
   - `public/assets/watches/limited-editions/limited-01-front.jpg`
   - `public/assets/watches/everyday-icons/everyday-01-front.jpg`
2. **Automatic Fallback & Swap:** While a photo file is not yet present on disk, the site automatically renders a dark-gradient luxury placeholder with an octagonal watch silhouette and the expected file path. As soon as you drop a matching `.jpg` / `.png` / `.webp` file into the folder (or update the path in `src/data/products.js`), the real photo automatically displays in place of the placeholder.

---

## How to Edit Product Data, Specifications & Links

All watch names, descriptions, prices, collection metadata, gallery views, editable specification rows, and contact/social links live in one file:

- **`src/data/products.js`**

### Editing a Watch Entry
```js
{
  id: "signature-01",
  name: "Your Official Watch Name",
  reference: "REF. SUS-SIG-01",
  collectionId: "signature",
  collectionName: "Signature",
  shortDescription: "Short summary shown on the product card.",
  description: "Full narrative shown inside the product detail modal.",
  price: "Price on request", // Or your formatted price
  featured: true,            // true = appears in Featured Timepieces carousel
  badge: "Signature Piece",
  image: "/assets/watches/signature/signature-01-front.jpg",
  gallery: [
    { src: "/assets/watches/signature/signature-01-front.jpg", caption: "Front Dial View" },
    { src: "/assets/watches/signature/signature-01-angle.jpg", caption: "Case Profile View" }
  ],
  details: [
    { label: "Reference", value: "SUS-SIG-01" },
    { label: "Case Dimensions", value: "Your specification" }
  ],
  enquiryUrl: "https://wa.me/YOUR_NUMBER?text=I%20would%20like%20to%20enquire%20about%20Signature%2001",
  buyUrl: "mailto:concierge@yourdomain.com?subject=Acquisition%20Request"
}
```

### Customizing Colours, Fonts & Spacing
Open **`src/styles/main.css`** and edit the `:root` CSS variables at the top of the file:
- `--bg-obsidian`, `--bg-charcoal`, `--bg-surface` (near-black and charcoal surfaces)
- `--gold-champagne`, `--gold-bright`, `--gold-muted` (champagne-gold accents inspired by the logo)
- `--burgundy-accent`, `--burgundy-highlight` (restrained burgundy accents)
- `--font-serif`, `--font-sans` (heading and body font stacks)

---

## Scroll-Controlled 240-Frame Sequence Story Configuration

The interactive scroll-scrubbed timepiece sequence (placed immediately after the Hero and before the Collections) is configured in a single file:

- **`src/data/storySequenceConfig.js`**

From that file you can edit:
- `frameCount`: Total frames (`240`)
- `desktopPathPattern`: `./assets/story/frames/frame-{index}.webp` (`720x1280` WebP)
- `mobilePathPattern`: `./assets/story/frames-mobile/frame-{index}.webp` (`540x960` WebP, `4.24 MB` total)
- `scrollLengthDesktop` (`"360vh"`) and `scrollLengthMobile` (`"260vh"`)
- `reducedMotionFrame` (`120` — static exploded-view frame displayed when `prefers-reduced-motion: reduce` is enabled)
- `captions`: Array of chapter cards with `startFrame`, `endFrame`, `eyebrow`, `title`, and `body`.
