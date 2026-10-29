"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  AdminAuditLogRecord,
  CollectionRecord,
  CustomerSummaryRecord,
  EnquiryRecord,
  NewsletterSubscriberRecord,
  OrderPaymentStatus,
  OrderStatusStage,
  ProductRecord,
  ProductSpecItem,
  SiteSettingsRecord,
  StoreOrderRecord
} from "@/types/database";

const ORDER_STAGE_LABELS: Record<OrderStatusStage, string> = {
  new: "New",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refund_requested: "Refund Requested"
};

const PAYMENT_STATUS_LABELS: Record<OrderPaymentStatus, string> = {
  pending: "Pending Confirmation",
  paid: "Paid (Provider Confirmed)",
  failed: "Failed",
  refunded: "Refunded"
};

function formatInr(amount: number | null | undefined): string {
  if (typeof amount !== "number" || Number.isNaN(amount)) return "₹0";
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export function AdminDashboardClient({
  adminEmail,
  initialSettings,
  initialCollections,
  initialProducts,
  initialEnquiries,
  initialSubscribers,
  initialOrders = [],
  initialCustomers = [],
  initialAuditLogs = [],
  initialAlertStatus = {
    emailConfigured: false,
    customerNotificationConfigured: false
  }
}: {
  adminEmail: string;
  initialSettings: SiteSettingsRecord;
  initialCollections: CollectionRecord[];
  initialProducts: ProductRecord[];
  initialEnquiries: EnquiryRecord[];
  initialSubscribers: NewsletterSubscriberRecord[];
  initialOrders?: StoreOrderRecord[];
  initialCustomers?: CustomerSummaryRecord[];
  initialAuditLogs?: AdminAuditLogRecord[];
  initialAlertStatus?: {
    emailConfigured: boolean;
    customerNotificationConfigured: boolean;
  };
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "orders"
    | "customers"
    | "products"
    | "collections"
    | "enquiries"
    | "subscribers"
    | "audit"
    | "settings"
  >("overview");

  const [settings, setSettings] = useState<SiteSettingsRecord>(initialSettings);
  const [collections, setCollections] =
    useState<CollectionRecord[]>(initialCollections);
  const [products, setProducts] = useState<ProductRecord[]>(initialProducts);
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>(initialEnquiries);
  const [subscribers] =
    useState<NewsletterSubscriberRecord[]>(initialSubscribers);
  const [orders, setOrders] = useState<StoreOrderRecord[]>(initialOrders);
  const [customers, setCustomers] =
    useState<CustomerSummaryRecord[]>(initialCustomers);
  const [auditLogs, setAuditLogs] =
    useState<AdminAuditLogRecord[]>(initialAuditLogs);
  const [alertStatus, setAlertStatus] = useState(initialAlertStatus);

  const [toast, setToast] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newOrderLiveAlert, setNewOrderLiveAlert] = useState<string | null>(null);
  const knownOrderIdsRef = useRef<Set<string>>(
    new Set(initialOrders.map((o) => o.id))
  );
  const knownPaidOrderIdsRef = useRef<Set<string>>(
    new Set(
      initialOrders
        .filter((o) => o.payment_status === "paid")
        .map((o) => o.id)
    )
  );

  // Order Management Filters & Sorting
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStageFilter, setOrderStageFilter] = useState<string>("all");
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<string>("all");
  const [orderDateFilter, setOrderDateFilter] = useState<
    "all" | "today" | "7d" | "30d"
  >("all");
  const [orderSort, setOrderSort] = useState<"newest" | "oldest">("newest");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(
    initialOrders[0]?.id ?? null
  );
  const [showCsvExportModal, setShowCsvExportModal] = useState(false);

  // Order Edit Drafts (per order ID)
  const [orderEditDrafts, setOrderEditDrafts] = useState<
    Record<
      string,
      {
        order_status: OrderStatusStage;
        payment_status: OrderPaymentStatus;
        payment_reference: string;
        courier_name: string;
        tracking_number: string;
        note: string;
      }
    >
  >({});

  // Customer Search & Expand
  const [customerSearch, setCustomerSearch] = useState("");
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(
    null
  );

  // Enquiry Filter
  const [enquiryFilter, setEnquiryFilter] = useState<string>("all");
  const [enquirySearch, setEnquirySearch] = useState<string>("");

  // Product Search
  const [productSearch, setProductSearch] = useState("");

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
    original_price_amount: string;
    stock_count: string;
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
    original_price_amount: "",
    stock_count: "10",
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

  const refreshDashboard = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/catalog", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as {
          settings: SiteSettingsRecord;
          collections: CollectionRecord[];
          products: ProductRecord[];
          enquiries: EnquiryRecord[];
          orders?: StoreOrderRecord[];
          customers?: CustomerSummaryRecord[];
          auditLogs?: AdminAuditLogRecord[];
          alertServiceStatus?: {
            emailConfigured: boolean;
            customerNotificationConfigured: boolean;
          };
        };
        setSettings(data.settings);
        setCollections(data.collections);
        setProducts(data.products);
        setEnquiries(data.enquiries);
        if (data.orders) {
          const incomingNew = data.orders.filter(
            (o) => !knownOrderIdsRef.current.has(o.id)
          );
          const newlyPaid = data.orders.filter(
            (o) =>
              o.payment_status === "paid" &&
              !knownPaidOrderIdsRef.current.has(o.id)
          );
          if (newlyPaid.length > 0) {
            const latestPaid = newlyPaid[0]!;
            setNewOrderLiveAlert(
              `Verified Razorpay payment confirmed for Order ${latestPaid.order_number} (${formatInr(latestPaid.final_total)}) — Payment ID: ${latestPaid.razorpay_payment_id || latestPaid.payment_reference || "verified"}`
            );
          } else if (
            incomingNew.length > 0 &&
            knownOrderIdsRef.current.size > 0
          ) {
            const latest = incomingNew[0]!;
            setNewOrderLiveAlert(
              `New order ${latest.order_number} arrived from ${latest.customer_name} (${formatInr(latest.final_total)})`
            );
          }
          data.orders.forEach((o) => {
            knownOrderIdsRef.current.add(o.id);
            if (o.payment_status === "paid") {
              knownPaidOrderIdsRef.current.add(o.id);
            }
          });
          setOrders(data.orders);
        }
        if (data.customers) setCustomers(data.customers);
        if (data.auditLogs) setAuditLogs(data.auditLogs);
        if (data.alertServiceStatus) setAlertStatus(data.alertServiceStatus);
      }
    } catch {
      if (!silent) {
        setErrorBanner("Unable to refresh dashboard data. Please check your connection.");
      }
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  }, []);

  // Poll every 8 seconds and on window focus so approved admins see verified webhook payments & new orders automatically
  useEffect(() => {
    const interval = setInterval(() => {
      void refreshDashboard(true);
    }, 8000);
    const onFocus = () => {
      void refreshDashboard(true);
    };
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshDashboard]);

  // Dashboard Summary Metrics
  const summaryMetrics = useMemo(() => {
    const newUnprocessedCount = orders.filter(
      (o) => o.order_status === "new"
    ).length;
    const preparingOrShippedCount = orders.filter((o) =>
      ["confirmed", "processing", "shipped"].includes(o.order_status)
    ).length;
    const deliveredCount = orders.filter(
      (o) => o.order_status === "delivered"
    ).length;
    const cancelledOrRefundCount = orders.filter((o) =>
      ["cancelled", "refund_requested"].includes(o.order_status)
    ).length;
    const paidOrders = orders.filter((o) => o.payment_status === "paid");
    const paidRevenueTotal = paidOrders.reduce(
      (sum, o) => sum + (o.final_total || 0),
      0
    );
    const lowStockProducts = products.filter(
      (p) => (p.stock_count ?? 10) <= 5
    );

    return {
      newUnprocessedCount,
      preparingOrShippedCount,
      deliveredCount,
      cancelledOrRefundCount,
      paidOrdersCount: paidOrders.length,
      paidRevenueTotal,
      lowStockProducts
    };
  }, [orders, products]);

  // Filtered & Sorted Orders
  const filteredOrders = useMemo(() => {
    const now = Date.now();
    return orders
      .filter((order) => {
        if (
          orderStageFilter !== "all" &&
          order.order_status !== orderStageFilter
        ) {
          return false;
        }
        if (
          orderPaymentFilter !== "all" &&
          order.payment_status !== orderPaymentFilter
        ) {
          return false;
        }
        if (orderDateFilter !== "all") {
          const createdMs = new Date(order.created_at).getTime();
          const ageHours = (now - createdMs) / (1000 * 60 * 60);
          if (orderDateFilter === "today" && ageHours > 24) return false;
          if (orderDateFilter === "7d" && ageHours > 24 * 7) return false;
          if (orderDateFilter === "30d" && ageHours > 24 * 30) return false;
        }
        if (orderSearch.trim()) {
          const q = orderSearch.trim().toLowerCase();
          const matchNumber = order.order_number.toLowerCase().includes(q);
          const matchName = order.customer_name.toLowerCase().includes(q);
          const matchEmail = (order.customer_email ?? "")
            .toLowerCase()
            .includes(q);
          const matchPhone = order.customer_phone.toLowerCase().includes(q);
          return matchNumber || matchName || matchEmail || matchPhone;
        }
        return true;
      })
      .sort((a, b) => {
        const diff =
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return orderSort === "newest" ? diff : -diff;
      });
  }, [
    orders,
    orderStageFilter,
    orderPaymentFilter,
    orderDateFilter,
    orderSearch,
    orderSort
  ]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.trim().toLowerCase();
    return customers.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
    );
  }, [customers, customerSearch]);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const q = productSearch.trim().toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.collection?.name ?? "").toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const getOrderDraft = (order: StoreOrderRecord) => {
    return (
      orderEditDrafts[order.id] ?? {
        order_status: order.order_status,
        payment_status: order.payment_status,
        payment_reference: order.payment_reference ?? "",
        courier_name: order.courier_name ?? "",
        tracking_number: order.tracking_number ?? "",
        note: ""
      }
    );
  };

  const updateOrderDraft = (
    order: StoreOrderRecord,
    patch: Partial<ReturnType<typeof getOrderDraft>>
  ) => {
    const current = getOrderDraft(order);
    setOrderEditDrafts((prev) => ({
      ...prev,
      [order.id]: { ...current, ...patch }
    }));
  };

  const handleSaveOrderUpdate = async (order: StoreOrderRecord) => {
    setToast(null);
    setErrorBanner(null);
    const draft = getOrderDraft(order);

    const res = await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_order_status",
        payload: {
          id: order.id,
          order_status: draft.order_status,
          payment_status: draft.payment_status,
          payment_reference: draft.payment_reference.trim() || null,
          courier_name: draft.courier_name.trim() || null,
          tracking_number: draft.tracking_number.trim() || null,
          note: draft.note.trim() || undefined
        }
      })
    });

    const data = (await res.json()) as {
      ok?: boolean;
      error?: string;
      customerNotification?: { sent: boolean; channel: string };
    };

    if (!res.ok || !data.ok) {
      setErrorBanner(data.error || "Failed to update order status.");
      return;
    }

    const notifMsg = data.customerNotification?.sent
      ? `Customer notified via ${data.customerNotification.channel}.`
      : "Status recorded in audit history (customer notification skipped: service not configured or no contact).";

    setToast(
      `Order ${order.order_number} updated to ${ORDER_STAGE_LABELS[draft.order_status]}. ${notifMsg}`
    );
    await refreshDashboard();
  };

  const handleConfirmOrdersCsvExport = async () => {
    setShowCsvExportModal(false);
    setToast(null);

    await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "log_orders_csv_export",
        payload: {
          exported_count: filteredOrders.length,
          filters_summary: `stage=${orderStageFilter}, payment=${orderPaymentFilter}, date=${orderDateFilter}`
        }
      })
    });

    const headers = [
      "Order Number",
      "Order Date",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Delivery Address",
      "Items Summary",
      "Subtotal (INR)",
      "Discount (INR)",
      "Delivery Fee (INR)",
      "Final Total (INR)",
      "Payment Method",
      "Payment Status",
      "Provider Reference",
      "Order Status",
      "Courier",
      "Tracking Number"
    ];

    const rows = filteredOrders.map((o) => {
      const addr = `${o.delivery_address.address_line1}${o.delivery_address.address_line2 ? `, ${o.delivery_address.address_line2}` : ""}, ${o.delivery_address.city}, ${o.delivery_address.state} - ${o.delivery_address.pincode}`;
      const itemsSummary = o.items
        .map(
          (item) =>
            `${item.name} x${item.quantity}${item.selected_options ? ` (${item.selected_options})` : ""}`
        )
        .join("; ");
      return [
        o.order_number,
        o.created_at,
        o.customer_name,
        o.customer_email ?? "",
        o.customer_phone,
        addr,
        itemsSummary,
        String(o.item_subtotal),
        String(o.discount_total),
        String(o.delivery_fee),
        String(o.final_total),
        o.payment_method.toUpperCase(),
        o.payment_status,
        o.payment_reference ?? "",
        o.order_status,
        o.courier_name ?? "",
        o.tracking_number ?? ""
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stepup-stories-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setToast(
      `Exported ${filteredOrders.length} order(s) to CSV. Action recorded in security audit log.`
    );
    await refreshDashboard();
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);
    setErrorBanner(null);

    const numericPrice = editingProduct.price_amount
      ? Number(editingProduct.price_amount)
      : null;
    const numericOriginalPrice = editingProduct.original_price_amount
      ? Number(editingProduct.original_price_amount)
      : null;
    const numericStock =
      editingProduct.stock_count !== ""
        ? Math.max(0, Math.round(Number(editingProduct.stock_count)))
        : 10;

    const autoDisplayPrice =
      editingProduct.price_display.trim() ||
      (numericPrice ? formatInr(numericPrice) : "");

    const payload = {
      ...(editingProduct.id ? { id: editingProduct.id } : {}),
      slug: editingProduct.slug.trim().toLowerCase(),
      name: editingProduct.name.trim(),
      reference_code: editingProduct.reference_code.trim(),
      collection_id: editingProduct.collection_id || null,
      short_description: editingProduct.short_description.trim(),
      description: editingProduct.description.trim(),
      price_amount: numericPrice,
      original_price_amount: numericOriginalPrice,
      stock_count: numericStock,
      price_currency: editingProduct.price_currency || "INR",
      price_display: autoDisplayPrice,
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
      setErrorBanner(data.error || "Failed to save product.");
      return;
    }
    setToast(
      "Product saved and synchronized across the website and mobile app catalog."
    );
    await refreshDashboard();
  };

  const handleDeleteProduct = async (id: string) => {
    await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_product", payload: { id } })
    });
    setToast("Product deleted and logged in audit trail.");
    await refreshDashboard();
  };

  const handleDeleteProductImage = async (imageId: string) => {
    await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "delete_product_image",
        payload: { id: imageId }
      })
    });
    setToast("Product photo removed.");
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
      setErrorBanner(data.error || "Image upload failed.");
      return;
    }
    setToast("Product photograph uploaded and synced to catalog.");
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
      setErrorBanner(data.error || "Failed to save collection.");
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
      setErrorBanner(data.error || "Failed to update settings.");
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-gold/25 pb-6 md:flex-row md:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              STEPUP STORIES — Store &amp; Mobile App Command Center
            </span>
            <span className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gold-bright">
              Server Protected
            </span>
          </div>
          <h1 className="mt-1 font-serif text-2xl text-cream sm:text-3xl">
            Admin Dashboard
          </h1>
          <p className="mt-0.5 text-xs text-cream-muted">
            Approved Admin:{" "}
            <span className="font-medium text-gold-bright">{adminEmail}</span>{" "}
            &bull; Connected to Website &amp; Android/iOS App
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void refreshDashboard(false)}
            disabled={isRefreshing}
            className="rounded border border-gold/35 bg-surface px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-cream hover:border-gold disabled:opacity-50"
          >
            {isRefreshing ? "Syncing..." : "Refresh Data"}
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded border border-gold/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gold-bright hover:bg-gold/15"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Live New Order Alert Banner */}
      {newOrderLiveAlert && (
        <div
          role="alert"
          className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gold bg-gold/20 px-4 py-3 text-xs text-cream"
        >
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-gold-bright" />
            <strong className="uppercase tracking-wider text-gold-bright">
              New Order Alert:
            </strong>
            <span>{newOrderLiveAlert}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab("orders");
                setNewOrderLiveAlert(null);
              }}
              className="rounded bg-gold px-3 py-1 font-semibold uppercase tracking-wider text-obsidian"
            >
              View Order
            </button>
            <button
              type="button"
              onClick={() => setNewOrderLiveAlert(null)}
              className="text-cream-muted hover:text-cream"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Toast & Error Notifications */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="mt-5 flex items-center justify-between rounded-lg border border-gold bg-gold/15 px-4 py-3 text-xs text-gold-bright"
        >
          <span>{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-4 text-cream-muted hover:text-cream"
          >
            ✕
          </button>
        </div>
      )}

      {errorBanner && (
        <div
          role="alert"
          className="mt-5 flex items-center justify-between rounded-lg border border-burgundy-bright bg-burgundy/25 px-4 py-3 text-xs text-[#ffb3c1]"
        >
          <span>{errorBanner}</span>
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            className="ml-4 text-cream-muted hover:text-cream"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-gold/20 pb-4">
        {[
          { id: "overview", label: "Dashboard Home" },
          {
            id: "orders",
            label: `Orders (${orders.length})${summaryMetrics.newUnprocessedCount > 0 ? ` • ${summaryMetrics.newUnprocessedCount} New` : ""}`
          },
          { id: "customers", label: `Customers (${customers.length})` },
          { id: "products", label: `Products & Stock (${products.length})` },
          { id: "collections", label: `Collections (${collections.length})` },
          { id: "enquiries", label: `Enquiries (${enquiries.length})` },
          { id: "subscribers", label: `Subscribers (${subscribers.length})` },
          { id: "audit", label: `Audit Log (${auditLogs.length})` },
          { id: "settings", label: "Store Settings" }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`rounded px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
              activeTab === tab.id
                ? "bg-gold text-obsidian"
                : "border border-gold/25 bg-surface text-cream-secondary hover:border-gold"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* =====================================================================
          TAB 0: DASHBOARD HOME (OVERVIEW)
         ===================================================================== */}
      {activeTab === "overview" && (
        <div className="mt-8 space-y-8">
          {/* 5 Required Live Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Card 1: New & Unprocessed Orders */}
            <div className="rounded-xl border border-gold/30 bg-surface p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
                New &amp; Unprocessed
              </p>
              <p className="mt-2 font-serif text-3xl text-cream">
                {summaryMetrics.newUnprocessedCount}
              </p>
              <p className="mt-1 text-xs text-cream-muted">
                Orders awaiting confirmation
              </p>
            </div>

            {/* Card 2: Orders Being Prepared or Shipped */}
            <div className="rounded-xl border border-gold/25 bg-surface p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
                Prepared or Shipped
              </p>
              <p className="mt-2 font-serif text-3xl text-cream">
                {summaryMetrics.preparingOrShippedCount}
              </p>
              <p className="mt-1 text-xs text-cream-muted">
                Confirmed, Processing &amp; Shipped
              </p>
            </div>

            {/* Card 3: Delivered & Cancelled Orders */}
            <div className="rounded-xl border border-gold/25 bg-surface p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
                Delivered / Cancelled
              </p>
              <p className="mt-2 font-serif text-3xl text-cream">
                {summaryMetrics.deliveredCount}{" "}
                <span className="text-lg text-cream-muted">
                  / {summaryMetrics.cancelledOrRefundCount}
                </span>
              </p>
              <p className="mt-1 text-xs text-cream-muted">
                Completed vs Cancelled/Refund
              </p>
            </div>

            {/* Card 4: Revenue from Successfully Paid Orders */}
            <div className="rounded-xl border border-gold/35 bg-surface p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
                Verified Paid Revenue
              </p>
              <p className="mt-2 font-serif text-3xl text-gold-bright">
                {formatInr(summaryMetrics.paidRevenueTotal)}
              </p>
              <p className="mt-1 text-xs text-cream-muted">
                From {summaryMetrics.paidOrdersCount} confirmed paid order(s)
              </p>
            </div>

            {/* Card 5: Low-Stock Products */}
            <div className="rounded-xl border border-gold/25 bg-surface p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
                Low-Stock Products
              </p>
              <p className="mt-2 font-serif text-3xl text-cream">
                {summaryMetrics.lowStockProducts.length}
              </p>
              <p className="mt-1 text-xs text-cream-muted">
                Timepieces with ≤ 5 units left
              </p>
            </div>
          </div>

          {/* Alert Service Configuration Banner */}
          <div className="flex flex-col justify-between gap-3 rounded-xl border border-gold/20 bg-surface/80 p-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                Order &amp; Customer Notification Channels
              </p>
              <p className="mt-0.5 text-xs text-cream-secondary">
                In-dashboard live alerts are active for approved admins. External
                email/push alerts are sent only when service credentials are
                configured in server environment variables.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span
                className={`rounded-full border px-3 py-1 font-medium ${
                  alertStatus.emailConfigured
                    ? "border-gold/50 bg-gold/15 text-gold-bright"
                    : "border-gold/20 bg-obsidian text-cream-muted"
                }`}
              >
                Admin Email/Push:{" "}
                {alertStatus.emailConfigured
                  ? "Configured"
                  : "Not Configured (Safe Skip)"}
              </span>
              <span
                className={`rounded-full border px-3 py-1 font-medium ${
                  alertStatus.customerNotificationConfigured
                    ? "border-gold/50 bg-gold/15 text-gold-bright"
                    : "border-gold/20 bg-obsidian text-cream-muted"
                }`}
              >
                Customer Alerts:{" "}
                {alertStatus.customerNotificationConfigured
                  ? "Configured"
                  : "Not Configured (Safe Skip)"}
              </span>
            </div>
          </div>

          {/* Recent Orders & Low Stock Grid */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Recent Orders List */}
            <div className="rounded-xl border border-gold/25 bg-surface p-6 lg:col-span-8">
              <div className="flex items-center justify-between border-b border-gold/15 pb-4">
                <div>
                  <h2 className="font-serif text-xl text-cream">
                    Recent Store Orders
                  </h2>
                  <p className="text-xs text-cream-muted">
                    Real orders from the website and Android/iOS mobile app
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("orders")}
                  className="rounded border border-gold/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold-bright hover:bg-gold/15"
                >
                  Manage All Orders
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="font-serif text-lg text-cream">
                    No customer orders placed yet
                  </p>
                  <p className="mx-auto mt-1 max-w-md text-xs text-cream-muted">
                    Orders placed through the STEPUP STORIES mobile app or store
                    checkout will appear here automatically in real time. No
                    demo or fake orders are generated.
                  </p>
                </div>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-gold/20 uppercase text-gold">
                      <tr>
                        <th className="py-2.5 pr-3">Order #</th>
                        <th className="py-2.5 pr-3">Date</th>
                        <th className="py-2.5 pr-3">Customer</th>
                        <th className="py-2.5 pr-3">Total</th>
                        <th className="py-2.5 pr-3">Payment</th>
                        <th className="py-2.5 pr-3">Stage</th>
                        <th className="py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gold/10">
                      {orders.slice(0, 8).map((order) => (
                        <tr key={order.id} className="hover:bg-obsidian/40">
                          <td className="py-3 pr-3 font-mono font-semibold text-gold-bright">
                            {order.order_number}
                          </td>
                          <td className="py-3 pr-3 text-cream-muted">
                            {new Date(order.created_at).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })}
                          </td>
                          <td className="py-3 pr-3">
                            <p className="font-medium text-cream">
                              {order.customer_name}
                            </p>
                            <p className="text-[11px] text-cream-muted">
                              {order.customer_phone}
                            </p>
                          </td>
                          <td className="py-3 pr-3 font-semibold text-cream">
                            {formatInr(order.final_total)}
                          </td>
                          <td className="py-3 pr-3">
                            <span
                              className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                                order.payment_status === "paid"
                                  ? "bg-gold/20 text-gold-bright"
                                  : "bg-obsidian text-cream-secondary"
                              }`}
                            >
                              {order.payment_method.toUpperCase()} &bull;{" "}
                              {order.payment_status}
                            </span>
                          </td>
                          <td className="py-3 pr-3">
                            <span className="rounded border border-gold/30 bg-obsidian px-2 py-0.5 text-[10px] uppercase tracking-wider text-cream">
                              {ORDER_STAGE_LABELS[order.order_status]}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedOrderId(order.id);
                                setActiveTab("orders");
                              }}
                              className="text-gold-bright underline hover:text-cream"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Low-Stock Watchlist & Quick Inventory Status */}
            <div className="rounded-xl border border-gold/25 bg-surface p-6 lg:col-span-4">
              <div className="flex items-center justify-between border-b border-gold/15 pb-4">
                <div>
                  <h2 className="font-serif text-xl text-cream">
                    Inventory &amp; Low Stock
                  </h2>
                  <p className="text-xs text-cream-muted">
                    Synchronized with website &amp; mobile app
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("products")}
                  className="text-xs font-semibold uppercase tracking-wider text-gold-bright underline"
                >
                  Edit Stock
                </button>
              </div>

              {summaryMetrics.lowStockProducts.length === 0 ? (
                <div className="mt-4 rounded-lg border border-gold/15 bg-obsidian/60 p-4 text-xs text-cream-secondary">
                  All {products.length} catalog watches currently have healthy
                  stock (&gt; 5 units each).
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {summaryMetrics.lowStockProducts.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-burgundy-bright/40 bg-obsidian/80 p-3"
                    >
                      <div>
                        <p className="text-xs font-semibold text-cream">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-cream-muted">
                          {item.collection?.name ?? "Catalog"} &bull;{" "}
                          {formatInr(item.price_amount)}
                        </p>
                      </div>
                      <span className="rounded bg-burgundy/40 px-2.5 py-1 text-xs font-bold text-[#ff9ebb]">
                        {item.stock_count ?? 0} left
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 border-t border-gold/15 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                  Catalog Stock Snapshot
                </p>
                <div className="mt-3 max-h-60 space-y-2 overflow-y-auto pr-1">
                  {products.slice(0, 8).map((prod) => (
                    <div
                      key={prod.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="truncate pr-2 text-cream-secondary">
                        {prod.name}
                      </span>
                      <span className="shrink-0 font-mono text-gold-bright">
                        {prod.stock_count ?? 10} in stock
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 1: ORDER MANAGEMENT
         ===================================================================== */}
      {activeTab === "orders" && (
        <div className="mt-8 space-y-6">
          {/* Search, Filters, Sorting & CSV Export Controls */}
          <div className="rounded-xl border border-gold/25 bg-surface p-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
              <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {/* Search */}
                <div className="sm:col-span-2 lg:col-span-2">
                  <label className="block text-[11px] uppercase tracking-wider text-gold">
                    Search Order # or Customer
                  </label>
                  <input
                    type="search"
                    placeholder="Order #, customer name, phone, email..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3 py-2 text-xs text-cream"
                  />
                </div>

                {/* Order Status Filter */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-gold">
                    Order Stage
                  </label>
                  <select
                    value={orderStageFilter}
                    onChange={(e) => setOrderStageFilter(e.target.value)}
                    className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3 py-2 text-xs text-cream"
                  >
                    <option value="all">All Stages</option>
                    {Object.entries(ORDER_STAGE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Status Filter */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-gold">
                    Payment Status
                  </label>
                  <select
                    value={orderPaymentFilter}
                    onChange={(e) => setOrderPaymentFilter(e.target.value)}
                    className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3 py-2 text-xs text-cream"
                  >
                    <option value="all">All Payments</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid (Confirmed)</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                {/* Date & Sort */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-gold">
                      Date
                    </label>
                    <select
                      value={orderDateFilter}
                      onChange={(e) =>
                        setOrderDateFilter(
                          e.target.value as typeof orderDateFilter
                        )
                      }
                      className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-2 py-2 text-xs text-cream"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="7d">Last 7d</option>
                      <option value="30d">Last 30d</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-gold">
                      Sort
                    </label>
                    <select
                      value={orderSort}
                      onChange={(e) =>
                        setOrderSort(e.target.value as "newest" | "oldest")
                      }
                      className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-2 py-2 text-xs text-cream"
                    >
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Authorized CSV Export Button (opens confirmation modal) */}
              <button
                type="button"
                onClick={() => setShowCsvExportModal(true)}
                className="shrink-0 rounded border border-gold/50 bg-obsidian px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gold-bright hover:bg-gold hover:text-obsidian"
              >
                Export Orders CSV ({filteredOrders.length})
              </button>
            </div>
          </div>

          {/* CSV Export Confirmation Modal */}
          {showCsvExportModal && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="csv-export-modal-title"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            >
              <div className="w-full max-w-md rounded-xl border border-gold bg-surface p-6 shadow-2xl">
                <p className="text-xs font-semibold uppercase tracking-widest text-gold">
                  Security &amp; Privacy Confirmation
                </p>
                <h3
                  id="csv-export-modal-title"
                  className="mt-1 font-serif text-2xl text-cream"
                >
                  Confirm Order Data CSV Export
                </h3>
                <p className="mt-3 text-xs leading-relaxed text-cream-secondary">
                  You are about to export{" "}
                  <strong className="text-gold-bright">
                    {filteredOrders.length} order record(s)
                  </strong>{" "}
                  containing customer names, phone numbers, delivery addresses,
                  and safe payment references.
                </p>
                <p className="mt-2 text-xs text-cream-muted">
                  This export is restricted to approved admins and will be
                  recorded in the immutable security audit log under{" "}
                  <span className="text-gold-bright">{adminEmail}</span>.
                </p>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCsvExportModal(false)}
                    className="rounded border border-gold/30 px-4 py-2 text-xs uppercase tracking-wider text-cream-secondary hover:text-cream"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleConfirmOrdersCsvExport()}
                    className="rounded bg-gold px-5 py-2 text-xs font-semibold uppercase tracking-wider text-obsidian hover:bg-gold-bright"
                  >
                    Confirm &amp; Download CSV
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="rounded-xl border border-gold/20 bg-surface p-10 text-center">
              <p className="font-serif text-xl text-cream">
                No orders match the current filter
              </p>
              <p className="mt-1 text-xs text-cream-muted">
                When customers place orders on the website or mobile app, they
                appear here with full item breakdowns, payment status, and
                stage history.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                const draft = getOrderDraft(order);

                return (
                  <div
                    key={order.id}
                    className="rounded-xl border border-gold/25 bg-surface p-5 transition hover:border-gold/45"
                  >
                    {/* Order Summary Row */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-mono text-sm font-bold text-gold-bright">
                            {order.order_number}
                          </span>
                          <span className="rounded border border-gold/40 bg-obsidian px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-cream">
                            {ORDER_STAGE_LABELS[order.order_status]}
                          </span>
                          <span
                            className={`rounded px-2.5 py-0.5 text-[11px] font-semibold uppercase ${
                              order.payment_status === "paid"
                                ? "bg-gold/20 text-gold-bright"
                                : order.payment_status === "refunded"
                                  ? "bg-burgundy/30 text-[#ff9ebb]"
                                  : "bg-obsidian text-cream-secondary"
                            }`}
                          >
                            {order.payment_method.toUpperCase()} &bull;{" "}
                            {PAYMENT_STATUS_LABELS[order.payment_status]}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm font-medium text-cream">
                          {order.customer_name} &bull;{" "}
                          <span className="text-cream-secondary">
                            {order.customer_phone}
                          </span>
                          {order.customer_email
                            ? ` • ${order.customer_email}`
                            : ""}
                        </p>
                        <p className="text-xs text-cream-muted">
                          Placed:{" "}
                          {new Date(order.created_at).toLocaleString("en-IN")} &bull;{" "}
                          {order.items.reduce((s, i) => s + i.quantity, 0)} item(s)
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-wider text-cream-muted">
                            Final Total
                          </p>
                          <p className="font-serif text-2xl text-gold-bright">
                            {formatInr(order.final_total)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedOrderId(isExpanded ? null : order.id)
                          }
                          className="rounded border border-gold/40 bg-obsidian px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-gold-bright hover:bg-gold/15"
                        >
                          {isExpanded ? "Hide Details" : "Manage Order"}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Order Inspection & Stage Updater */}
                    {isExpanded && (
                      <div className="mt-6 grid grid-cols-1 gap-6 border-t border-gold/20 pt-6 lg:grid-cols-12">
                        {/* Left Column: Customer, Address, Purchased Items & Pricing Breakdown */}
                        <div className="space-y-5 lg:col-span-7">
                          {/* Customer & Delivery Address */}
                          <div className="grid grid-cols-1 gap-4 rounded-lg border border-gold/15 bg-obsidian/70 p-4 sm:grid-cols-2">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-gold">
                                Customer Details
                              </p>
                              <p className="mt-1 text-xs font-semibold text-cream">
                                {order.customer_name}
                              </p>
                              <p className="text-xs text-cream-secondary">
                                Phone: {order.customer_phone}
                              </p>
                              <p className="text-xs text-cream-secondary">
                                Email: {order.customer_email || "Not provided"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-gold">
                                Delivery Address (India)
                              </p>
                              <p className="mt-1 text-xs text-cream">
                                {order.delivery_address.address_line1}
                                {order.delivery_address.address_line2
                                  ? `, ${order.delivery_address.address_line2}`
                                  : ""}
                              </p>
                              <p className="text-xs text-cream-secondary">
                                {order.delivery_address.city},{" "}
                                {order.delivery_address.state} &ndash;{" "}
                                {order.delivery_address.pincode}
                              </p>
                              {order.delivery_address.landmark && (
                                <p className="text-xs text-cream-muted">
                                  Landmark: {order.delivery_address.landmark}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Purchased Products with Images, Options, Quantities */}
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                              Purchased Timepieces ({order.items.length})
                            </p>
                            <div className="mt-2 space-y-2.5">
                              {order.items.map((item, idx) => (
                                <div
                                  key={`${item.product_id}-${idx}`}
                                  className="flex items-center justify-between gap-3 rounded-lg border border-gold/15 bg-obsidian/60 p-3"
                                >
                                  <div className="flex items-center gap-3">
                                    {item.image_url ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={item.image_url}
                                        alt={item.name}
                                        className="h-12 w-12 rounded border border-gold/25 object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-12 w-12 items-center justify-center rounded border border-gold/25 bg-obsidian text-[10px] text-gold">
                                        WATCH
                                      </div>
                                    )}
                                    <div>
                                      <p className="text-xs font-semibold text-cream">
                                        {item.name}
                                      </p>
                                      <p className="text-[11px] text-cream-muted">
                                        Qty: {item.quantity} &times;{" "}
                                        {formatInr(item.unit_price)}
                                        {item.selected_options
                                          ? ` • Option: ${item.selected_options}`
                                          : ""}
                                      </p>
                                    </div>
                                  </div>
                                  <p className="font-mono text-xs font-semibold text-gold-bright">
                                    {formatInr(item.line_total)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Subtotal, Discount, Delivery Fee, Final Total & Payment Reference */}
                          <div className="rounded-lg border border-gold/15 bg-obsidian/70 p-4 text-xs">
                            <div className="flex justify-between py-1 text-cream-secondary">
                              <span>Item Subtotal</span>
                              <span>{formatInr(order.item_subtotal)}</span>
                            </div>
                            <div className="flex justify-between py-1 text-cream-secondary">
                              <span>Savings / Discount</span>
                              <span className="text-gold-bright">
                                &minus;{formatInr(order.discount_total)}
                              </span>
                            </div>
                            <div className="flex justify-between py-1 text-cream-secondary">
                              <span>Delivery Fee</span>
                              <span>
                                {order.delivery_fee === 0
                                  ? "Complimentary (₹0)"
                                  : formatInr(order.delivery_fee)}
                              </span>
                            </div>
                            <div className="mt-2 flex justify-between border-t border-gold/20 pt-2 text-sm font-bold text-cream">
                              <span>Final Total</span>
                              <span className="text-gold-bright">
                                {formatInr(order.final_total)}
                              </span>
                            </div>
                            <div className="mt-3 space-y-1 border-t border-gold/15 pt-2 text-[11px] text-cream-muted">
                              <p>
                                Payment Method:{" "}
                                <strong className="text-cream">
                                  {order.payment_method === "razorpay"
                                    ? "Razorpay Online"
                                    : "Cash on Delivery (COD)"}
                                </strong>{" "}
                                &bull; Status:{" "}
                                <strong className="text-gold-bright">
                                  {PAYMENT_STATUS_LABELS[order.payment_status]}
                                </strong>
                              </p>
                              <p className="font-mono">
                                Razorpay Order ID:{" "}
                                <span className="text-cream">
                                  {order.razorpay_order_id ||
                                    order.payment_reference?.split(" / ")[0] ||
                                    "—"}
                                </span>
                              </p>
                              <p className="font-mono">
                                Razorpay Payment ID:{" "}
                                <span className="text-gold-bright">
                                  {order.razorpay_payment_id ||
                                    order.payment_reference?.split(" / ")[1] ||
                                    "—"}
                                </span>
                              </p>
                              {order.razorpay_refund_id && (
                                <p className="font-mono">
                                  Razorpay Refund ID:{" "}
                                  <span className="text-[#ff9ebb]">
                                    {order.razorpay_refund_id}
                                  </span>
                                </p>
                              )}
                              <p className="font-mono">
                                Safe Provider Transaction Ref:{" "}
                                {order.payment_reference ||
                                  "None (No card/CVV data is ever stored)"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Right Column: Update Order Stage, Courier/Tracking & Status History */}
                        <div className="space-y-5 lg:col-span-5">
                          <div className="rounded-lg border border-gold/30 bg-obsidian/80 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                              Update Order Stage &amp; Tracking
                            </p>

                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div>
                                <label className="block text-[11px] uppercase tracking-wider text-cream-muted">
                                  Order Stage
                                </label>
                                <select
                                  value={draft.order_status}
                                  onChange={(e) =>
                                    updateOrderDraft(order, {
                                      order_status: e.target
                                        .value as OrderStatusStage
                                    })
                                  }
                                  className="mt-1 w-full rounded border border-gold/35 bg-surface px-3 py-2 text-xs text-cream"
                                >
                                  {Object.entries(ORDER_STAGE_LABELS).map(
                                    ([stageKey, label]) => (
                                      <option key={stageKey} value={stageKey}>
                                        {label}
                                      </option>
                                    )
                                  )}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[11px] uppercase tracking-wider text-cream-muted">
                                  Payment Status
                                </label>
                                <select
                                  value={draft.payment_status}
                                  onChange={(e) =>
                                    updateOrderDraft(order, {
                                      payment_status: e.target
                                        .value as OrderPaymentStatus
                                    })
                                  }
                                  className="mt-1 w-full rounded border border-gold/35 bg-surface px-3 py-2 text-xs text-cream"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="paid">
                                    Paid (Provider Confirmed)
                                  </option>
                                  <option value="failed">Failed</option>
                                  <option value="refunded">Refunded</option>
                                </select>
                              </div>
                            </div>

                            <div className="mt-3">
                              <label className="block text-[11px] uppercase tracking-wider text-cream-muted">
                                Safe Provider Transaction Reference ( Required if
                                marking Paid )
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. pay_Px92... or COD-DELIVERED-REF"
                                value={draft.payment_reference}
                                onChange={(e) =>
                                  updateOrderDraft(order, {
                                    payment_reference: e.target.value
                                  })
                                }
                                className="mt-1 w-full rounded border border-gold/30 bg-surface px-3 py-1.5 font-mono text-xs text-cream"
                              />
                            </div>

                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div>
                                <label className="block text-[11px] uppercase tracking-wider text-cream-muted">
                                  Courier Partner
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. BlueDart, Delhivery"
                                  value={draft.courier_name}
                                  onChange={(e) =>
                                    updateOrderDraft(order, {
                                      courier_name: e.target.value
                                    })
                                  }
                                  className="mt-1 w-full rounded border border-gold/30 bg-surface px-3 py-1.5 text-xs text-cream"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] uppercase tracking-wider text-cream-muted">
                                  Tracking Number / AWB
                                </label>
                                <input
                                  type="text"
                                  placeholder="Tracking number"
                                  value={draft.tracking_number}
                                  onChange={(e) =>
                                    updateOrderDraft(order, {
                                      tracking_number: e.target.value
                                    })
                                  }
                                  className="mt-1 w-full rounded border border-gold/30 bg-surface px-3 py-1.5 font-mono text-xs text-cream"
                                />
                              </div>
                            </div>

                            <div className="mt-3">
                              <label className="block text-[11px] uppercase tracking-wider text-cream-muted">
                                Status Change Note (Recorded in History)
                              </label>
                              <input
                                type="text"
                                placeholder="Optional note for this update..."
                                value={draft.note}
                                onChange={(e) =>
                                  updateOrderDraft(order, {
                                    note: e.target.value
                                  })
                                }
                                className="mt-1 w-full rounded border border-gold/30 bg-surface px-3 py-1.5 text-xs text-cream"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => void handleSaveOrderUpdate(order)}
                              className="mt-4 w-full rounded bg-gold py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-obsidian hover:bg-gold-bright"
                            >
                              Save Order Update &amp; Record Audit Trail
                            </button>
                          </div>

                          {/* Status-Change History */}
                          <div className="rounded-lg border border-gold/20 bg-obsidian/60 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                              Status-Change History ({order.status_history.length})
                            </p>
                            <div className="mt-2.5 max-h-48 space-y-2.5 overflow-y-auto pr-1">
                              {order.status_history.map((entry, idx) => (
                                <div
                                  key={`${entry.changed_at}-${idx}`}
                                  className="rounded border border-gold/15 bg-surface/60 p-2.5 text-xs"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold uppercase text-gold-bright">
                                      {ORDER_STAGE_LABELS[entry.to_status] ??
                                        entry.to_status}
                                    </span>
                                    <span className="text-[11px] text-cream-muted">
                                      {new Date(entry.changed_at).toLocaleString(
                                        "en-IN"
                                      )}
                                    </span>
                                  </div>
                                  <p className="mt-0.5 text-[11px] text-cream-secondary">
                                    Changed by:{" "}
                                    <strong className="text-cream">
                                      {entry.changed_by}
                                    </strong>
                                  </p>
                                  {entry.note && (
                                    <p className="mt-1 text-[11px] text-cream-muted">
                                      {entry.note}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 2: CUSTOMERS LIST & ORDER HISTORY
         ===================================================================== */}
      {activeTab === "customers" && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-col justify-between gap-4 rounded-xl border border-gold/25 bg-surface p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-serif text-2xl text-cream">
                Authorized Customer Directory
              </h2>
              <p className="text-xs text-cream-muted">
                Displays only fulfillment-essential details, order counts, and
                verified purchase totals. Restricted to approved admins.
              </p>
            </div>
            <input
              type="search"
              placeholder="Search customer name, phone, email, city..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full rounded border border-gold/30 bg-obsidian px-3.5 py-2 text-xs text-cream sm:w-72"
            />
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="rounded-xl border border-gold/20 bg-surface p-10 text-center">
              <p className="font-serif text-xl text-cream">
                No customer purchase records yet
              </p>
              <p className="mt-1 text-xs text-cream-muted">
                Customer profiles and purchase totals are built automatically
                from real orders. No synthetic customer data is invented.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCustomers.map((cust) => {
                const isExpanded = expandedCustomerId === cust.customer_key;
                const totalOrderValue = cust.orders.reduce(
                  (sum, ord) => sum + ord.final_total,
                  0
                );
                return (
                  <div
                    key={cust.customer_key}
                    className="rounded-xl border border-gold/25 bg-surface p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="font-serif text-xl text-cream">
                          {cust.full_name}
                        </h3>
                        <p className="text-xs text-cream-secondary">
                          Phone: {cust.phone}
                          {cust.email ? ` • Email: ${cust.email}` : ""} &bull;{" "}
                          {cust.city}, {cust.state}
                        </p>
                        <p className="mt-0.5 text-[11px] text-cream-muted">
                          Last order:{" "}
                          {new Date(cust.last_order_at).toLocaleDateString(
                            "en-IN"
                          )}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-6">
                        <div className="text-right">
                          <p className="text-[11px] uppercase tracking-wider text-cream-muted">
                            Total Orders
                          </p>
                          <p className="font-serif text-xl text-cream">
                            {cust.total_orders}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] uppercase tracking-wider text-cream-muted">
                            Verified Paid Purchases
                          </p>
                          <p className="font-serif text-xl text-gold-bright">
                            {formatInr(cust.total_paid_spent)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] uppercase tracking-wider text-cream-muted">
                            Total Order Value
                          </p>
                          <p className="font-serif text-xl text-cream">
                            {formatInr(totalOrderValue)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedCustomerId(
                              isExpanded ? null : cust.customer_key
                            )
                          }
                          className="rounded border border-gold/40 bg-obsidian px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold-bright hover:bg-gold/15"
                        >
                          {isExpanded ? "Hide History" : "Order History"}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 border-t border-gold/15 pt-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                          Customer Order History ({cust.orders.length})
                        </p>
                        <div className="mt-2 space-y-2">
                          {cust.orders.map((ord) => (
                            <div
                              key={ord.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded border border-gold/15 bg-obsidian/60 px-3.5 py-2.5 text-xs"
                            >
                              <div>
                                <span className="font-mono font-semibold text-gold-bright">
                                  {ord.order_number}
                                </span>{" "}
                                &bull;{" "}
                                <span className="text-cream">
                                  Payment: {PAYMENT_STATUS_LABELS[ord.payment_status]}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-cream-muted">
                                  {new Date(ord.created_at).toLocaleDateString("en-IN")}
                                </span>
                                <span className="font-semibold text-cream">
                                  {formatInr(ord.final_total)}
                                </span>
                                <span className="rounded border border-gold/30 px-2 py-0.5 text-[10px] uppercase text-gold-bright">
                                  {ORDER_STAGE_LABELS[ord.order_status]}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExpandedOrderId(ord.id);
                                    setActiveTab("orders");
                                  }}
                                  className="text-gold-bright underline"
                                >
                                  Open
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 3: PRODUCTS, PRICES, STOCK & PHOTO MANAGEMENT
         ===================================================================== */}
      {activeTab === "products" && (
        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Product List */}
          <div className="space-y-4 lg:col-span-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-2xl text-cream">
                Catalog Timepieces ({filteredProducts.length})
              </h2>
              <input
                type="search"
                placeholder="Search watches..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="rounded border border-gold/30 bg-obsidian px-3 py-1.5 text-xs text-cream"
              />
            </div>

            {filteredProducts.map((prod) => {
              const salePrice = prod.price_amount ?? 0;
              const origPrice = prod.original_price_amount ?? salePrice;
              const savings = Math.max(0, origPrice - salePrice);
              const stockCount = prod.stock_count ?? 10;

              return (
                <div
                  key={prod.id}
                  className="rounded-xl border border-gold/25 bg-surface p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs uppercase tracking-wider text-gold">
                          {prod.collection?.name ?? "Unassigned"} &bull;{" "}
                          {prod.published ? "Published" : "Draft"}
                          {prod.featured ? " • Featured" : ""}
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            stockCount <= 5
                              ? "bg-burgundy/40 text-[#ff9ebb]"
                              : "bg-gold/15 text-gold-bright"
                          }`}
                        >
                          Stock: {stockCount}
                        </span>
                      </div>
                      <h3 className="mt-1 font-serif text-xl text-cream">
                        {prod.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-cream-secondary">
                        Sale:{" "}
                        <strong className="text-gold-bright">
                          {formatInr(salePrice)}
                        </strong>
                        {origPrice > salePrice && (
                          <>
                            {" "}
                            &bull; Original:{" "}
                            <span className="line-through text-cream-muted">
                              {formatInr(origPrice)}
                            </span>{" "}
                            (Save {formatInr(savings)})
                          </>
                        )}
                      </p>
                      <p className="font-mono text-[11px] text-cream-muted">
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
                            original_price_amount: prod.original_price_amount
                              ? String(prod.original_price_amount)
                              : "",
                            stock_count: String(prod.stock_count ?? 10),
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
                        onClick={() => void handleDeleteProduct(prod.id)}
                        className="rounded border border-burgundy-bright/50 px-3 py-1 text-xs text-[#ff8a9e] hover:bg-burgundy/25"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Product Photo Gallery & Upload */}
                  <div className="mt-4 border-t border-gold/15 pt-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                        Photos ({prod.images.length})
                      </p>
                      <label className="cursor-pointer rounded border border-gold/40 bg-obsidian px-3 py-1 text-xs text-gold-bright hover:border-gold-bright">
                        <span>+ Upload Watch Photo</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              void handleUploadProductPhoto(
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

                    {prod.images.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {prod.images.map((img) => (
                          <div
                            key={img.id}
                            className="group relative h-14 w-14 overflow-hidden rounded border border-gold/25 bg-obsidian"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.url}
                              alt={img.alt_text}
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              title="Remove photo"
                              onClick={() => void handleDeleteProductImage(img.id)}
                              className="absolute right-0.5 top-0.5 hidden rounded bg-black/80 px-1 text-[10px] text-[#ff9ebb] group-hover:block"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Create / Edit Product Form */}
          <form
            onSubmit={handleSaveProduct}
            className="space-y-4 rounded-xl border border-gold/30 bg-surface p-6 lg:col-span-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl text-cream">
                {editingProduct.id ? "Edit Timepiece" : "Add New Timepiece"}
              </h2>
              {editingProduct.id && (
                <button
                  type="button"
                  onClick={() =>
                    setEditingProduct({
                      slug: "",
                      name: "",
                      reference_code: "",
                      collection_id: collections[0]?.id ?? "",
                      short_description: "",
                      description: "",
                      price_amount: "",
                      original_price_amount: "",
                      stock_count: "10",
                      price_currency: "INR",
                      price_display: "",
                      availability_status: "available",
                      featured: false,
                      published: true,
                      sort_order: 1,
                      specs: []
                    })
                  }
                  className="text-xs text-gold-bright underline"
                >
                  + New Product Form
                </button>
              )}
            </div>

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
                  placeholder="modern-minimal-watch"
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

            {/* Sale Price, Original Price & Stock Count */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gold">
                  Sale Price (₹ INR)
                </label>
                <input
                  type="number"
                  min={0}
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
                  Original Price (₹ INR)
                </label>
                <input
                  type="number"
                  min={0}
                  value={editingProduct.original_price_amount}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      original_price_amount: e.target.value
                    })
                  }
                  className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3 py-2 text-sm text-cream"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gold">
                  Stock Count
                </label>
                <input
                  type="number"
                  min={0}
                  value={editingProduct.stock_count}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      stock_count: e.target.value
                    })
                  }
                  className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3 py-2 text-sm text-cream"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gold">
                  Formatted Price Display (Auto-filled if blank)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ₹1,499"
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
                  Availability Status
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
                  <option value="private_viewing_only">
                    Private Viewing Only
                  </option>
                  <option value="waitlist">Waitlist</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-gold">
                Short Summary (Visible Details Only)
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
                  Specifications (Visible Details Only)
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
                      placeholder="Label (e.g. Dial)"
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
                      placeholder="Value (e.g. Black dial with gold-tone markers)"
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
                <span>Published on Website &amp; Mobile App</span>
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
                <span>Featured on Home Screen</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full rounded bg-gold py-3 text-xs font-semibold uppercase tracking-[0.16em] text-obsidian hover:bg-gold-bright"
            >
              Save &amp; Sync Product
            </button>
          </form>
        </div>
      )}

      {/* =====================================================================
          TAB 4: COLLECTIONS
         ===================================================================== */}
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

      {/* =====================================================================
          TAB 5: ENQUIRIES & PRIVATE VIEWING REQUESTS
         ===================================================================== */}
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
              Export Enquiries CSV
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
                        void handleUpdateEnquiry(
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
                          void handleUpdateEnquiry(
                            eq.id,
                            eq.status,
                            e.target.value
                          )
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

      {/* =====================================================================
          TAB 6: NEWSLETTER SUBSCRIBERS
         ===================================================================== */}
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
                      <td className="py-2.5 font-medium text-cream">
                        {sub.email}
                      </td>
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

      {/* =====================================================================
          TAB 7: IMMUTABLE SECURITY AUDIT LOG
         ===================================================================== */}
      {activeTab === "audit" && (
        <div className="mt-8 rounded-xl border border-gold/25 bg-surface p-6">
          <div className="border-b border-gold/15 pb-4">
            <h2 className="font-serif text-2xl text-cream">
              Security &amp; Sensitive Actions Audit Trail
            </h2>
            <p className="mt-1 text-xs text-cream-muted">
              Immutable server-side record of order status updates, payment
              confirmations, refunds, CSV exports, and product price/stock edits.
            </p>
          </div>

          {auditLogs.length === 0 ? (
            <p className="mt-6 text-sm text-cream-muted">
              No sensitive admin actions have been logged in this session yet.
              Updating an order status, editing product prices/stock, or
              exporting CSV data will automatically record an entry here.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gold/25 uppercase text-gold">
                  <tr>
                    <th className="py-2.5 pr-4">Timestamp</th>
                    <th className="py-2.5 pr-4">Admin Actor</th>
                    <th className="py-2.5 pr-4">Action Type</th>
                    <th className="py-2.5 pr-4">Target</th>
                    <th className="py-2.5">Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/10">
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="py-3 pr-4 whitespace-nowrap text-cream-muted">
                        {new Date(log.created_at).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 pr-4 font-medium text-gold-bright">
                        {log.actor_email}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="rounded border border-gold/30 bg-obsidian px-2 py-0.5 font-mono text-[10px] uppercase text-cream">
                          {log.action_type}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-mono text-cream-secondary">
                        {log.target_type}:{log.target_id}
                      </td>
                      <td className="py-3 text-cream">{log.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 8: BUSINESS SETTINGS & REPLACEABLE BACKDROP SLOTS
         ===================================================================== */}
      {activeTab === "settings" && (
        <form
          onSubmit={handleSaveSettings}
          className="mt-8 space-y-6 rounded-xl border border-gold/30 bg-surface p-6 sm:p-8"
        >
          <h2 className="font-serif text-2xl text-cream">
            Business Details &amp; Replaceable Image Slots
          </h2>
          <p className="text-xs text-cream-secondary">
            Any contact field left blank remains completely hidden on the public
            website.
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
