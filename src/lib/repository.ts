import crypto from "crypto";
import type {
  AdminAuditActionType,
  AdminAuditLogRecord,
  CollectionRecord,
  CustomerSummaryRecord,
  EnquiryRecord,
  NewsletterSubscriberRecord,
  OrderPaymentStatus,
  OrderStatusStage,
  ProductImageRecord,
  ProductRecord,
  SiteSettingsRecord,
  StoreOrderItem,
  StoreOrderRecord
} from "@/types/database";
import {
  defaultCollections,
  defaultProducts,
  defaultSiteSettings
} from "@/lib/default-data";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
  isServiceRoleConfigured,
  isSupabaseConfigured
} from "@/lib/supabase/server";
import {
  sendNewOrderAdminAlert,
  sendOrderStatusCustomerNotification
} from "@/lib/email";
import type { CreateStoreOrderInput } from "@/lib/validations";

interface LocalMemoryStore {
  settings: SiteSettingsRecord;
  collections: CollectionRecord[];
  products: ProductRecord[];
  enquiries: EnquiryRecord[];
  subscribers: NewsletterSubscriberRecord[];
  orders: StoreOrderRecord[];
  auditLogs: AdminAuditLogRecord[];
  processedWebhookEventIds: string[];
}

const globalForStore = globalThis as unknown as {
  __stepupMemoryStore?: LocalMemoryStore;
};

function getMemoryStore(): LocalMemoryStore {
  if (!globalForStore.__stepupMemoryStore) {
    const initializedProducts = structuredClone(defaultProducts).map((p) => ({
      ...p,
      stock_count: typeof p.stock_count === "number" ? p.stock_count : 10
    }));
    globalForStore.__stepupMemoryStore = {
      settings: structuredClone(defaultSiteSettings),
      collections: structuredClone(defaultCollections),
      products: initializedProducts,
      enquiries: [],
      subscribers: [],
      orders: [],
      auditLogs: [],
      processedWebhookEventIds: []
    };
  }
  return globalForStore.__stepupMemoryStore;
}

export async function recordAdminAuditLog(input: {
  action_type: AdminAuditActionType;
  actor_email: string;
  target_type: AdminAuditLogRecord["target_type"];
  target_id: string;
  summary: string;
  metadata?: Record<string, unknown>;
}): Promise<AdminAuditLogRecord> {
  const entry: AdminAuditLogRecord = {
    id: crypto.randomUUID(),
    action_type: input.action_type,
    actor_email: input.actor_email,
    target_type: input.target_type,
    target_id: input.target_id,
    summary: input.summary,
    metadata: input.metadata ?? {},
    created_at: new Date().toISOString()
  };

  if (isServiceRoleConfigured()) {
    const service = createSupabaseServiceClient();
    if (service) {
      await service.from("admin_audit_logs").insert({
        id: entry.id,
        action_type: entry.action_type,
        actor_email: entry.actor_email,
        target_type: entry.target_type,
        target_id: entry.target_id,
        summary: entry.summary,
        metadata: entry.metadata,
        created_at: entry.created_at
      });
    }
  }

  getMemoryStore().auditLogs.unshift(entry);
  return entry;
}

export async function getSiteSettings(): Promise<SiteSettingsRecord> {
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (!error && data) {
        return {
          ...defaultSiteSettings,
          ...(data as Partial<SiteSettingsRecord>),
          social_links: Array.isArray(data.social_links) ? data.social_links : []
        };
      }
    }
  }
  return getMemoryStore().settings;
}

export async function getPublishedCollections(): Promise<CollectionRecord[]> {
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("published", true)
        .order("sort_order", { ascending: true });

      if (!error && data && data.length > 0) {
        return data as CollectionRecord[];
      }
    }
  }
  return getMemoryStore()
    .collections.filter((c) => c.published)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export async function getCollectionBySlug(slug: string): Promise<CollectionRecord | null> {
  const collections = await getPublishedCollections();
  return collections.find((c) => c.slug === slug) ?? null;
}

function normalizeProductRow(
  row: Record<string, unknown>,
  collectionsMap: Map<string, CollectionRecord>
): ProductRecord {
  const rawSpecs = Array.isArray(row.specs) ? row.specs : [];
  const specs = rawSpecs
    .map((s: unknown) => {
      if (s && typeof s === "object" && "key" in s && "value" in s) {
        return {
          key: String((s as { key: unknown }).key).trim(),
          value: String((s as { value: unknown }).value).trim()
        };
      }
      return null;
    })
    .filter((s): s is { key: string; value: string } => Boolean(s && s.key && s.value));

  const rawImages = Array.isArray(row.product_images)
    ? row.product_images
    : Array.isArray(row.images)
      ? row.images
      : [];

  const images = (rawImages as ProductImageRecord[]).sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  const collectionId = typeof row.collection_id === "string" ? row.collection_id : null;

  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    reference_code: row.reference_code ? String(row.reference_code) : null,
    collection_id: collectionId,
    collection: collectionId ? (collectionsMap.get(collectionId) ?? null) : null,
    short_description: row.short_description ? String(row.short_description) : null,
    description: row.description ? String(row.description) : null,
    price_amount:
      typeof row.price_amount === "number"
        ? row.price_amount
        : row.price_amount
          ? Number(row.price_amount)
          : null,
    original_price_amount:
      typeof row.original_price_amount === "number"
        ? row.original_price_amount
        : row.original_price_amount
          ? Number(row.original_price_amount)
          : null,
    discount_percent:
      typeof row.discount_percent === "number"
        ? row.discount_percent
        : row.discount_percent
          ? Number(row.discount_percent)
          : null,
    savings_label: row.savings_label ? String(row.savings_label) : null,
    price_currency: row.price_currency ? String(row.price_currency) : null,
    price_display: row.price_display ? String(row.price_display) : null,
    availability_status:
      (row.availability_status as ProductRecord["availability_status"]) ?? "available",
    stock_count:
      typeof row.stock_count === "number"
        ? row.stock_count
        : row.stock_count !== undefined && row.stock_count !== null
          ? Number(row.stock_count)
          : 10,
    featured: Boolean(row.featured),
    published: Boolean(row.published),
    sort_order: typeof row.sort_order === "number" ? row.sort_order : 0,
    specs,
    images,
    created_at: row.created_at ? String(row.created_at) : new Date().toISOString()
  };
}

