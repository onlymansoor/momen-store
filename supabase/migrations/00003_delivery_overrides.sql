ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_overrides JSONB DEFAULT '[]'::jsonb;
