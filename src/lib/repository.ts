import crypto from "crypto";
import type {
  CollectionRecord,
  EnquiryRecord,
  NewsletterSubscriberRecord,
  ProductImageRecord,
  ProductRecord,
  SiteSettingsRecord
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

// In-memory store for local dev / automated tests when Supabase env vars are not set
interface LocalMemoryStore {
  settings: SiteSettingsRecord;
  collections: CollectionRecord[];
  products: ProductRecord[];
  enquiries: EnquiryRecord[];
  subscribers: NewsletterSubscriberRecord[];
}

const globalForStore = globalThis as unknown as {
  __stepupMemoryStore?: LocalMemoryStore;
};

function getMemoryStore(): LocalMemoryStore {
  if (!globalForStore.__stepupMemoryStore) {
    globalForStore.__stepupMemoryStore = {
      settings: structuredClone(defaultSiteSettings),
      collections: structuredClone(defaultCollections),
      products: structuredClone(defaultProducts),
      enquiries: [],
      subscribers: []
    };
  }
  return globalForStore.__stepupMemoryStore;
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
// SERVER-ONLY WRITE OPERATIONS FOR PUBLIC FORMS (Enquiries & Newsletter)
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

// ============================================================================
// ADMIN REPOSITORY FUNCTIONS (Used only after server-side admin verification)
// ============================================================================

export async function getAdminDashboardData() {
  if (isServiceRoleConfigured()) {
    const service = createSupabaseServiceClient();
    if (service) {
      const [colsRes, prodsRes, enqRes, subRes, setRes] = await Promise.all([
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
        service.from("site_settings").select("*").eq("id", 1).maybeSingle()
      ]);

      const collections = (colsRes.data as CollectionRecord[]) ?? defaultCollections;
      const collectionsMap = new Map(collections.map((c) => [c.id, c]));
      const products = ((prodsRes.data as Record<string, unknown>[]) ?? []).map((r) =>
        normalizeProductRow(r, collectionsMap)
      );

      return {
        settings: (setRes.data as SiteSettingsRecord) ?? defaultSiteSettings,
        collections,
        products: products.length > 0 ? products : defaultProducts,
        enquiries: (enqRes.data as EnquiryRecord[]) ?? [],
        subscribers: (subRes.data as NewsletterSubscriberRecord[]) ?? []
      };
    }
  }

  const store = getMemoryStore();
  return {
    settings: store.settings,
    collections: store.collections,
    products: store.products,
    enquiries: store.enquiries,
    subscribers: store.subscribers
  };
}

export async function saveAdminProduct(product: Partial<ProductRecord> & { name: string; slug: string }) {
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
        price_amount: product.price_amount ?? null,
        price_currency: product.price_currency || "INR",
        price_display: product.price_display || null,
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
      return data;
    }
  }

  const store = getMemoryStore();
  const idx = store.products.findIndex((p) => p.id === product.id || p.slug === product.slug);
  const existing = idx >= 0 ? store.products[idx] : undefined;

  const updated: ProductRecord = {
    id: product.id ?? existing?.id ?? crypto.randomUUID(),
    slug: product.slug,
    name: product.name,
    reference_code: product.reference_code ?? null,
    collection_id: product.collection_id ?? null,
    short_description: product.short_description ?? null,
    description: product.description ?? null,
    price_amount: product.price_amount ?? existing?.price_amount ?? null,
    original_price_amount:
      product.original_price_amount ?? existing?.original_price_amount ?? null,
    discount_percent:
      product.discount_percent ?? existing?.discount_percent ?? null,
    savings_label:
      product.savings_label ?? existing?.savings_label ?? null,
    price_currency: product.price_currency ?? "INR",
    price_display: product.price_display ?? null,
    availability_status: product.availability_status ?? "available",
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
    store.products.push(updated);
  }
  return updated;
}

export async function deleteAdminProduct(id: string) {
  if (isServiceRoleConfigured()) {
    const service = createSupabaseServiceClient();
    if (service) {
      const { error } = await service.from("products").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return;
    }
  }
  const store = getMemoryStore();
  store.products = store.products.filter((p) => p.id !== id);
}

export async function saveAdminCollection(col: Partial<CollectionRecord> & { name: string; slug: string }) {
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

export async function saveAdminSiteSettings(input: Omit<SiteSettingsRecord, "id">) {
  if (isServiceRoleConfigured()) {
    const service = createSupabaseServiceClient();
    if (service) {
      const { data, error } = await service
        .from("site_settings")
        .upsert({ id: 1, ...input, updated_at: new Date().toISOString() })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return data;
    }
  }
  const store = getMemoryStore();
  store.settings = {
    id: 1,
    ...input,
    updated_at: new Date().toISOString()
  };
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
