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
2. Open the **SQL Editor** in your Supabase dashboard and run both migrations in order:
   - **`supabase/migrations/0001_initial_schema.sql`** — Creates `admins`, `collections`, `products`, `product_images`, `product_specs`, `enquiries`, `newsletter_subscribers`, `site_settings`, and the `product-images` Storage bucket with deny-by-default Row Level Security (RLS).
   - **`supabase/migrations/0002_orders_customers_audit.sql`** — Adds `stock_count` to `products`, creates `store_orders` and `admin_audit_logs`, and applies strict RLS policies (customers cannot read other customers' orders or grant themselves admin privileges; `admin_audit_logs` is append-only and readable only by approved admins).
3. Copy your project's **Project URL**, **anon public key**, and **service_role secret key** from **Project Settings -> API** into `.env.local`.

---

## Connected Admin Dashboard & Security Setup

The Admin Dashboard (`/admin`) is connected directly to both the **STEPUP STORIES website** and the **Android/iOS mobile app** (`mobile/`).

### 1. Admin Sign-In & Role-Based Access Control
- Customers can **never** create or grant themselves an admin role.
- Server API routes (`/api/admin/catalog`, `/api/admin/session`, `/api/mobile/orders`) verify every request against:
  1. Supabase Auth session + membership in the `public.admins` table (or `app_metadata.role` in `('admin', 'superadmin')`), or
  2. Server-only environment credentials (`INITIAL_ADMIN_EMAIL`, `APPROVED_ADMIN_EMAILS`, `INITIAL_ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET`).
- In Firebase/Firestore mode (`mobile/firestore.rules`), deny-by-default rules (`match /{document=**} { allow read, write: if false; }`) ensure only accounts with custom claim `admin == true` or a server-managed `admins/{uid}` document can read all orders, customers, or audit logs.

### 2. Order Alerts & Customer Notifications
- Approved admins receive live in-dashboard alerts when a new order arrives.
- External email or push alerts are sent **only** when the corresponding server environment variables are configured in `.env.local`:
  - `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `ADMIN_ALERT_EMAIL` (or `CONCIERGE_NOTIFICATION_EMAIL`)
  - `ADMIN_PUSH_WEBHOOK_URL` (optional admin push webhook)
  - `CUSTOMER_NOTIFICATION_WEBHOOK_URL` (optional SMS/push webhook for customer order stage updates)

### 3. Payments, Privacy & Audit Trail
- Full card numbers, CVVs, and payment secrets are **never** stored or displayed.
- Orders are **never** marked as `paid` until the payment provider confirms the transaction (`/api/mobile/payments/razorpay/verify`) or an approved admin records a verified payment reference.
- Sensitive admin actions (order status updates, refunds, CSV order exports, and product price/stock edits) are recorded in `admin_audit_logs`.

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
