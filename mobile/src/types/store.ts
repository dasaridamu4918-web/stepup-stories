export interface ProductSpec {
  key: string;
  value: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
}

export interface MobileCollection {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  cover_image_url: string;
  sort_order: number;
}

export interface MobileProduct {
  id: string;
  slug: string;
  /** Public product title (uses generic_name unless brand_verified === true) */
  name: string;
  /** Accurate generic descriptive name based strictly on visible watch details */
  generic_name: string;
  /** Optional brand name visible in photo — ONLY shown if brand_verified is true */
  brand_candidate: string | null;
  brand_verified: boolean;
  limited_edition_verified: boolean;
  collection_id: string;
  collection_slug: string;
  collection_name: string;
  short_description: string;
  description: string;
  price_amount: number;
  original_price_amount: number;
  savings_amount: number;
  discount_percent: number;
  price_currency: "INR";
  stock_quantity: number;
  availability_status: "available" | "out_of_stock" | "archived";
  featured: boolean;
  published: boolean;
  sort_order: number;
  specs: ProductSpec[];
  images: ProductImage[];
  created_at: string;
}

export interface CartItem {
  product: MobileProduct;
  quantity: number;
}

export interface IndianDeliveryAddress {
  full_name: string;
  phone: string; // 10-digit Indian mobile number
  email: string;
  address_line1: string; // Flat, House no., Building, Apartment
  address_line2: string; // Area, Street, Sector, Village
  landmark?: string;
  pincode: string; // 6-digit Indian PIN code
  city: string;
  state: string; // Indian State / Union Territory
}

export type PaymentMethod = "cod" | "razorpay";

export type PaymentStatus =
  | "pending_cod"
  | "pending_online"
  | "paid"
  | "paid_test_mode"
  | "failed";

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "packed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface OrderItemRecord {
  product_id: string;
  slug: string;
  name: string;
  collection_name: string;
  image_url: string;
  unit_price: number;
  original_unit_price: number;
  quantity: number;
  line_total: number;
  line_savings: number;
}

export interface OrderRecord {
  id: string;
  order_number: string;
  user_id: string | null;
  is_guest: boolean;
  items: OrderItemRecord[];
  shipping_address: IndianDeliveryAddress;
  total_mrp: number;
  total_savings: number;
  delivery_fee: number;
  total_payable: number;
  currency: "INR";
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  test_mode?: boolean;
  status: OrderStatus;
  tracking_code?: string | null;
  status_history: {
    status: OrderStatus;
    label: string;
    timestamp: string;
  }[];
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  display_name: string;
  phone?: string;
  role: "customer" | "admin";
  saved_address?: IndianDeliveryAddress | null;
}

export type PriceFilterKey =
  | "all"
  | "under_1500"
  | "1500_to_2500"
  | "2500_to_3500"
  | "above_3500";

export type SortOptionKey =
  | "featured"
  | "price_asc"
  | "price_desc"
  | "savings_desc";
