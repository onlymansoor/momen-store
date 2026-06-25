-- Momen Store Migration 00002
-- Adds delivery_override to products table and global_delivery_price setting

-- Add delivery_override column to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_override DECIMAL(10,2);

-- Add global_delivery_price to delivery_settings (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'delivery_settings') THEN
    INSERT INTO delivery_settings (key, value, description)
    VALUES ('global_delivery_price', '0', 'Flat delivery fee for cities without a specific route')
    ON CONFLICT (key) DO NOTHING;
  END IF;
END $$;
