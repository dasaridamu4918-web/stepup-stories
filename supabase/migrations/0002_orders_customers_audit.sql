-- ==========================================================================
-- STEPUP STORIES — Orders, Stock Counts & Admin Audit Trail with RLS
-- Migration: 0002_orders_customers_audit.sql
-- ==========================================================================

-- 1. Add stock_count column to public.products for synchronized inventory
alter table public.products
  add column if not exists stock_count integer not null default 10 check (stock_count >= 0);

-- 2. STORE ORDERS TABLE (Deny-by-default RLS: customers can only view their own orders;
--    only approved admins in public.admins can list all orders or update order status)
create table if not exists public.store_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  delivery_address jsonb not null,
  items jsonb not null default '[]'::jsonb,
  item_subtotal numeric(12, 2) not null default 0 check (item_subtotal >= 0),
  discount_total numeric(12, 2) not null default 0 check (discount_total >= 0),
  delivery_fee numeric(12, 2) not null default 0 check (delivery_fee >= 0),
  final_total numeric(12, 2) not null default 0 check (final_total >= 0),
  currency text not null default 'INR',
  payment_method text not null default 'cod'
    check (payment_method in ('cod', 'razorpay')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  -- Safe payment provider reference only (e.g. Razorpay order_id / payment_id).
  -- Never store card numbers, CVVs, or payment secrets.
  payment_reference text,
  order_status text not null default 'new'
    check (order_status in (
      'new',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refund_requested'
    )),
  courier_name text,
  tracking_number text,
  status_history jsonb not null default '[]'::jsonb,
  source text not null default 'website'
    check (source in ('website', 'mobile_app')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_store_orders_created_at on public.store_orders(created_at desc);
create index if not exists idx_store_orders_status on public.store_orders(order_status, payment_status);
create index if not exists idx_store_orders_customer_email on public.store_orders(lower(customer_email));
create index if not exists idx_store_orders_order_number on public.store_orders(order_number);

alter table public.store_orders enable row level security;

-- Authenticated customers can read only their own orders
create policy "Customers can view own orders"
  on public.store_orders for select
  using (
    public.is_admin()
    or (auth.uid() is not null and user_id = auth.uid())
  );

-- Only approved admins can update or delete orders (customers cannot modify status or payment_status)
create policy "Only admins can update orders"
  on public.store_orders for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Only admins can delete orders"
  on public.store_orders for delete
  using (public.is_admin());

-- 3. ADMIN AUDIT LOGS TABLE (Immutable record of sensitive admin actions)
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  action_type text not null,
  actor_email text not null,
  target_type text not null,
  target_id text not null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_audit_logs_created_at on public.admin_audit_logs(created_at desc);

alter table public.admin_audit_logs enable row level security;

create policy "Only admins can read audit logs"
  on public.admin_audit_logs for select
  using (public.is_admin());

create policy "Only admins can insert audit logs"
  on public.admin_audit_logs for insert
  with check (public.is_admin());