export async function getPublishedProducts(): Promise<ProductRecord[]> {
  const collections = await getPublishedCollections();
  const collectionsMap = new Map(collections.map((c) => [c.id, c]));

  if (isSupabaseConfigured()) {
    const supabase = createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_images(*)")
        .eq("published", true)
        .neq("availability_status", "archived")
        .order("sort_order", { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((row) =>
          normalizeProductRow(row as Record<string, unknown>, collectionsMap)
        );
      }
    }
  }

  return getMemoryStore()
    .products.filter((p) => p.published && p.availability_status !== "archived")
    .map((p) => ({
      ...p,
      stock_count: typeof p.stock_count === "number" ? p.stock_count : 10,
      collection: p.collection_id ? (collectionsMap.get(p.collection_id) ?? null) : null
    }))
    .sort((a, b) => a.sort_order - b.sort_order);
}

export async function getFeaturedProducts(): Promise<ProductRecord[]> {
  const all = await getPublishedProducts();
  return all.filter((p) => p.featured);
}

export async function getProductBySlug(slug: string): Promise<ProductRecord | null> {
  const all = await getPublishedProducts();
  return all.find((p) => p.slug === slug) ?? null;
}

// ============================================================================
// SERVER-ONLY WRITE OPERATIONS FOR PUBLIC FORMS & ORDERS
// ============================================================================

export async function createEnquiryRecord(
  input: Omit<
    EnquiryRecord,
    "id" | "status" | "internal_notes" | "created_at" | "updated_at"
  > & { ip_hash?: string }
): Promise<EnquiryRecord> {
  if (isServiceRoleConfigured()) {
    const service = createSupabaseServiceClient();
    if (service) {
      const { data, error } = await service
        .from("enquiries")
        .insert({
          enquiry_type: input.enquiry_type,
          product_id: input.product_id || null,
          product_name: input.product_name || null,
          full_name: input.full_name,
          email: input.email,
          phone: input.phone || null,
          preferred_contact: input.preferred_contact || "email",
          preferred_date: input.preferred_date || null,
          preferred_location: input.preferred_location || null,
          message: input.message,
          ip_hash: input.ip_hash || null
        })
        .select("*")
        .single();

      if (!error && data) {
        return data as EnquiryRecord;
      }
    }
  }

  const now = new Date().toISOString();
  const record: EnquiryRecord = {
    id: crypto.randomUUID(),
    enquiry_type: input.enquiry_type,
    product_id: input.product_id || null,
    product_name: input.product_name || null,
    full_name: input.full_name,
    email: input.email,
    phone: input.phone || null,
    preferred_contact: input.preferred_contact || "email",
    preferred_date: input.preferred_date || null,
    preferred_location: input.preferred_location || null,
    message: input.message,
    status: "new",
    internal_notes: "",
    created_at: now,
    updated_at: now
  };

  getMemoryStore().enquiries.unshift(record);
  return record;
}

export async function upsertNewsletterSubscriber(input: {
  email: string;
  full_name?: string;
  source?: string;
}): Promise<{ subscriber: NewsletterSubscriberRecord; alreadySubscribed: boolean }> {
  const normalizedEmail = input.email.trim().toLowerCase();

  if (isServiceRoleConfigured()) {
    const service = createSupabaseServiceClient();
    if (service) {
      const { data: existing } = await service
        .from("newsletter_subscribers")
        .select("*")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (existing && existing.status === "active") {
        return {
          subscriber: existing as NewsletterSubscriberRecord,
          alreadySubscribed: true
        };
      }

      const now = new Date().toISOString();
      const { data, error } = await service
        .from("newsletter_subscribers")
        .upsert(
          {
            email: normalizedEmail,
            full_name: input.full_name || null,
            status: "active",
            consent_timestamp: now,
            unsubscribed_at: null,
            source: input.source || "website"
          },
          { onConflict: "email" }
        )
        .select("*")
        .single();

      if (!error && data) {
        return {
          subscriber: data as NewsletterSubscriberRecord,
          alreadySubscribed: false
        };
      }
    }
  }

  const store = getMemoryStore();
  const existing = store.subscribers.find((s) => s.email === normalizedEmail);
  if (existing && existing.status === "active") {
    return { subscriber: existing, alreadySubscribed: true };
  }

  const now = new Date().toISOString();
  if (existing) {
    existing.status = "active";
    existing.consent_timestamp = now;
    existing.unsubscribed_at = null;
    if (input.full_name) existing.full_name = input.full_name;
    return { subscriber: existing, alreadySubscribed: false };
  }

  const created: NewsletterSubscriberRecord = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    full_name: input.full_name || null,
    status: "active",
    consent_timestamp: now,
    unsubscribed_at: null,
    unsubscribe_token: crypto.randomUUID(),
    source: input.source || "website",
    created_at: now
  };
  store.subscribers.unshift(created);
  return { subscriber: created, alreadySubscribed: false };
}

export async function unsubscribeByToken(token: string): Promise<boolean> {
  if (isServiceRoleConfigured()) {
    const service = createSupabaseServiceClient();
    if (service) {
      const { data, error } = await service
        .from("newsletter_subscribers")
        .update({
          status: "unsubscribed",
          unsubscribed_at: new Date().toISOString()
        })
        .eq("unsubscribe_token", token)
        .select("id")
        .maybeSingle();

      if (!error && data) return true;
    }
  }

  const store = getMemoryStore();
  const sub = store.subscribers.find((s) => s.unsubscribe_token === token);
  if (!sub) return false;
  sub.status = "unsubscribed";
  sub.unsubscribed_at = new Date().toISOString();
  return true;
}

/**
 * Resolves and calculates order items and totals strictly from the trusted server-side
 * catalog (`getPublishedProducts()` + in-memory admin catalog).
 * Never trusts unit prices or totals sent by the browser.
 */
