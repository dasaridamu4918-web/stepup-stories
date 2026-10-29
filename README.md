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
- Every Razorpay order is created on the server (`/api/payments/razorpay/create-order`) using the product price and order total calculated from the trusted backend catalog—amounts sent only by the browser are **never** trusted.
- Orders are **never** marked as `paid` until the server verifies the Razorpay HMAC-SHA256 payment signature (`/api/payments/razorpay/verify`) or verifies the raw-body Razorpay webhook signature (`/api/payments/razorpay/webhook`). A browser success screen by itself is never treated as proof of payment.
- Sensitive admin actions (order status updates, refunds, CSV order exports, and product price/stock edits) are recorded in `admin_audit_logs`.

---

## Razorpay Online Payments Setup (Test Mode, Webhooks & Live Mode)

The integration defaults to **Test Mode** until you configure approved Live Mode credentials in Vercel.

### 1. Vercel Server Environment Variables
In your Vercel project dashboard (**Settings -> Environment Variables**), configure the following three **server-only** environment variables (for `Production`, `Preview`, and `Development` as needed):

| Variable Name | Description | Example (Test Mode) |
| :--- | :--- | :--- |
| `RAZORPAY_KEY_ID` | Your Razorpay Key ID (starts with `rzp_test_` in Test Mode or `rzp_live_` in Live Mode). Returned by the server only when initializing checkout. | `rzp_test_xxxxxxxxxxxxxx` |
| `RAZORPAY_KEY_SECRET` | **Server-only** Key Secret used to create orders on the server and verify HMAC-SHA256 payment signatures. **Never** expose to the browser, mobile app, repository, or logs. | *(From Razorpay Dashboard)* |
| `RAZORPAY_WEBHOOK_SECRET` | **Server-only** Webhook Secret used to verify the `x-razorpay-signature` header against the raw request body on `/api/razorpay/webhook`. | *(From Razorpay Webhooks)* |

### 2. Setting Up the Razorpay Test Webhook
1. Sign in to the [Razorpay Dashboard](https://dashboard.razorpay.com/) and switch the top banner to **Test Mode**.
2. Go to **Account & Settings -> Webhooks** and click **+ Add New Webhook**.
3. Enter the **Webhook URL**:
   ```text
   https://stepup-stories.vercel.app/api/razorpay/webhook
   ```
4. Enter a strong **Secret** (for example, a 32-character random string) and save that exact value as `RAZORPAY_WEBHOOK_SECRET` in Vercel Environment Variables.
5. Under **Active Events**, select:
   - `payment.captured`
   - `order.paid`
   - `payment.failed`
   - `refund.processed`
   - `refund.created`
6. Click **Create Webhook**. Duplicate webhook deliveries and out-of-order events are handled safely using `x-razorpay-event-id` and order payment state checks.

### 3. Setting Up the Razorpay Live Webhook & Switching to Live Mode
When your Razorpay account KYC is approved and you are ready to accept real INR payments:
1. In the [Razorpay Dashboard](https://dashboard.razorpay.com/), switch from **Test Mode** to **Live Mode**.
2. Go to **Account & Settings -> API Keys** and generate your **Live Mode** key pair (`RAZORPAY_KEY_ID` starting with `rzp_live_` and `RAZORPAY_KEY_SECRET`).
3. Go to **Account & Settings -> Webhooks** (while in **Live Mode**) and click **+ Add New Webhook**:
   - **Webhook URL:** `https://stepup-stories.vercel.app/api/razorpay/webhook`
   - **Secret:** Set a strong Live Webhook secret.
   - **Active Events:** `payment.captured`, `order.paid`, `payment.failed`, `refund.processed`, `refund.created`.
4. In your **Vercel Dashboard -> Settings -> Environment Variables** (for the **Production** environment), update:
   - `RAZORPAY_KEY_ID` = your `rzp_live_...` Key ID
   - `RAZORPAY_KEY_SECRET` = your Live Key Secret
   - `RAZORPAY_WEBHOOK_SECRET` = your Live Webhook Secret
5. Redeploy your Production deployment on Vercel (**Deployments -> Redeploy**). The checkout badge will automatically switch from `TEST MODE` to `LIVE MODE`.

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
