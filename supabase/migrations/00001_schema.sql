-- Momen Store Complete Schema
-- Migration 00001: Initial Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== TABLES ====================

-- Admins
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  address TEXT,
  city TEXT,
  province TEXT,
  zip_code TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  price DECIMAL(12,2) NOT NULL,
  compare_price DECIMAL(12,2),
  cost_price DECIMAL(12,2),
  sku TEXT UNIQUE,
  barcode TEXT,
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  is_featured BOOLEAN DEFAULT false,
  is_best_seller BOOLEAN DEFAULT false,
  is_new_arrival BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  weight DECIMAL(10,2),
  dimensions TEXT,
  meta_title TEXT,
  meta_description TEXT,
  tags TEXT[],
  average_rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  sold_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Images
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  is_primary BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_province TEXT,
  shipping_zip TEXT,
  billing_address TEXT,
  billing_city TEXT,
  billing_province TEXT,
  billing_zip TEXT,
  subtotal DECIMAL(12,2) NOT NULL,
  delivery_charges DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cod', 'easypaisa')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'verification_pending', 'paid', 'failed', 'refunded')),
  order_status TEXT DEFAULT 'pending' CHECK (order_status IN ('pending', 'payment_verification_pending', 'accepted', 'shipped', 'delivered', 'cancelled')),
  notes TEXT,
  tracking_number TEXT,
  is_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  price DECIMAL(12,2) NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, customer_id)
);

-- Feedback
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coupons
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(12,2),
  max_discount DECIMAL(12,2),
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Banners
CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  link_text TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Proofs
CREATE TABLE payment_proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  account_name TEXT DEFAULT 'Noor Hussain Shabbir',
  account_number TEXT DEFAULT '03454751112',
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES admins(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wishlist
CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);

-- Cart (for logged-in users sync)
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);

-- ==================== INDEXES ====================

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_best_seller ON products(is_best_seller) WHERE is_best_seller = true;
CREATE INDEX idx_products_new_arrival ON products(is_new_arrival) WHERE is_new_arrival = true;
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_rating ON products(average_rating DESC);
CREATE INDEX idx_products_created ON products(created_at DESC);

CREATE INDEX idx_product_images_primary ON product_images(product_id, is_primary) WHERE is_primary = true;
CREATE INDEX idx_product_images_product ON product_images(product_id);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

CREATE INDEX idx_order_items_order ON order_items(order_id);

CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_approved ON reviews(is_approved) WHERE is_approved = true;

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_active ON categories(is_active) WHERE is_active = true;

CREATE INDEX idx_customers_email ON customers(email);

CREATE INDEX idx_banners_active ON banners(is_active) WHERE is_active = true;
CREATE INDEX idx_banners_order ON banners(sort_order);

CREATE INDEX idx_payment_proofs_order ON payment_proofs(order_id);

CREATE INDEX idx_wishlists_customer ON wishlists(customer_id);

CREATE INDEX idx_carts_customer ON carts(customer_id);

CREATE INDEX idx_notifications_read ON notifications(is_read) WHERE is_read = false;

CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ==================== ROW LEVEL SECURITY ====================

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins can read all" ON admins FOR SELECT USING (true);
CREATE POLICY "Admins can insert" ON admins FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update" ON admins FOR UPDATE USING (true);

