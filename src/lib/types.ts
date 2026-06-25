export type AdminRole = 'super_admin' | 'admin';

export interface Admin {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: AdminRole;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  password_hash: string;
  avatar_url?: string;
  address?: string;
  city?: string;
  province?: string;
  zip_code?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  category_id?: string;
  price: number;
  compare_price?: number;
  cost_price?: number;
  sku?: string;
  barcode?: string;
  stock_quantity: number;
  low_stock_threshold: number;
  is_featured: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  is_active: boolean;
  weight?: number;
  dimensions?: string;
  meta_title?: string;
  meta_description?: string;
  tags?: string[];
  delivery_override?: number;
  average_rating: number;
  review_count: number;
  sold_count: number;
  created_at: string;
  updated_at: string;
  category?: Category;
  images?: ProductImage[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export type OrderStatus = 'pending' | 'payment_verification_pending' | 'accepted' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'verification_pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'cod' | 'easypaisa';

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_province?: string;
  shipping_zip?: string;
  billing_address?: string;
  billing_city?: string;
  billing_province?: string;
  billing_zip?: string;
  subtotal: number;
  delivery_charges: number;
  discount: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  notes?: string;
  tracking_number?: string;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  payment_proof?: PaymentProof[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  product_name: string;
  product_image?: string;
  price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  customer_id: string;
  order_id?: string;
  rating: number;
  title?: string;
  comment?: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface Feedback {
  id: string;
  customer_id?: string;
  customer_name: string;
  customer_email?: string;
  subject: string;
  message: string;
  rating?: number;
  is_read: boolean;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount?: number;
  max_discount?: number;
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
  starts_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface Banner {
  id: string;
  title?: string;
  subtitle?: string;
  image_url: string;
  link_url?: string;
  link_text?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentProof {
  id: string;
  order_id: string;
  image_url: string;
  account_name: string;
  account_number: string;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
}

export interface Setting {
  id: string;
  key: string;
  value: any;
  updated_at: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string;
  data?: any;
  is_read: boolean;
  created_at: string;
}

export interface CartItem {
  id?: string;
  product_id: string;
  quantity: number;
  product?: Product;
}

export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular';

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sort?: SortOption;
  search?: string;
  page?: number;
  limit?: number;
}
