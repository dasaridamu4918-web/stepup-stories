"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  CollectionRecord,
  EnquiryRecord,
  NewsletterSubscriberRecord,
  ProductRecord,
  ProductSpecItem,
  SiteSettingsRecord
} from "@/types/database";

export function AdminDashboardClient({
  adminEmail,
  initialSettings,
  initialCollections,
  initialProducts,
  initialEnquiries,
  initialSubscribers
}: {
  adminEmail: string;
  initialSettings: SiteSettingsRecord;
  initialCollections: CollectionRecord[];
  initialProducts: ProductRecord[];
  initialEnquiries: EnquiryRecord[];
  initialSubscribers: NewsletterSubscriberRecord[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "products" | "collections" | "enquiries" | "subscribers" | "settings"
  >("products");

  const [settings, setSettings] = useState<SiteSettingsRecord>(initialSettings);
  const [collections, setCollections] =
    useState<CollectionRecord[]>(initialCollections);
  const [products, setProducts] = useState<ProductRecord[]>(initialProducts);
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>(initialEnquiries);
  const [subscribers] =
    useState<NewsletterSubscriberRecord[]>(initialSubscribers);

  const [toast, setToast] = useState<string | null>(null);
  const [enquiryFilter, setEnquiryFilter] = useState<string>("all");
  const [enquirySearch, setEnquirySearch] = useState<string>("");

  // Product Editor State
  const [editingProduct, setEditingProduct] = useState<{
    id?: string;
    slug: string;
    name: string;
    reference_code: string;
    collection_id: string;
    short_description: string;
    description: string;
    price_amount: string;
    price_currency: string;
    price_display: string;
    availability_status: ProductRecord["availability_status"];
    featured: boolean;
    published: boolean;
    sort_order: number;
    specs: ProductSpecItem[];
  }>({
    slug: "",
    name: "",
    reference_code: "",
    collection_id: initialCollections[0]?.id ?? "",
    short_description: "",
    description: "",
    price_amount: "",
    price_currency: "INR",
    price_display: "",
    availability_status: "available",
    featured: false,
    published: true,
    sort_order: 1,
    specs: []
  });

  // Collection Editor State
  const [editingCollection, setEditingCollection] = useState<{
    id?: string;
    slug: string;
    name: string;
    subtitle: string;
    description: string;
    cover_image_url: string;
    cover_image_alt: string;
    sort_order: number;
    published: boolean;
  }>({
    slug: "",
    name: "",
    subtitle: "",
    description: "",
    cover_image_url: "/images/generated/collection-signature.webp",
    cover_image_alt: "",
    sort_order: 1,
    published: true
  });

  const refreshDashboard = async () => {
    const res = await fetch("/api/admin/catalog");
    if (res.ok) {
      const data = (await res.json()) as {
        settings: SiteSettingsRecord;
        collections: CollectionRecord[];
        products: ProductRecord[];
        enquiries: EnquiryRecord[];
      };
      setSettings(data.settings);
      setCollections(data.collections);
      setProducts(data.products);
      setEnquiries(data.enquiries);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);
    const payload = {
      ...(editingProduct.id ? { id: editingProduct.id } : {}),
      slug: editingProduct.slug.trim().toLowerCase(),
      name: editingProduct.name,
      reference_code: editingProduct.reference_code,
      collection_id: editingProduct.collection_id || null,
      short_description: editingProduct.short_description,
      description: editingProduct.description,
      price_amount: editingProduct.price_amount
        ? Number(editingProduct.price_amount)
        : null,
      price_currency: editingProduct.price_currency || "INR",
      price_display: editingProduct.price_display,
      availability_status: editingProduct.availability_status,
      featured: editingProduct.featured,
      published: editingProduct.published,
      sort_order: Number(editingProduct.sort_order) || 0,
      specs: editingProduct.specs.filter((s) => s.key.trim() && s.value.trim())
    };

    const res = await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_product", payload })
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      setToast(data.error || "Failed to save product.");
      return;
    }
    setToast("Product saved.");
    await refreshDashboard();
  };

  const handleDeleteProduct = async (id: string) => {
    await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_product", payload: { id } })
    });
    setToast("Product deleted.");
    await refreshDashboard();
  };

  const handleUploadProductPhoto = async (
    productId: string,
    file: File,
    altText: string,
    isPrimary: boolean
  ) => {
    const fd = new FormData();
    fd.append("product_id", productId);
    fd.append("file", file);
    fd.append("alt_text", altText);
    fd.append("is_primary", String(isPrimary));

    const res = await fetch("/api/admin/catalog", {
      method: "POST",
      body: fd
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      setToast(data.error || "Image upload failed.");
      return;
    }
    setToast("Product photograph uploaded.");
    await refreshDashboard();
  };

  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_collection",
        payload: editingCollection
      })
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      setToast(data.error || "Failed to save collection.");
      return;
    }
    setToast("Collection saved.");
    await refreshDashboard();
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_settings",
        payload: {
          business_name: settings.business_name,
          tagline: settings.tagline || "",
          hero_headline: settings.hero_headline || "",
          hero_subheadline: settings.hero_subheadline || "",
          hero_backdrop_url: settings.hero_backdrop_url || "",
          story_backdrop_url: settings.story_backdrop_url || "",
          og_image_url: settings.og_image_url || "",
          about_story_title: settings.about_story_title || "",
          about_story_body: settings.about_story_body || "",
          contact_email: settings.contact_email || "",
          contact_phone: settings.contact_phone || "",
          address: settings.address || "",
          opening_hours: settings.opening_hours || "",
          private_viewing_details: settings.private_viewing_details || "",
          footer_text: settings.footer_text || "",
          social_links: settings.social_links ?? []
        }
      })
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      setToast(data.error || "Failed to update settings.");
      return;
    }
    setToast("Business & Backdrop Settings saved.");
    await refreshDashboard();
  };

  const handleUpdateEnquiry = async (
    id: string,
    status: EnquiryRecord["status"],
    internal_notes: string
  ) => {
    await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_enquiry",
        payload: { id, status, internal_notes }
      })
    });
    setToast("Enquiry updated.");
    await refreshDashboard();
  };

  const exportEnquiriesCsv = () => {
    const headers = [
      "ID",
      "Created At",
      "Type",
      "Status",
      "Product",
      "Full Name",
      "Email",
      "Phone",
      "Preferred Contact",
      "Preferred Date",
      "Preferred Location",
      "Message",
      "Internal Notes"
    ];
    const rows = enquiries.map((eq) =>
      [
        eq.id,
        eq.created_at,
        eq.enquiry_type,
        eq.status,
        eq.product_name ?? "",
        eq.full_name,
        eq.email,
        eq.phone ?? "",
        eq.preferred_contact ?? "",
        eq.preferred_date ?? "",
        eq.preferred_location ?? "",
        eq.message.replace(/"/g, '""'),
        eq.internal_notes.replace(/"/g, '""')
      ]
        .map((cell) => `"${cell}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stepup-stories-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSignOut = async () => {
    await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" })
    });
    router.push("/admin/login");
    router.refresh();
  };

  const filteredEnquiries = enquiries.filter((eq) => {
    if (enquiryFilter !== "all" && eq.status !== enquiryFilter) return false;
    if (!enquirySearch.trim()) return true;
    const q = enquirySearch.toLowerCase();
    return (
      eq.full_name.toLowerCase().includes(q) ||
      eq.email.toLowerCase().includes(q) ||
      (eq.product_name ?? "").toLowerCase().includes(q) ||
      eq.message.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-gold/25 pb-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            STEPUP STORIES — Maison Control Center
          </p>
          <h1 className="mt-1 font-serif text-3xl text-cream">
            Admin Portal
          </h1>
          <p className="text-xs text-cream-muted">
            Signed in as <span className="text-gold-bright">{adminEmail}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="rounded border border-gold/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gold-bright hover:bg-gold/15"
        >
          Sign Out
        </button>
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="mt-6 rounded border border-gold bg-gold/15 px-4 py-3 text-xs text-gold-bright"
        >
          {toast}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="mt-8 flex flex-wrap gap-2 border-b border-gold/20 pb-4">
        {[
          { id: "products", label: `Timepieces (${products.length})` },
          { id: "collections", label: `Collections (${collections.length})` },
          { id: "enquiries", label: `Enquiries (${enquiries.length})` },
          { id: "subscribers", label: `Journal Subscribers (${subscribers.length})` },
          { id: "settings", label: "Business & Backdrop Settings" }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`rounded px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] transition ${
              activeTab === tab.id
                ? "bg-gold text-obsidian"
                : "border border-gold/25 bg-surface text-cream-secondary hover:border-gold"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: PRODUCTS & PHOTO MANAGEMENT */}
      {activeTab === "products" && (
        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Product List */}
          <div className="space-y-4 lg:col-span-6">
            <h2 className="font-serif text-2xl text-cream">
              Catalog Timepieces
            </h2>
            {products.map((prod) => (
              <div
                key={prod.id}
                className="rounded-xl border border-gold/25 bg-surface p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gold">
                      {prod.collection?.name ?? "Unassigned"} &bull;{" "}
                      {prod.published ? "Published" : "Draft"}
                      {prod.featured ? " • Featured" : ""}
                    </p>
                    <h3 className="mt-1 font-serif text-xl text-cream">
                      {prod.name}
                    </h3>
                    <p className="font-mono text-xs text-cream-muted">
                      Slug: {prod.slug}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingProduct({
                          id: prod.id,
                          slug: prod.slug,
                          name: prod.name,
                          reference_code: prod.reference_code ?? "",
                          collection_id: prod.collection_id ?? "",
                          short_description: prod.short_description ?? "",
                          description: prod.description ?? "",
                          price_amount: prod.price_amount
                            ? String(prod.price_amount)
                            : "",
                          price_currency: prod.price_currency ?? "INR",
                          price_display: prod.price_display ?? "",
                          availability_status: prod.availability_status,
                          featured: prod.featured,
                          published: prod.published,
                          sort_order: prod.sort_order,
                          specs: prod.specs ?? []
                        })
                      }
                      className="rounded border border-gold/40 px-3 py-1 text-xs text-gold-bright hover:bg-gold/10"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(prod.id)}
                      className="rounded border border-burgundy-bright/50 px-3 py-1 text-xs text-[#ff8a9e] hover:bg-burgundy/25"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Upload Real Watch Photo to Supabase Storage */}
                <div className="mt-4 border-t border-gold/15 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                    Photos ({prod.images.length})
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <label className="cursor-pointer rounded border border-gold/40 bg-obsidian px-3 py-1.5 text-xs text-gold-bright hover:border-gold-bright">
                      <span>+ Upload Real Watch Photo</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleUploadProductPhoto(
                              prod.id,
                              file,
                              `${prod.name} photograph`,
                              prod.images.length === 0
                            );
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Create / Edit Product Form */}
          <form
            onSubmit={handleSaveProduct}
            className="space-y-4 rounded-xl border border-gold/30 bg-surface p-6 lg:col-span-6"
          >
            <h2 className="font-serif text-2xl text-cream">
              {editingProduct.id ? "Edit Timepiece" : "Create Timepiece"}
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gold">
                  Watch Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, name: e.target.value })
                  }
                  className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3 py-2 text-sm text-cream"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gold">
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  placeholder="signature-edition-i"
                  value={editingProduct.slug}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, slug: e.target.value })
                  }
                  className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3 py-2 text-sm text-cream"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gold">
                  Collection
                </label>
                <select
                  value={editingProduct.collection_id}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      collection_id: e.target.value
                    })
                  }
                  className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3 py-2 text-sm text-cream"
                >
                  <option value="">Unassigned</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gold">
                  Reference Code (Optional)
                </label>
                <input
                  type="text"
                  value={editingProduct.reference_code}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      reference_code: e.target.value
                    })
                  }
                  className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3 py-2 text-sm text-cream"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gold">
                  Numeric Price (Optional)
                </label>
                <input
                  type="number"
                  value={editingProduct.price_amount}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      price_amount: e.target.value
                    })
                  }
                  className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3 py-2 text-sm text-cream"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gold">
                  Display Price (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Leave blank to hide"
                  value={editingProduct.price_display}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      price_display: e.target.value
                    })
                  }
                  className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3 py-2 text-sm text-cream"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gold">
                  Availability
                </label>
                <select
                  value={editingProduct.availability_status}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      availability_status: e.target
                        .value as ProductRecord["availability_status"]
                    })
                  }
                  className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3 py-2 text-sm text-cream"
                >
                  <option value="available">Available</option>
                  <option value="private_viewing_only">Private Viewing Only</option>
                  <option value="waitlist">Waitlist</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-gold">
                Short Summary
              </label>
              <input
                type="text"
                value={editingProduct.short_description}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    short_description: e.target.value
                  })
                }
                className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3 py-2 text-sm text-cream"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-gold">
                Full Description
              </label>
              <textarea
                rows={3}
                value={editingProduct.description}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    description: e.target.value
                  })
                }
                className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3 py-2 text-sm text-cream"
              />
            </div>

            {/* Flexible Key/Value Specifications */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gold">
                  Specifications (Empty rows are hidden on public site)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setEditingProduct({
                      ...editingProduct,
                      specs: [...editingProduct.specs, { key: "", value: "" }]
                    })
                  }
                  className="text-xs text-gold-bright underline"
                >
                  + Add Specification Row
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {editingProduct.specs.map((spec, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Label (e.g. Case Diameter)"
                      value={spec.key}
                      onChange={(e) => {
                        const next = [...editingProduct.specs];
                        next[idx] = { ...spec, key: e.target.value };
                        setEditingProduct({ ...editingProduct, specs: next });
                      }}
                      className="w-1/2 rounded border border-gold/30 bg-obsidian px-3 py-1.5 text-xs text-cream"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. 40 mm)"
                      value={spec.value}
                      onChange={(e) => {
                        const next = [...editingProduct.specs];
                        next[idx] = { ...spec, value: e.target.value };
                        setEditingProduct({ ...editingProduct, specs: next });
                      }}
                      className="w-1/2 rounded border border-gold/30 bg-obsidian px-3 py-1.5 text-xs text-cream"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-6 pt-2 text-xs text-cream">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingProduct.published}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      published: e.target.checked
                    })
                  }
                />
                <span>Published on Public Site</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingProduct.featured}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      featured: e.target.checked
                    })
                  }
                />
                <span>Featured on Home Page</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full rounded bg-gold py-3 text-xs font-semibold uppercase tracking-[0.16em] text-obsidian hover:bg-gold-bright"
            >
              Save Timepiece
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: COLLECTIONS */}
      {activeTab === "collections" && (
        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-6">
            <h2 className="font-serif text-2xl text-cream">Collections</h2>
            {collections.map((col) => (
              <div
                key={col.id}
                className="flex items-center justify-between rounded-xl border border-gold/25 bg-surface p-5"
              >
                <div>
                  <p className="text-xs uppercase tracking-wider text-gold">
                    {col.subtitle}
                  </p>
                  <h3 className="font-serif text-xl text-cream">{col.name}</h3>
                  <p className="font-mono text-xs text-cream-muted">
                    Cover: {col.cover_image_url}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditingCollection({
                      id: col.id,
                      slug: col.slug,
                      name: col.name,
                      subtitle: col.subtitle ?? "",
                      description: col.description ?? "",
                      cover_image_url: col.cover_image_url ?? "",
                      cover_image_alt: col.cover_image_alt ?? "",
                      sort_order: col.sort_order,
                      published: col.published
                    })
                  }
                  className="rounded border border-gold/40 px-3 py-1 text-xs text-gold-bright"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleSaveCollection}
            className="space-y-4 rounded-xl border border-gold/30 bg-surface p-6 lg:col-span-6"
          >
            <h2 className="font-serif text-2xl text-cream">
              Save Collection &amp; Cover Backdrop Slot
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gold">
                  Collection Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingCollection.name}
                  onChange={(e) =>
                    setEditingCollection({
                      ...editingCollection,
                      name: e.target.value
                    })
                  }
                  className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3 py-2 text-sm text-cream"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gold">
                  Slug *
                </label>
                <input
                  type="text"
                  required
                  value={editingCollection.slug}
                  onChange={(e) =>
                    setEditingCollection({
                      ...editingCollection,
                      slug: e.target.value
                    })
                  }
                  className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3 py-2 text-sm text-cream"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-gold">
                Subtitle
              </label>
              <input
                type="text"
                value={editingCollection.subtitle}
                onChange={(e) =>
                  setEditingCollection({
                    ...editingCollection,
                    subtitle: e.target.value
                  })
                }
                className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3 py-2 text-sm text-cream"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-gold">
                Cover Image URL (Replaceable Backdrop Slot)
              </label>
              <input
                type="text"
                value={editingCollection.cover_image_url}
                onChange={(e) =>
                  setEditingCollection({
                    ...editingCollection,
                    cover_image_url: e.target.value
                  })
                }
                className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3 py-2 text-sm text-cream"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-gold">
                Description
              </label>
              <textarea
                rows={3}
                value={editingCollection.description}
                onChange={(e) =>
                  setEditingCollection({
                    ...editingCollection,
                    description: e.target.value
                  })
                }
                className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3 py-2 text-sm text-cream"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded bg-gold py-3 text-xs font-semibold uppercase tracking-[0.16em] text-obsidian hover:bg-gold-bright"
            >
              Save Collection
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: ENQUIRIES & PRIVATE VIEWING REQUESTS */}
      {activeTab === "enquiries" && (
        <div className="mt-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {["all", "new", "in_progress", "closed"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setEnquiryFilter(st)}
                  className={`rounded-full border px-4 py-1.5 text-xs uppercase tracking-wider ${
                    enquiryFilter === st
                      ? "border-transparent bg-gold font-semibold text-obsidian"
                      : "border-gold/25 bg-surface text-cream-secondary"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
              <input
                type="search"
                placeholder="Search client or product..."
                value={enquirySearch}
                onChange={(e) => setEnquirySearch(e.target.value)}
                className="rounded border border-gold/30 bg-obsidian px-3 py-1.5 text-xs text-cream"
              />
            </div>

            <button
              type="button"
              onClick={exportEnquiriesCsv}
              className="rounded border border-gold/50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gold-bright hover:bg-gold hover:text-obsidian"
            >
              Export to CSV
            </button>
          </div>

          {filteredEnquiries.length === 0 ? (
            <p className="rounded-xl border border-gold/20 bg-surface p-8 text-center text-sm text-cream-muted">
              No enquiries match your current filter.
            </p>
          ) : (
            <div className="space-y-4">
              {filteredEnquiries.map((eq) => (
                <div
                  key={eq.id}
                  className="rounded-xl border border-gold/25 bg-surface p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="rounded border border-gold/35 bg-obsidian px-2.5 py-0.5 text-[11px] uppercase tracking-wider text-gold-bright">
                        {eq.enquiry_type.replace("_", " ")}
                      </span>
                      {eq.product_name && (
                        <span className="ml-2 text-sm font-semibold text-gold">
                          {eq.product_name}
                        </span>
                      )}
                      <h3 className="mt-2 font-serif text-xl text-cream">
                        {eq.full_name} &mdash;{" "}
                        <a
                          href={`mailto:${eq.email}`}
                          className="text-gold-bright underline"
                        >
                          {eq.email}
                        </a>
                      </h3>
                      <p className="text-xs text-cream-muted">
                        Received: {new Date(eq.created_at).toLocaleString()}
                        {eq.phone ? ` • Tel: ${eq.phone}` : ""}
                        {eq.preferred_date ? ` • Date: ${eq.preferred_date}` : ""}
                      </p>
                    </div>

                    <select
                      value={eq.status}
                      onChange={(e) =>
                        handleUpdateEnquiry(
                          eq.id,
                          e.target.value as EnquiryRecord["status"],
                          eq.internal_notes
                        )
                      }
                      className="rounded border border-gold/40 bg-obsidian px-3 py-1.5 text-xs uppercase text-gold-bright"
                    >
                      <option value="new">New</option>
                      <option value="in_progress">In Progress</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <p className="mt-3 rounded bg-obsidian/70 p-3.5 text-sm text-cream-secondary">
                    {eq.message}
                  </p>

                  <div className="mt-3">
                    <label className="block text-[11px] uppercase tracking-wider text-gold">
                      Internal Concierge Notes
                    </label>
                    <div className="mt-1 flex gap-2">
                      <input
                        type="text"
                        defaultValue={eq.internal_notes}
                        onBlur={(e) =>
                          handleUpdateEnquiry(eq.id, eq.status, e.target.value)
                        }
                        placeholder="Add internal note and click outside to save..."
                        className="w-full rounded border border-gold/25 bg-obsidian px-3 py-1.5 text-xs text-cream"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: NEWSLETTER SUBSCRIBERS */}
      {activeTab === "subscribers" && (
        <div className="mt-8 rounded-xl border border-gold/25 bg-surface p-6">
          <h2 className="font-serif text-2xl text-cream">
            Private Journal Subscribers
          </h2>
          {subscribers.length === 0 ? (
            <p className="mt-4 text-sm text-cream-muted">
              No newsletter subscribers recorded yet.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gold/25 uppercase text-gold">
                  <tr>
                    <th className="py-2.5">Email</th>
                    <th className="py-2.5">Name</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5">Consent Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/10">
                  {subscribers.map((sub) => (
                    <tr key={sub.id}>
                      <td className="py-2.5 font-medium text-cream">{sub.email}</td>
                      <td className="py-2.5 text-cream-secondary">
                        {sub.full_name || "—"}
                      </td>
                      <td className="py-2.5 uppercase text-gold-bright">
                        {sub.status}
                      </td>
                      <td className="py-2.5 text-cream-muted">
                        {new Date(sub.consent_timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: BUSINESS SETTINGS & REPLACEABLE BACKDROP SLOTS */}
      {activeTab === "settings" && (
        <form
          onSubmit={handleSaveSettings}
          className="mt-8 space-y-6 rounded-xl border border-gold/30 bg-surface p-6 sm:p-8"
        >
          <h2 className="font-serif text-2xl text-cream">
            Business Details &amp; Replaceable Image Slots
          </h2>
          <p className="text-xs text-cream-secondary">
            Any contact field left blank remains completely hidden on the public website.
          </p>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs uppercase tracking-wider text-gold">
                Business Name *
              </label>
              <input
                type="text"
                required
                value={settings.business_name}
                onChange={(e) =>
                  setSettings({ ...settings, business_name: e.target.value })
                }
                className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3.5 py-2 text-sm text-cream"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gold">
                Contact Email (Hidden on public site if empty)
              </label>
              <input
                type="email"
                value={settings.contact_email ?? ""}
                onChange={(e) =>
                  setSettings({ ...settings, contact_email: e.target.value })
                }
                className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3.5 py-2 text-sm text-cream"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gold">
                Contact Phone (Hidden on public site if empty)
              </label>
              <input
                type="text"
                value={settings.contact_phone ?? ""}
                onChange={(e) =>
                  setSettings({ ...settings, contact_phone: e.target.value })
                }
                className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3.5 py-2 text-sm text-cream"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gold">
                Opening Hours (Hidden on public site if empty)
              </label>
              <input
                type="text"
                value={settings.opening_hours ?? ""}
                onChange={(e) =>
                  setSettings({ ...settings, opening_hours: e.target.value })
                }
                className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3.5 py-2 text-sm text-cream"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gold">
              Salon Address (Hidden on public site if empty)
            </label>
            <input
              type="text"
              value={settings.address ?? ""}
              onChange={(e) =>
                setSettings({ ...settings, address: e.target.value })
              }
              className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3.5 py-2 text-sm text-cream"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gold">
              Private Viewing Details (Hidden on public site if empty)
            </label>
            <textarea
              rows={2}
              value={settings.private_viewing_details ?? ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  private_viewing_details: e.target.value
                })
              }
              className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3.5 py-2 text-sm text-cream"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 border-t border-gold/20 pt-5 sm:grid-cols-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-gold">
                Hero Backdrop Image Slot
              </label>
              <input
                type="text"
                value={settings.hero_backdrop_url ?? ""}
                onChange={(e) =>
                  setSettings({ ...settings, hero_backdrop_url: e.target.value })
                }
                className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3 py-2 text-xs text-cream"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gold">
                Brand Story Backdrop Image Slot
              </label>
              <input
                type="text"
                value={settings.story_backdrop_url ?? ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    story_backdrop_url: e.target.value
                  })
                }
                className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3 py-2 text-xs text-cream"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gold">
                Open Graph Backdrop Slot
              </label>
              <input
                type="text"
                value={settings.og_image_url ?? ""}
                onChange={(e) =>
                  setSettings({ ...settings, og_image_url: e.target.value })
                }
                className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3 py-2 text-xs text-cream"
              />
            </div>
          </div>

          <button
            type="submit"
            className="rounded bg-gold px-7 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-obsidian hover:bg-gold-bright"
          >
            Save Settings
          </button>
        </form>
      )}
    </div>
  );
}
