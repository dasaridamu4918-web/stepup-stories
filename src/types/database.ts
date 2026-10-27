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
  price_currency: string | null;
  price_display: string | null;
  availability_status: AvailabilityStatus;
  featured: boolean;
  published: boolean;
  sort_order: number;
  specs: ProductSpecItem[];
  images: ProductImageRecord[];
  created_at: string;
  updated_at?: string;
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