export async function calculateTrustedOrderPricing(params: {
  items: {
    product_id: string;
    slug: string;
    name?: string;
    collection_name?: string | null;
    selected_options?: string | null;
    quantity: number;
    image_url?: string | null;
  }[];
  delivery_fee?: number;
  decrementStock?: boolean;
}): Promise<{
  normalizedItems: StoreOrderItem[];
  itemSubtotal: number;
  netItemsTotal: number;
  discountTotal: number;
  deliveryFee: number;
  finalTotal: number;
}> {
  const store = getMemoryStore();
  const publishedProducts = await getPublishedProducts();

  const normalizedItems: StoreOrderItem[] = params.items.map((item) => {
    const matchedPublished = publishedProducts.find(
      (p) => p.id === item.product_id || p.slug === item.slug
    );
    const matchedMemory = store.products.find(
      (p) => p.id === item.product_id || p.slug === item.slug
    );
    const matched = matchedPublished ?? matchedMemory;

    if (!matched || typeof matched.price_amount !== "number" || matched.price_amount <= 0) {
      throw new Error(
        `Product "${item.slug || item.product_id}" was not found in the trusted backend catalog or has no valid INR price.`
      );
    }

    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
    const unitPrice = matched.price_amount;
    const origPrice =
      typeof matched.original_price_amount === "number" &&
      matched.original_price_amount >= unitPrice
        ? matched.original_price_amount
        : unitPrice;

    if (params.decrementStock && matchedMemory) {
      const currentStock =
        typeof matchedMemory.stock_count === "number"
          ? matchedMemory.stock_count
          : 10;
      matchedMemory.stock_count = Math.max(0, currentStock - quantity);
    }

    return {
      product_id: matched.id,
      slug: matched.slug,
      name: matched.name || item.name || "Timepiece",
      collection_name:
        matched.collection?.name || item.collection_name || null,
      selected_options: item.selected_options || null,
      quantity,
      unit_price: unitPrice,
      original_unit_price: origPrice,
      line_total: unitPrice * quantity,
      image_url: matched.images[0]?.url || item.image_url || null
    };
  });

  const itemSubtotal = normalizedItems.reduce(
    (sum, i) => sum + i.original_unit_price * i.quantity,
    0
  );
  const netItemsTotal = normalizedItems.reduce(
    (sum, i) => sum + i.line_total,
    0
  );
  const discountTotal = Math.max(0, itemSubtotal - netItemsTotal);
  const deliveryFee = Math.max(0, params.delivery_fee || 0);
  const finalTotal = netItemsTotal + deliveryFee;

  return {
    normalizedItems,
    itemSubtotal,
    netItemsTotal,
    discountTotal,
    deliveryFee,
    finalTotal
  };
}

/**
 * Creates a new store order from either the Website or Mobile App.
 * - Validates and computes totals strictly on the server from the trusted catalog.
 * - Never marks an order as `paid` at creation time (payment_status starts as `pending`
 *   until confirmed by the payment provider or COD collection).
 * - Decrements product stock counts and triggers admin alerts if configured.
 */
export async function createStoreOrder(
  input: CreateStoreOrderInput
): Promise<StoreOrderRecord> {
  const store = getMemoryStore();
  const now = new Date().toISOString();
  const orderNumber = `SUS-${Date.now().toString().slice(-6)}-${Math.random()
    .toString(36)
    .slice(2, 4)
    .toUpperCase()}`;

  const {
    normalizedItems,
    itemSubtotal,
    discountTotal,
    deliveryFee,
    finalTotal
  } = await calculateTrustedOrderPricing({
    items: input.items,
    delivery_fee: input.delivery_fee,
    decrementStock: true
  });

  const order: StoreOrderRecord = {
    id: crypto.randomUUID(),
    order_number: orderNumber,
    user_id: input.user_id ?? null,
    customer_name: input.customer_name,
    customer_email: input.customer_email,
    customer_phone: input.customer_phone,
    delivery_address: {
      full_name: input.customer_name,
      email: input.customer_email,
      phone: input.customer_phone,
      address_line1: input.delivery_address.address_line1,
      address_line2: input.delivery_address.address_line2 || null,
      landmark: input.delivery_address.landmark || null,
      city: input.delivery_address.city,
      state: input.delivery_address.state,
      pincode: input.delivery_address.pincode
    },
    items: normalizedItems,
    item_subtotal: itemSubtotal,
    discount_total: discountTotal,
    delivery_fee: deliveryFee,
    final_total: finalTotal,
    currency: "INR",
    payment_method: input.payment_method,
    // Strictly 'pending' until confirmed by payment provider verification
    payment_status: "pending",
    payment_reference: input.payment_reference || null,
    order_status: "new",
    courier_name: null,
    tracking_number: null,
    status_history: [
      {
        from_status: null,
        to_status: "new",
        changed_by: "system:checkout",
        changed_at: now,
        note: `Order placed via ${input.source} (${input.payment_method.toUpperCase()})`
      }
    ],
    source: input.source,
    created_at: now,
    updated_at: now
  };

  if (isServiceRoleConfigured()) {
    const service = createSupabaseServiceClient();
    if (service) {
      await service.from("store_orders").insert({
        id: order.id,
        order_number: order.order_number,
        user_id: order.user_id,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        delivery_address: order.delivery_address,
        items: order.items,
        item_subtotal: order.item_subtotal,
        discount_total: order.discount_total,
        delivery_fee: order.delivery_fee,
        final_total: order.final_total,
        currency: order.currency,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        payment_reference: order.payment_reference,
        order_status: order.order_status,
        courier_name: order.courier_name,
        tracking_number: order.tracking_number,
        status_history: order.status_history,
        source: order.source,
        created_at: order.created_at,
        updated_at: order.updated_at
      });
    }
  }

  store.orders.unshift(order);

  // Trigger admin email/push alert if configured on server
  await sendNewOrderAdminAlert(order);

  return order;
}

