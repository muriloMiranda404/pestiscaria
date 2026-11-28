export type Status = "draft" | "published" | "archived";
export type NamedPrice = { name: string; price_cents: number };
export type Photo = { src: string; alt: string; illustrative: boolean };
export interface Base { id: string; status: Status; position: number }
export interface Category extends Base { name: string; slug: string }
export interface Product extends Base {
  name: string; slug: string; category_id: string; description: string;
  image: Photo | null; images: Photo[]; price_cents: number | null;
  variants: NamedPrice[]; addons: NamedPrice[]; ingredients: string; allergens: string;
  serves: string; available: boolean; featured: boolean;
}
export interface EventEntry extends Base {
  title: string; slug: string; description: string; image: Photo | null;
  starts_at: string; ends_at: string | null; artist: string; fee_cents: number | null;
  notes: string; featured: boolean;
}
export interface Promotion extends Base {
  title: string; product_id: string; price_cents: number; starts_at: string; ends_at: string;
  image: Photo | null; featured: boolean;
}
export interface GalleryEntry extends Base { image: Photo; category: string; instagram_url: string }
export interface Hours { day: number; opens: string; closes: string }
export interface SpecialHours { date: string; label: string; opens: string; closes: string }
export interface Settings {
  name: string; logo: string; primary_color: string; accent_color: string; phone: string;
  whatsapp: string; whatsapp_confirmed: boolean; instagram: string; street: string; district: string;
  city: string; state: string; postal_code: string; reference: string; maps_url: string;
  about: string; announcement: string; announcement_until: string | null; hours: Hours[];
  special_hours: SpecialHours[]; seo_title: string; seo_description: string; cnpj: string;
  show_cnpj: boolean; orders_enabled: boolean; reservations_enabled: boolean; analytics_enabled: boolean;
  pickup_enabled: boolean; delivery_enabled: boolean; maintenance: boolean;
}
export type MetricKind = "menu" | "product" | "category" | "contact" | "directions" | "qr" | "reservation";
export interface Metric { kind: MetricKind; subject: string; campaign: string; created_at: string }
export type ReservationStatus = "pending" | "confirmed" | "declined" | "cancelled" | "completed";
export interface Reservation { id: string; date: string; time: string; people: number; name: string; phone: string; notes: string; status: ReservationStatus; created_at: string }
export interface QrEntry { id: string; label: string; table_code: string; template: string; created_at: string }
export interface Catalog { settings: Settings; categories: Category[]; products: Product[]; events: EventEntry[]; promotions: Promotion[]; gallery: GalleryEntry[]; demo: boolean }
export type EntityMap = {categories: Category; products: Product; events: EventEntry; promotions: Promotion; gallery: GalleryEntry};
export type Entity = keyof EntityMap;
