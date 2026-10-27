-- ==========================================================================
-- STEPUP STORIES — Supabase Postgres Schema & Row Level Security (RLS)
-- Migration: 0001_initial_schema.sql
-- ==========================================================================

create extension if not exists "pgcrypto";

-- 1. ADMINS TABLE (Authorisation table: being logged in is NOT enough)
create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  email text unique not null,
  role text not null default 'admin' check (role in ('admin', 'superadmin')),
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Helper function to check if the current authenticated user is an active admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.admins a
    where (a.user_id = auth.uid())
       or (lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  );
$$;

create policy "Admins can view admins table"
  on public.admins for select
  using (public.is_admin());

create policy "Superadmins can manage admins table"
  on public.admins for all
  using (public.is_admin())
  with check (public.is_admin());

-- 2. COLLECTIONS TABLE
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  subtitle text,
  description text,
  cover_image_url text,
  cover_image_alt text,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.collections enable row level security;

create policy "Public can read published collections"
  on public.collections for select
  using (published = true or public.is_admin());

create policy "Admins have full access to collections"
  on public.collections for all
  using (public.is_admin())
  with check (public.is_admin());

-- 3. PRODUCTS TABLE
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  reference_code text,
  collection_id uuid references public.collections(id) on delete set null,
  short_description text,
  description text,
  price_amount numeric(12, 2),
  original_price_amount numeric(12, 2),
  discount_percent numeric(5, 2),
  savings_label text,
  price_currency text default 'INR',
  price_display text,
  availability_status text not null default 'available'
    check (availability_status in ('available', 'private_viewing_only', 'waitlist', 'archived')),
  featured boolean not null default false,
  published boolean not null default false,
  sort_order integer not null default 0,
  specs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_collection_id on public.products(collection_id);
create index if not exists idx_products_published_featured on public.products(published, featured, sort_order);

alter table public.products enable row level security;

create policy "Public can read published products"
  on public.products for select
  using (published = true or public.is_admin());

create policy "Admins have full access to products"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

-- 4. PRODUCT IMAGES TABLE
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text,
  url text not null,
  alt_text text not null default '',
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  width integer,
  height integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_images_product_id on public.product_images(product_id, sort_order);

alter table public.product_images enable row level security;

create policy "Public can read images of published products"
  on public.product_images for select
  using (
    public.is_admin() or exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.published = true
    )
  );

create policy "Admins have full access to product_images"
  on public.product_images for all
  using (public.is_admin())
  with check (public.is_admin());

-- 5. PRODUCT SPECS TABLE (Structured relational table complementing products.specs JSONB)
create table if not exists public.product_specs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  spec_key text not null,
  spec_value text not null,
  sort_order integer not null default 0
);

create index if not exists idx_product_specs_product_id on public.product_specs(product_id, sort_order);

alter table public.product_specs enable row level security;

create policy "Public can read specs of published products"
  on public.product_specs for select
  using (
    public.is_admin() or exists (
      select 1 from public.products p
      where p.id = product_specs.product_id and p.published = true
    )
  );

create policy "Admins have full access to product_specs"
  on public.product_specs for all
  using (public.is_admin())
  with check (public.is_admin());

-- 6. ENQUIRIES TABLE (Public cannot read; inserts only via service-role server routes; admins can read/update)
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  enquiry_type text not null default 'product_enquiry'
    check (enquiry_type in ('product_enquiry', 'private_viewing', 'general_concierge')),
  product_id uuid references public.products(id) on delete set null,
  product_name text,
  full_name text not null,
  email text not null,
  phone text,
  preferred_contact text,
  preferred_date text,
  preferred_location text,
  message text not null,
  status text not null default 'new'
    check (status in ('new', 'in_progress', 'closed')),
  internal_notes text not null default '',
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_enquiries_status_created on public.enquiries(status, created_at desc);

alter table public.enquiries enable row level security;

create policy "Only admins can read enquiries"
  on public.enquiries for select
  using (public.is_admin());

create policy "Only admins can update or delete enquiries"
  on public.enquiries for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Only admins can delete enquiries"
  on public.enquiries for delete
  using (public.is_admin());

-- 7. NEWSLETTER SUBSCRIBERS TABLE (Public cannot read; inserts via service-role server route)
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  status text not null default 'active'
    check (status in ('active', 'unsubscribed')),
  consent_timestamp timestamptz not null default now(),
  unsubscribed_at timestamptz,
  unsubscribe_token uuid not null default gen_random_uuid(),
  source text default 'website',
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

create policy "Only admins can read newsletter subscribers"
  on public.newsletter_subscribers for select
  using (public.is_admin());

create policy "Only admins can update newsletter subscribers"
  on public.newsletter_subscribers for update
  using (public.is_admin())
  with check (public.is_admin());

-- 8. SITE SETTINGS TABLE (Single-row or key-based business & replaceable image slot settings)
create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  business_name text not null default 'STEPUP STORIES',
  tagline text,
  hero_headline text,
  hero_subheadline text,
  hero_backdrop_url text,
  story_backdrop_url text,
  og_image_url text,
  about_story_title text,
  about_story_body text,
  contact_email text,
  contact_phone text,
  address text,
  opening_hours text,
  private_viewing_details text,
  footer_text text,
  social_links jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

create policy "Public can read site settings"
  on public.site_settings for select
  using (true);

create policy "Only admins can update site settings"
  on public.site_settings for all
  using (public.is_admin())
  with check (public.is_admin());

-- 9. SUPABASE STORAGE BUCKET & RLS POLICIES FOR PRODUCT IMAGES
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  8388608, -- 8 MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

create policy "Public can view product images in storage"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Only admins can upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "Only admins can update product images"
  on storage.objects for update
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "Only admins can delete product images"
  on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());