export async function getStoreOrderById(
  orderId: string
): Promise<StoreOrderRecord | null> {
  const store = getMemoryStore();
  const inMemory = store.orders.find(
    (o) => o.id === orderId || o.order_number === orderId
  );
  if (inMemory) return inMemory;

  if (isServiceRoleConfigured()) {
    const service = createSupabaseServiceClient();
    if (service) {
      const { data } = await service
        .from("store_orders")
        .select("*")
        .or(`id.eq.${orderId},order_number.eq.${orderId}`)
        .maybeSingle();
      if (data) {
        const record = data as StoreOrderRecord;
        store.orders.unshift(record);
        return record;
      }
    }
  }

  return null;
}

async function findOrderForPaymentReference(params: {
  orderId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}): Promise<StoreOrderRecord | null> {
  const store = getMemoryStore();

  const matchInList = (list: StoreOrderRecord[]) =>
    list.find(
      (o) =>
        (params.orderId &&
          (o.id === params.orderId || o.order_number === params.orderId)) ||
        (params.razorpayOrderId &&
          (o.payment_reference === params.razorpayOrderId ||
            o.payment_reference?.includes(params.razorpayOrderId))) ||
        (params.razorpayPaymentId &&
          o.payment_reference?.includes(params.razorpayPaymentId))
    ) ?? null;

  const localMatch = matchInList(store.orders);
  if (localMatch) return localMatch;

  if (isServiceRoleConfigured()) {
    const service = createSupabaseServiceClient();
    if (service) {
      const { data } = await service
        .from("store_orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (Array.isArray(data)) {
        const found = matchInList(data as StoreOrderRecord[]);
        if (found) {
          store.orders.unshift(found);
          return found;
        }
      }
    }
  }

  return null;
}

export async function attachRazorpayOrderToStoreOrder(
  orderId: string,
  razorpayOrderId: string
): Promise<StoreOrderRecord | null> {
  const order = await getStoreOrderById(orderId);
  if (!order) return null;

  const now = new Date().toISOString();
  order.payment_reference = razorpayOrderId;
  order.updated_at = now;

  if (isServiceRoleConfigured()) {
    const service = createSupabaseServiceClient();
    if (service) {
      await service
        .from("store_orders")
        .update({
          payment_reference: razorpayOrderId,
          updated_at: now
        })
        .eq("id", order.id);
    }
  }

  return order;
}

/**
 * Marks an order as paid ONLY after the payment provider (Razorpay HMAC signature / webhook)
 * confirms the transaction. Stores only the safe provider reference.
 * Idempotent: safe to call from both signature verification and webhook delivery.
 */
export async function markOrderPaidByProvider(params: {
  orderId?: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  verifiedSource?: "signature" | "webhook";
}): Promise<StoreOrderRecord | null> {
  const safeRef = `${params.razorpayOrderId} / ${params.razorpayPaymentId}`;
  const now = new Date().toISOString();

  const order = await findOrderForPaymentReference({
    orderId: params.orderId,
    razorpayOrderId: params.razorpayOrderId,
    razorpayPaymentId: params.razorpayPaymentId
  });

  if (!order) return null;

  // Idempotent guard: if already paid with this exact payment ID, do not duplicate history
  if (
    order.payment_status === "paid" &&
    order.payment_reference?.includes(params.razorpayPaymentId)
  ) {
    return order;
  }

  const prevStatus = order.order_status;
  order.payment_status = "paid";
  order.payment_reference = safeRef;
  const actor =
    params.verifiedSource === "webhook"
      ? "webhook:razorpay"
      : "payment_provider:razorpay";

  if (order.order_status === "new") {
    order.order_status = "confirmed";
    order.status_history.push({
      from_status: prevStatus,
      to_status: "confirmed",
      changed_by: actor,
      changed_at: now,
      note: `Payment confirmed by provider (${safeRef})`
    });
  } else {
    order.status_history.push({
      from_status: prevStatus,
      to_status: prevStatus,
      changed_by: actor,
      changed_at: now,
      note: `Payment settled by provider (${safeRef})`
    });
  }
  order.updated_at = now;

  if (isServiceRoleConfigured()) {
    const service = createSupabaseServiceClient();
    if (service) {
      await service
        .from("store_orders")
        .update({
          payment_status: order.payment_status,
          payment_reference: order.payment_reference,
          order_status: order.order_status,
          status_history: order.status_history,
          updated_at: now
        })
        .eq("id", order.id);
    }
  }

  return order;
}

export async function markOrderPaymentFailedByProvider(params: {
  orderId?: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  reason?: string | null;
}): Promise<StoreOrderRecord | null> {
  const safeRef = params.razorpayPaymentId
    ? `${params.razorpayOrderId} / ${params.razorpayPaymentId}`
    : params.razorpayOrderId;
  const now = new Date().toISOString();

  const order = await findOrderForPaymentReference({
    orderId: params.orderId,
    razorpayOrderId: params.razorpayOrderId,
    razorpayPaymentId: params.razorpayPaymentId
  });

  if (!order) return null;

  // Never downgrade an already-paid order if an earlier failed attempt webhook arrives late
  if (order.payment_status === "paid") {
    return order;
  }

  // Idempotent guard if already marked failed with this reference
  if (
    order.payment_status === "failed" &&
    order.payment_reference === safeRef
  ) {
    return order;
  }

  order.payment_status = "failed";
  order.payment_reference = safeRef;
  order.status_history.push({
    from_status: order.order_status,
    to_status: order.order_status,
    changed_by: "webhook:razorpay",
    changed_at: now,
    note: `Payment failed (${safeRef})${params.reason ? `: ${params.reason}` : ""}`
  });
  order.updated_at = now;

  if (isServiceRoleConfigured()) {
    const service = createSupabaseServiceClient();
    if (service) {
      await service
        .from("store_orders")
        .update({
          payment_status: order.payment_status,
          payment_reference: order.payment_reference,
          status_history: order.status_history,
          updated_at: now
        })
        .eq("id", order.id);
    }
  }

  return order;
}

