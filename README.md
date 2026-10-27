# STEPUP STORIES — Full-Stack Luxury Timepiece Website (Next.js + TypeScript + Supabase)

A mobile-first, enquiry-only luxury horology website and Maison Admin Portal built for **STEPUP STORIES**.

---

## Stack & Architecture

- **Framework:** Next.js 14 (App Router) + React 18 + TypeScript (`strict: true`)
- **Styling & Design Tokens:** Tailwind CSS + CSS Custom Properties (`src/app/globals.css`) with WCAG AA contrast (`#07090B` obsidian base, `#D4B475` champagne gold, `#F6F3EC` cream, `#8F1D35` burgundy accent) and `next/font` (`Cormorant Garamond` + `Plus Jakarta Sans`)
- **Database, Auth & Storage:** Supabase (`Postgres`, `Auth`, `Storage`) with Row Level Security (`supabase/migrations/0001_initial_schema.sql`)
- **Validation & Forms:** Shared client/server `Zod` schemas (`src/lib/validations.ts`) + `React Hook Form`
- **Spam Protection & Security:** Server-side Cloudflare Turnstile verification, honeypot field, sliding-window IP rate limiting (`src/lib/rate-limit.ts`), input sanitization, and strict CSP/security headers (`next.config.mjs`)
- **Server-Side Email Notifications:** Resend API (`src/lib/email.ts`)
- **Preserved Brand Assets & Motion:** Untouched official logo (`/public/assets/brand/logo.jpg`), muted lazy-loaded hero animation (`/public/assets/brand/logo-animation.mp4`), and the 240-frame scroll-controlled timepiece sequence (`/public/assets/story/frames/` and `frames-mobile/`)

---

## Local Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Configure environment variables:**
   Copy `.env.example` to `.env.local` and fill in your credentials:
   ```bash
   cp .env.example .env.local
   ```
3. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`.

---

## Supabase Setup & Database Migrations

1. Create a new project at [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Open the **SQL Editor** in your Supabase dashboard, paste the contents of **`supabase/migrations/0001_initial_schema.sql`**, and click **Run**.
   - This creates all 8 tables (`admins`, `collections`, `products`, `product_images`, `product_specs`, `enquiries`, `newsletter_subscribers`, `site_settings`), enables Row Level Security (RLS) on every table, and creates the public-read/admin-write `product-images` Storage bucket.
3. Copy your project's **Project URL**, **anon public key**, and **service_role secret key** from **Project Settings -> API** into `.env.local`.

---

## Creating the First Admin Account

Being authenticated in Supabase Auth alone does **not** grant access to `/admin`—every request and middleware check verifies that the user's ID or email exists in `public.admins`.

To seed your first superadmin account and the 5 STEPUP STORIES collections:

1. Set `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `INITIAL_ADMIN_EMAIL`, and `INITIAL_ADMIN_PASSWORD` in `.env.local`.
2. Run:
   ```bash
   npm run seed:admin
   ```
3. Sign in at `http://localhost:3000/admin/login` (or `https://stepup-stories.vercel.app/admin/login`).

---

## Testing, Type-Checking & Production Build

```bash
npm run typecheck   # Strict TypeScript check (tsc --noEmit)
npm run lint        # Next.js ESLint check
npm run test        # Vitest unit & API route tests
npm run build       # Production Next.js build
```

---

## Deploying to Vercel

1. Push the repository to GitHub (`main` branch).
2. In your Vercel project dashboard (**Settings -> Environment Variables**), add all variables listed in `.env.example`.
3. Trigger a deployment—Vercel automatically detects Next.js and deploys all App Router pages and serverless API routes.