-- Customers policies
CREATE POLICY "Customers can read own" ON customers FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Customers can insert" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Customers can update own" ON customers FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can read all customers" ON customers FOR SELECT USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));
CREATE POLICY "Admins can update customers" ON customers FOR UPDATE USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Categories policies (public read, admin write)
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Admin insert categories" ON categories FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));
CREATE POLICY "Admin update categories" ON categories FOR UPDATE USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));
CREATE POLICY "Admin delete categories" ON categories FOR DELETE USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Products policies (public read, admin write)
CREATE POLICY "Public read products" ON products FOR SELECT USING (is_active = true OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));
CREATE POLICY "Admin insert products" ON products FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));
CREATE POLICY "Admin update products" ON products FOR UPDATE USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));
CREATE POLICY "Admin delete products" ON products FOR DELETE USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Product Images policies
CREATE POLICY "Public read product images" ON product_images FOR SELECT USING (true);
CREATE POLICY "Admin manage product images" ON product_images FOR ALL USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Orders policies
CREATE POLICY "Customers read own orders" ON orders FOR SELECT USING (auth.uid() = customer_id OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));
CREATE POLICY "Customers insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin update orders" ON orders FOR UPDATE USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));
CREATE POLICY "Admin read orders" ON orders FOR SELECT USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Order Items policies
CREATE POLICY "Customers read own items" ON order_items FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND (customer_id = auth.uid() OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()))));
CREATE POLICY "Insert order items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin read all items" ON order_items FOR SELECT USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Reviews policies
CREATE POLICY "Public read approved reviews" ON reviews FOR SELECT USING (is_approved = true OR customer_id = auth.uid() OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));
CREATE POLICY "Customers insert reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers update own reviews" ON reviews FOR UPDATE USING (auth.uid() = customer_id);
CREATE POLICY "Admin manage reviews" ON reviews FOR ALL USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Feedback policies
CREATE POLICY "Customers insert own feedback" ON feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin read feedback" ON feedback FOR SELECT USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));
CREATE POLICY "Admin update feedback" ON feedback FOR UPDATE USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Banners policies
CREATE POLICY "Public read banners" ON banners FOR SELECT USING (true);
CREATE POLICY "Admin manage banners" ON banners FOR ALL USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Payment Proofs policies
CREATE POLICY "Customers read own proofs" ON payment_proofs FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE id = payment_proofs.order_id AND (customer_id = auth.uid() OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()))));
CREATE POLICY "Customers insert proofs" ON payment_proofs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manage proofs" ON payment_proofs FOR ALL USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Wishlist policies
CREATE POLICY "Customers manage own wishlist" ON wishlists FOR ALL USING (auth.uid() = customer_id);

-- Cart policies
CREATE POLICY "Customers manage own cart" ON carts FOR ALL USING (auth.uid() = customer_id);

-- Settings policies
CREATE POLICY "Public read settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Admin manage settings" ON settings FOR ALL USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Notifications policies
CREATE POLICY "Admin read notifications" ON notifications FOR SELECT USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));
CREATE POLICY "Admin insert notifications" ON notifications FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));
CREATE POLICY "Admin update notifications" ON notifications FOR UPDATE USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Coupons policies
CREATE POLICY "Public read active coupons" ON coupons FOR SELECT USING (is_active = true OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));
CREATE POLICY "Admin manage coupons" ON coupons FOR ALL USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- ==================== FUNCTIONS & TRIGGERS ====================

-- Auto-generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  date_part TEXT;
  seq INT;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  seq := (SELECT COALESCE(MAX(CAST(SPLIT_PART(order_number, '-', 2) AS INTEGER)), 0) + 1 FROM orders WHERE order_number LIKE date_part || '-%');
  NEW.order_number := date_part || '-' || LPAD(seq::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_order_number();

-- Update product rating on review insert
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products SET
    average_rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) AND is_approved = true),
    review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) AND is_approved = true)
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rating();

-- Update sold count on order status change
CREATE OR REPLACE FUNCTION update_product_sold_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_status = 'delivered' AND OLD.order_status != 'delivered' THEN
    UPDATE products SET
      sold_count = sold_count + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id AND products.id = oi.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sold_count
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.order_status = 'delivered' AND OLD.order_status IS DISTINCT FROM 'delivered')
  EXECUTE FUNCTION update_product_sold_count();

-- Update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_products_timestamp BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_categories_timestamp BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_orders_timestamp BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_customers_timestamp BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_admins_timestamp BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_settings_timestamp BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ==================== SEED DATA ====================

-- Seed default admin (password: admin123)
INSERT INTO admins (email, name, password_hash, role) VALUES
  ('admin@momenstore.com', 'Super Admin', '$2a$10$YourHashHere', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- Seed default settings
INSERT INTO settings (key, value) VALUES
  ('store_name', '"Momin Store"'),
  ('store_tagline', '"Premium Products for Everyone"'),
  ('whatsapp', '"+92 334 5702532"'),
  ('support_email', '"tg903898@gmail.com"'),
  ('address', '"Multan Road, Lahore, Pakistan"'),
  ('currency', '"PKR"'),
  ('delivery_charges', '{"inside_city": 150, "outside_city": 250, "free_shipping_threshold": 3000}'),
  ('social_media', '{"facebook": "", "instagram": "", "twitter": ""}'),
  ('seo_title', '"Momin Store - Premium Online Shopping in Pakistan"'),
  ('seo_description', '"Shop premium electronics, gaming, beauty products and more at Momin Store. Fast delivery across Pakistan. Cash on Delivery available."'),
  ('easypaisa_account_name', '"Noor Hussain Shabbir"'),
  ('easypaisa_account_number', '"03454751112"')
ON CONFLICT (key) DO NOTHING;