/**
 * Processes a verified Razorpay webhook event idempotently.
 * Handles duplicate webhook deliveries safely via eventId + order state checks.
 */
export async function processRazorpayWebhookEvent(params: {
  eventId: string;
  eventType: string;
  storeOrderId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpayRefundId?: string;
  amountPaise?: number;
  errorDescription?: string | null;
}): Promise<{
  handled: boolean;
  duplicate: boolean;
  order: StoreOrderRecord | null;
  reason?: string;
}> {
  const store = getMemoryStore();
  const dedupeKey =
    params.eventId ||
    `${params.eventType}:${params.razorpayOrderId || ""}:${params.razorpayPaymentId || ""}:${params.razorpayRefundId || ""}`;

  if (dedupeKey && store.processedWebhookEventIds.includes(dedupeKey)) {
    const existingOrder = await findOrderForPaymentReference({
      orderId: params.storeOrderId,
      razorpayOrderId: params.razorpayOrderId,
      razorpayPaymentId: params.razorpayPaymentId
    });
    return {
      handled: true,
      duplicate: true,
      order: existingOrder
    };
  }

  if (
    params.eventType === "payment.captured" ||
    params.eventType === "order.paid"
  ) {
    if (!params.razorpayOrderId || !params.razorpayPaymentId) {
      return {
        handled: false,
        duplicate: false,
        order: null,
        reason: "Missing razorpayOrderId or razorpayPaymentId in webhook payload."
      };
    }

    const targetOrder = await findOrderForPaymentReference({
      orderId: params.storeOrderId,
      razorpayOrderId: params.razorpayOrderId,
      razorpayPaymentId: params.razorpayPaymentId
    });

    if (!targetOrder) {
      return {
        handled: false,
        duplicate: false,
        order: null,
        reason: "Matching order not found."
      };
    }

    // Verify paid amount in paise matches the server-computed order total
    const expectedPaise = Math.round(targetOrder.final_total * 100);
    if (
      typeof params.amountPaise === "number" &&
      params.amountPaise > 0 &&
      params.amountPaise !== expectedPaise
    ) {
      return {
        handled: false,
        duplicate: false,
        order: targetOrder,
        reason: `Webhook amount mismatch: expected ${expectedPaise} paise, got ${params.amountPaise} paise.`
      };
    }

    // Check if already paid with this payment ID
    if (
      targetOrder.payment_status === "paid" &&
      targetOrder.payment_reference?.includes(params.razorpayPaymentId)
    ) {
      if (dedupeKey) store.processedWebhookEventIds.push(dedupeKey);
      return {
        handled: true,
        duplicate: true,
        order: targetOrder
      };
    }

    const updated = await markOrderPaidByProvider({
      orderId: targetOrder.id,
      razorpayOrderId: params.razorpayOrderId,
      razorpayPaymentId: params.razorpayPaymentId,
      verifiedSource: "webhook"
    });

    if (dedupeKey) store.processedWebhookEventIds.push(dedupeKey);
    return {
      handled: true,
      duplicate: false,
      order: updated
    };
  }

  if (params.eventType === "payment.failed") {
    if (!params.razorpayOrderId) {
      return {
        handled: false,
        duplicate: false,
        order: null,
        reason: "Missing razorpayOrderId in payment.failed payload."
      };
    }

    const updated = await markOrderPaymentFailedByProvider({
      orderId: params.storeOrderId,
      razorpayOrderId: params.razorpayOrderId,
      razorpayPaymentId: params.razorpayPaymentId,
      reason: params.errorDescription
    });

    if (dedupeKey) store.processedWebhookEventIds.push(dedupeKey);
    return {
      handled: Boolean(updated),
      duplicate: false,
      order: updated
    };
  }

  if (
    params.eventType === "refund.processed" ||
    params.eventType === "refund.created"
  ) {
    const targetOrder = await findOrderForPaymentReference({
      orderId: params.storeOrderId,
      razorpayOrderId: params.razorpayOrderId,
      razorpayPaymentId: params.razorpayPaymentId
    });

    if (!targetOrder) {
      return {
        handled: false,
        duplicate: false,
        order: null,
        reason: "Matching order not found for refund webhook."
      };
    }

    if (targetOrder.payment_status === "refunded") {
      if (dedupeKey) store.processedWebhookEventIds.push(dedupeKey);
      return {
        handled: true,
        duplicate: true,
        order: targetOrder
      };
    }

    const now = new Date().toISOString();
    targetOrder.payment_status = "refunded";
    targetOrder.status_history.push({
      from_status: targetOrder.order_status,
      to_status: targetOrder.order_status,
      changed_by: "webhook:razorpay",
      changed_at: now,
      note: `Refund processed via Razorpay (${params.razorpayRefundId || params.razorpayPaymentId || "refund"})`
    });
    targetOrder.updated_at = now;

    if (isServiceRoleConfigured()) {
      const service = createSupabaseServiceClient();
      if (service) {
        await service
          .from("store_orders")
          .update({
            payment_status: targetOrder.payment_status,
            status_history: targetOrder.status_history,
            updated_at: now
          })
          .eq("id", targetOrder.id);
      }
    }

    if (dedupeKey) store.processedWebhookEventIds.push(dedupeKey);
    return {
      handled: true,
      duplicate: false,
      order: targetOrder
    };
  }

  if (dedupeKey) store.processedWebhookEventIds.push(dedupeKey);
  return {
    handled: false,
    duplicate: false,
    order: null,
    reason: `Unhandled event type: ${params.eventType}`
  };
}

// ============================================================================
// ADMIN REPOSITORY FUNCTIONS (Used only after server-side admin verification)
// ============================================================================

