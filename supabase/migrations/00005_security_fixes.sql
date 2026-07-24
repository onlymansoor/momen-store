-- =============================================
-- Security Fixes - RLS Policy Hardening
-- =============================================

-- 1. Fix admin RLS policies: prevent any authenticated user from becoming admin
DROP POLICY IF EXISTS "Admins can read all" ON admins;
DROP POLICY IF EXISTS "Admins can insert" ON admins;
DROP POLICY IF EXISTS "Admins can update" ON admins;

-- Only existing admins can read the admins table
CREATE POLICY "Admins read admins" ON admins FOR SELECT USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Only super_admins can insert new admins
CREATE POLICY "Super admin insert admins" ON admins FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND role = 'super_admin'));

-- Only super_admins can update admins
CREATE POLICY "Super admin update admins" ON admins FOR UPDATE USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND role = 'super_admin'));

-- 2. Create SECURITY DEFINER helpers for API route admin checks
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND role = 'super_admin');
$$;

-- 3. Restrict settings table: expose only needed keys publicly
DROP POLICY IF EXISTS "Public read settings" ON settings;

CREATE POLICY "Public read non-sensitive settings" ON settings FOR SELECT USING (
  key IN ('store_name', 'logo_url', 'whatsapp_number', 'easypaisa_account_name', 'easypaisa_account_number', 'global_delivery_price', 'use_global_only', 'manual_quote_message', 'manual_quote_whatsapp', 'free_delivery_threshold')
);

CREATE POLICY "Admin read all settings" ON settings FOR SELECT USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));
