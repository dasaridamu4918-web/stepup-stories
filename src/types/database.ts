export type AvailabilityStatus =
  | "available"
  | "private_viewing_only"
  | "waitlist"
  | "archived";

export interface ProductSpecItem {
  key: string;
  value: string;
}

export interface ProductImageRecord {
  id: string;
  product_id: string;
  storage_path: string | null;
  url: string;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
  width: number | null;
  height: number | null;
}

export interface CollectionRecord {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  sort_order: number;
  published: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductRecord {
  id: string;
  slug: string;
  name: string;
  reference_code: string | null;
  collection_id: string | null;
  collection?: CollectionRecord | null;
  short_description: string | null;
  description: string | null;
  price_amount: number | null;
  original_price_amount?: number | null;
  discount_percent?: number | null;
  savings_label?: string | null;
  price_currency: string | null;
  price_display: string | null;
  availability_status: AvailabilityStatus;
  stock_count?: number;
  featured: boolean;
  published: boolean;
  sort_order: number;
  specs: ProductSpecItem[];
  images: ProductImageRecord[];
  created_at: string;
  updated_at?: string;
}

export type OrderStatusStage =
  | "new"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refund_requested";

export type OrderPaymentMethod = "cod" | "razorpay";

export type OrderPaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface OrderStatusHistoryEntry {
  from_status: OrderStatusStage | null;
  to_status: OrderStatusStage;
  changed_by: string;
  changed_at: string;
  note?: string | null;
}

export interface StoreOrderItem {
  product_id: string;
  slug: string;
  name: string;
  collection_name: string | null;
  selected_options: string | null;
  quantity: number;
  unit_price: number;
  original_unit_price: number;
  line_total: number;
  image_url: string | null;
}

export interface OrderDeliveryAddress {
  full_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  pincode: string;
}

export interface StoreOrderRecord {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: OrderDeliveryAddress;
  items: StoreOrderItem[];
  item_subtotal: number;
  discount_total: number;
  delivery_fee: number;
  final_total: number;
  currency: "INR";
  payment_method: OrderPaymentMethod;
  payment_status: OrderPaymentStatus;
  /** Safe provider reference only (e.g. Razorpay order_id / payment_id) — never card numbers or secrets */
  payment_reference: string | null;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  razorpay_refund_id?: string | null;
  product_name?: string | null;
  amount?: number;
  order_status: OrderStatusStage;
  courier_name: string | null;
  tracking_number: string | null;
  status_history: OrderStatusHistoryEntry[];
  source: "website" | "mobile_app";
  created_at: string;
  updated_at: string;
}

export interface CustomerSummaryRecord {
  customer_key: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  total_orders: number;
  paid_orders_count: number;
  total_paid_spent: number;
  last_order_at: string;
  orders: {
    id: string;
    order_number: string;
    created_at: string;
    final_total: number;
    order_status: OrderStatusStage;
    payment_status: OrderPaymentStatus;
  }[];
}

export type AdminAuditActionType =
  | "order_status_updated"
  | "order_refund_updated"
  | "orders_csv_exported"
  | "product_created"
  | "product_price_or_stock_updated"
  | "product_deleted"
  | "collection_updated"
  | "settings_updated";

export interface AdminAuditLogRecord {
  id: string;
  action_type: AdminAuditActionType;
  actor_email: string;
  target_type: "order" | "product" | "collection" | "orders_export" | "settings";
  target_id: string;
  summary: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type EnquiryType = "product_enquiry" | "private_viewing" | "general_concierge";
export type EnquiryStatus = "new" | "in_progress" | "closed";

export interface EnquiryRecord {
  id: string;
  enquiry_type: EnquiryType;
  product_id: string | null;
  product_name: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  preferred_contact: string | null;
  preferred_date: string | null;
  preferred_location: string | null;
  message: string;
  status: EnquiryStatus;
  internal_notes: string;
  created_at: string;
  updated_at: string;
}

export interface NewsletterSubscriberRecord {
  id: string;
  email: string;
  full_name: string | null;
  status: "active" | "unsubscribed";
  consent_timestamp: string;
  unsubscribed_at: string | null;
  unsubscribe_token: string;
  source: string | null;
  created_at: string;
}

export interface SocialLinkItem {
  label: string;
  url: string;
}

export interface SiteSettingsRecord {
  id: number;
  business_name: string;
  tagline: string | null;
  hero_headline: string | null;
  hero_subheadline: string | null;
  hero_backdrop_url: string | null;
  story_backdrop_url: string | null;
  og_image_url: string | null;
  about_story_title: string | null;
  about_story_body: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  opening_hours: string | null;
  private_viewing_details: string | null;
  footer_text: string | null;
  social_links: SocialLinkItem[];
  updated_at?: string;
}