export function buildCustomerSummaries(
  orders: StoreOrderRecord[]
): CustomerSummaryRecord[] {
  const map = new Map<string, CustomerSummaryRecord>();

  for (const ord of orders) {
    const key = ord.customer_email.toLowerCase() || ord.customer_phone;
    const existing = map.get(key);
    const isPaid = ord.payment_status === "paid";

    const orderSummary = {
      id: ord.id,
      order_number: ord.order_number,
      created_at: ord.created_at,
      final_total: ord.final_total,
      order_status: ord.order_status,
      payment_status: ord.payment_status
    };

    if (!existing) {
      map.set(key, {
        customer_key: key,
        full_name: ord.customer_name,
        email: ord.customer_email,
        phone: ord.customer_phone,
        city: ord.delivery_address.city,
        state: ord.delivery_address.state,
        total_orders: 1,
        paid_orders_count: isPaid ? 1 : 0,
        total_paid_spent: isPaid ? ord.final_total : 0,
        last_order_at: ord.created_at,
        orders: [orderSummary]
      });
    } else {
      existing.total_orders += 1;
      if (isPaid) {
        existing.paid_orders_count += 1;
        existing.total_paid_spent += ord.final_total;
      }
      if (ord.created_at > existing.last_order_at) {
        existing.last_order_at = ord.created_at;
        existing.full_name = ord.customer_name;
        existing.city = ord.delivery_address.city;
        existing.state = ord.delivery_address.state;
      }
      existing.orders.push(orderSummary);
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    b.last_order_at.localeCompare(a.last_order_at)
  );
}

export async function getAdminDashboardData() {
  if (isServiceRoleConfigured()) {
    const service = createSupabaseServiceClient();
    if (service) {
      const [colsRes, prodsRes, enqRes, subRes, setRes, ordRes, audRes] =
        await Promise.all([
          service.from("collections").select("*").order("sort_order", { ascending: true }),
          service
            .from("products")
            .select("*, product_images(*)")
            .order("sort_order", { ascending: true }),
          service.from("enquiries").select("*").order("created_at", { ascending: false }),
          service
            .from("newsletter_subscribers")
            .select("*")
            .order("created_at", { ascending: false }),
          service.from("site_settings").select("*").eq("id", 1).maybeSingle(),
          service
            .from("store_orders")
            .select("*")
            .order("created_at", { ascending: false }),
          service
            .from("admin_audit_logs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(200)
        ]);

      const collections = (colsRes.data as CollectionRecord[]) ?? defaultCollections;
      const collectionsMap = new Map(collections.map((c) => [c.id, c]));
      const products = ((prodsRes.data as Record<string, unknown>[]) ?? []).map((r) =>
        normalizeProductRow(r, collectionsMap)
      );
      const orders = (ordRes.data as StoreOrderRecord[]) ?? getMemoryStore().orders;
      const auditLogs =
        (audRes.data as AdminAuditLogRecord[]) ?? getMemoryStore().auditLogs;

      return {
        settings: (setRes.data as SiteSettingsRecord) ?? defaultSiteSettings,
        collections,
        products:
          products.length > 0
            ? products
            : getMemoryStore().products,
        enquiries: (enqRes.data as EnquiryRecord[]) ?? [],
        subscribers: (subRes.data as NewsletterSubscriberRecord[]) ?? [],
        orders,
        customers: buildCustomerSummaries(orders),
        auditLogs
      };
    }
  }

  const store = getMemoryStore();
  return {
    settings: store.settings,
    collections: store.collections,
    products: store.products,
    enquiries: store.enquiries,
    subscribers: store.subscribers,
    orders: store.orders,
    customers: buildCustomerSummaries(store.orders),
    auditLogs: store.auditLogs
  };
}

export async function updateAdminOrderStatus(params: {
  id: string;
  order_status: OrderStatusStage;
  payment_status?: OrderPaymentStatus;
  courier_name?: string;
  tracking_number?: string;
  note?: string;
  adminEmail: string;
}): Promise<{
  order: StoreOrderRecord;
  customerNotified: boolean;
  notificationChannel: string | null;
}> {
  const store = getMemoryStore();
  const order = store.orders.find((o) => o.id === params.id);
  if (!order) {
    throw new Error("Order not found.");
  }

  const now = new Date().toISOString();
  const prevStatus = order.order_status;
  const prevPaymentStatus = order.payment_status;

  order.order_status = params.order_status;
  if (params.payment_status) {
    order.payment_status = params.payment_status;
  }
  if (params.courier_name !== undefined) {
    order.courier_name = params.courier_name || null;
  }
  if (params.tracking_number !== undefined) {
    order.tracking_number = params.tracking_number || null;
  }

  order.status_history.push({
    from_status: prevStatus,
    to_status: params.order_status,
    changed_by: params.adminEmail,
    changed_at: now,
    note:
      params.note ||
      (params.courier_name || params.tracking_number
        ? `Tracking: ${[params.courier_name, params.tracking_number]
            .filter(Boolean)
            .join(" - ")}`
        : null)
  });
  order.updated_at = now;

  if (isServiceRoleConfigured()) {
    const service = createSupabaseServiceClient();
    if (service) {
      await service
        .from("store_orders")
        .update({
          order_status: order.order_status,
          payment_status: order.payment_status,
          courier_name: order.courier_name,
          tracking_number: order.tracking_number,
          status_history: order.status_history,
          updated_at: now
        })
        .eq("id", order.id);
    }
  }

  const isRefundAction =
    params.order_status === "refund_requested" ||
    params.payment_status === "refunded";

  await recordAdminAuditLog({
    action_type: isRefundAction
      ? "order_refund_updated"
      : "order_status_updated",
    actor_email: params.adminEmail,
    target_type: "order",
    target_id: order.order_number,
    summary: `Order ${order.order_number} status changed from "${prevStatus}" to "${params.order_status}" by ${params.adminEmail}`,
    metadata: {
      order_id: order.id,
      order_number: order.order_number,
      from_status: prevStatus,
      to_status: params.order_status,
      from_payment_status: prevPaymentStatus,
      to_payment_status: order.payment_status,
      courier_name: order.courier_name,
      tracking_number: order.tracking_number
    }
  });

  const notifyRes = await sendOrderStatusCustomerNotification(
    order,
    params.order_status
  );

  return {
    order,
    customerNotified: notifyRes.sent,
    notificationChannel: notifyRes.channel
  };
}

export async function saveAdminProduct(
  product: Partial<ProductRecord> & { name: string; slug: string },
  adminEmail = "admin"
) {
  const store = getMemoryStore();
  const idx = store.products.findIndex(
    (p) => p.id === product.id || p.slug === product.slug
  );
  const existing = idx >= 0 ? store.products[idx] : undefined;

  const salePrice =
    product.price_amount !== undefined
      ? product.price_amount
      : existing?.price_amount ?? null;
  const origPrice =
    product.original_price_amount !== undefined
      ? product.original_price_amount
      : existing?.original_price_amount ?? salePrice;

  const savingsAmount =
    salePrice && origPrice && origPrice > salePrice ? origPrice - salePrice : 0;
  const discountPercent =
    salePrice && origPrice && origPrice > salePrice
      ? Math.round(((origPrice - salePrice) / origPrice) * 1000) / 10
      : 0;
  const priceDisplay =
    product.price_display ||
    (salePrice ? `₹${Math.round(salePrice).toLocaleString("en-IN")}` : null);
  const savingsLabel =
    savingsAmount > 0
      ? `Save ₹${Math.round(savingsAmount).toLocaleString("en-IN")}`
      : null;
  const stockCount =
    typeof product.stock_count === "number"
      ? Math.max(0, Math.floor(product.stock_count))
      : existing?.stock_count ?? 10;

  if (isServiceRoleConfigured()) {
    const service = createSupabaseServiceClient();
    if (service) {
      const payload = {
        ...(product.id ? { id: product.id } : {}),
        slug: product.slug,
        name: product.name,
        reference_code: product.reference_code || null,
        collection_id: product.collection_id || null,
        short_description: product.short_description || null,
        description: product.description || null,
        price_amount: salePrice,
        original_price_amount: origPrice,
        discount_percent: discountPercent,
        savings_label: savingsLabel,
        stock_count: stockCount,
        price_currency: product.price_currency || "INR",
        price_display: priceDisplay,
        availability_status: product.availability_status ?? "available",
        featured: Boolean(product.featured),
        published: Boolean(product.published),
        sort_order: product.sort_order ?? 0,
        specs: product.specs ?? [],
        updated_at: new Date().toISOString()
      };
      const { data, error } = await service
        .from("products")
        .upsert(payload, { onConflict: "slug" })
        .select("*")
        .single();
      if (error) throw new Error(error.message);

      await recordAdminAuditLog({
        action_type: existing ? "product_price_or_stock_updated" : "product_created",
        actor_email: adminEmail,
        target_type: "product",
        target_id: product.slug,
        summary: existing
          ? `Updated product "${product.name}" (Sale: ₹${salePrice ?? 0}, MRP: ₹${origPrice ?? 0}, Stock: ${stockCount})`
          : `Created product "${product.name}" (Sale: ₹${salePrice ?? 0}, Stock: ${stockCount})`,
        metadata: {
          previous_price: existing?.price_amount ?? null,
          new_price: salePrice,
          previous_original_price: existing?.original_price_amount ?? null,
          new_original_price: origPrice,
          previous_stock: existing?.stock_count ?? null,
          new_stock: stockCount
        }
      });

      return data;
    }
  }

  const updated: ProductRecord = {
    id: product.id ?? existing?.id ?? crypto.randomUUID(),
    slug: product.slug,
    name: product.name,
    reference_code: product.reference_code ?? null,
    collection_id: product.collection_id ?? null,
    short_description: product.short_description ?? null,
    description: product.description ?? null,
    price_amount: salePrice,
    original_price_amount: origPrice,
    discount_percent: discountPercent,
    savings_label: savingsLabel,
    price_currency: product.price_currency ?? "INR",
    price_display: priceDisplay,
    availability_status: product.availability_status ?? "available",
    stock_count: stockCount,
    featured: Boolean(product.featured),
    published: Boolean(product.published),
    sort_order: product.sort_order ?? 0,
    specs: product.specs ?? [],
    images: product.images ?? existing?.images ?? [],
    created_at: existing?.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (idx >= 0) {
    store.products[idx] = updated;
  } else {
    store.products.unshift(updated);
  }

  await recordAdminAuditLog({
    action_type: existing ? "product_price_or_stock_updated" : "product_created",
    actor_email: adminEmail,
    target_type: "product",
    target_id: updated.slug,
    summary: existing
      ? `Updated product "${updated.name}" (Sale: ₹${salePrice ?? 0}, MRP: ₹${origPrice ?? 0}, Stock: ${stockCount})`
      : `Created product "${updated.name}" (Sale: ₹${salePrice ?? 0}, Stock: ${stockCount})`,
    metadata: {
      previous_price: existing?.price_amount ?? null,
      new_price: salePrice,
      previous_original_price: existing?.original_price_amount ?? null,
      new_original_price: origPrice,
      previous_stock: existing?.stock_count ?? null,
      new_stock: stockCount
    }
  });

  return updated;
}

export async function deleteAdminProduct(id: string, adminEmail = "admin") {
  const store = getMemoryStore();
  const target = store.products.find((p) => p.id === id);

  if (isServiceRoleConfigured()) {
    const service = createSupabaseServiceClient();
    if (service) {
      const { error } = await service.from("products").delete().eq("id", id);
      if (error) throw new Error(error.message);
    }
  }

  store.products = store.products.filter((p) => p.id !== id);

  await recordAdminAuditLog({
    action_type: "product_deleted",
    actor_email: adminEmail,
    target_type: "product",
    target_id: target?.slug || id,
    summary: `Deleted product "${target?.name || id}"`,
    metadata: { product_id: id }
  });
}

export async function saveAdminCollection(
  col: Partial<CollectionRecord> & { name: string; slug: string },
  adminEmail = "admin"
) {
  if (isServiceRoleConfigured()) {
    const service = createSupabaseServiceClient();
    if (service) {
      const payload = {
        ...(col.id ? { id: col.id } : {}),
        slug: col.slug,
        name: col.name,
        subtitle: col.subtitle || null,
        description: col.description || null,
        cover_image_url: col.cover_image_url || null,
        cover_image_alt: col.cover_image_alt || null,
        sort_order: col.sort_order ?? 0,
        published: col.published ?? true,
        updated_at: new Date().toISOString()
      };
      const { data, error } = await service
        .from("collections")
        .upsert(payload, { onConflict: "slug" })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      await recordAdminAuditLog({
        action_type: "collection_updated",
        actor_email: adminEmail,
        target_type: "collection",
        target_id: col.slug,
        summary: `Saved collection "${col.name}"`
      });
      return data;
    }
  }

  const store = getMemoryStore();
  const idx = store.collections.findIndex((c) => c.id === col.id || c.slug === col.slug);
  const existing = idx >= 0 ? store.collections[idx] : undefined;

  const updated: CollectionRecord = {
    id: col.id ?? existing?.id ?? crypto.randomUUID(),
    slug: col.slug,
    name: col.name,
    subtitle: col.subtitle ?? null,
    description: col.description ?? null,
    cover_image_url: col.cover_image_url ?? null,
    cover_image_alt: col.cover_image_alt ?? null,
    sort_order: col.sort_order ?? 0,
    published: col.published ?? true
  };

  if (idx >= 0) {
    store.collections[idx] = updated;
  } else {
    store.collections.push(updated);
  }

  await recordAdminAuditLog({
    action_type: "collection_updated",
    actor_email: adminEmail,
    target_type: "collection",
    target_id: col.slug,
    summary: `Saved collection "${col.name}"`
  });

  return updated;
}

export async function deleteAdminCollection(id: string) {
  if (isServiceRoleConfigured()) {
    const service = createSupabaseServiceClient();
    if (service) {
      const { error } = await service.from("collections").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return;
    }
  }
  const store = getMemoryStore();
  store.collections = store.collections.filter((c) => c.id !== id);
}

export async function updateAdminEnquiry(
  id: string,
  status: EnquiryRecord["status"],
  internal_notes: string
) {
  if (isServiceRoleConfigured()) {
    const service = createSupabaseServiceClient();
    if (service) {
      const { data, error } = await service
        .from("enquiries")
        .update({
          status,
          internal_notes,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return data;
    }
  }
  const store = getMemoryStore();
  const item = store.enquiries.find((e) => e.id === id);
  if (item) {
    item.status = status;
    item.internal_notes = internal_notes;
    item.updated_at = new Date().toISOString();
  }
  return item;
}

export async function saveAdminSiteSettings(
  input: Omit<SiteSettingsRecord, "id">,
  adminEmail = "admin"
) {
  if (isServiceRoleConfigured()) {
    const service = createSupabaseServiceClient();
    if (service) {
      const { data, error } = await service
        .from("site_settings")
        .upsert({ id: 1, ...input, updated_at: new Date().toISOString() })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      await recordAdminAuditLog({
        action_type: "settings_updated",
        actor_email: adminEmail,
        target_type: "settings",
        target_id: "site_settings",
        summary: `Updated store settings by ${adminEmail}`
      });
      return data;
    }
  }
  const store = getMemoryStore();
  store.settings = {
    id: 1,
    ...input,
    updated_at: new Date().toISOString()
  };
  await recordAdminAuditLog({
    action_type: "settings_updated",
    actor_email: adminEmail,
    target_type: "settings",
    target_id: "site_settings",
    summary: `Updated store settings by ${adminEmail}`
  });
  return store.settings;
}

export async function addAdminProductImage(input: {
  product_id: string;
  url: string;
  storage_path: string | null;
  alt_text: string;
  is_primary: boolean;
}) {
  if (isServiceRoleConfigured()) {
    const service = createSupabaseServiceClient();
    if (service) {
      if (input.is_primary) {
        await service
          .from("product_images")
          .update({ is_primary: false })
          .eq("product_id", input.product_id);
      }
      const { data, error } = await service
        .from("product_images")
        .insert({
          product_id: input.product_id,
          url: input.url,
          storage_path: input.storage_path,
          alt_text: input.alt_text,
          is_primary: input.is_primary,
          sort_order: 0
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return data as ProductImageRecord;
    }
  }

  const store = getMemoryStore();
  const product = store.products.find((p) => p.id === input.product_id);
  if (!product) throw new Error("Product not found");

  if (input.is_primary) {
    product.images.forEach((img) => {
      img.is_primary = false;
    });
  }

  const imgRecord: ProductImageRecord = {
    id: crypto.randomUUID(),
    product_id: input.product_id,
    storage_path: input.storage_path,
    url: input.url,
    alt_text: input.alt_text,
    is_primary: input.is_primary || product.images.length === 0,
    sort_order: product.images.length,
    width: 1200,
    height: 1500
  };
  product.images.push(imgRecord);
  return imgRecord;
}

export function isOnlinePaymentProviderConfigured(): boolean {
  return Boolean(
    process.env.RAZORPAY_KEY_ID?.trim() &&
      process.env.RAZORPAY_KEY_SECRET?.trim()
  );
}

export function getRazorpayConfigStatus(): {
  configured: boolean;
  webhookConfigured: boolean;
  mode: "test" | "live";
} {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim() || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || "";
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || "";
  const configured = Boolean(keyId && keySecret);
  const mode = configured && keyId.startsWith("rzp_live_") ? "live" : "test";
  return {
    configured,
    webhookConfigured: Boolean(webhookSecret),
    mode
  };
}

export async function deleteAdminProductImage(imageId: string) {
  if (isServiceRoleConfigured()) {
    const service = createSupabaseServiceClient();
    if (service) {
      const { data: existing } = await service
        .from("product_images")
        .select("storage_path")
        .eq("id", imageId)
        .maybeSingle();

      if (existing?.storage_path) {
        await service.storage.from("product-images").remove([existing.storage_path]);
      }

      const { error } = await service.from("product_images").delete().eq("id", imageId);
      if (error) throw new Error(error.message);
      return;
    }
  }

  const store = getMemoryStore();
  for (const prod of store.products) {
    prod.images = prod.images.filter((img) => img.id !== imageId);
  }
}
