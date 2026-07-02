-- Create review_links table
CREATE TABLE IF NOT EXISTS review_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  customer_email TEXT,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE review_links ENABLE ROW LEVEL SECURITY;

-- Admins can do anything
CREATE POLICY "Admins can manage review_links" ON review_links 
  FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

-- Public can read links to validate (only if not used)
CREATE POLICY "Public can read unused review_links" ON review_links 
  FOR SELECT TO anon USING (is_used = FALSE);

-- RPC for submitting review and marking link as used
CREATE OR REPLACE FUNCTION submit_review_and_use_link(
  p_link_id UUID,
  p_product_id UUID,
  p_rating INT,
  p_comment TEXT,
  p_images JSONB
) RETURNS VOID AS $$
DECLARE
  v_link_used BOOLEAN;
BEGIN
  -- Check if link exists and is not used
  SELECT is_used INTO v_link_used FROM review_links WHERE id = p_link_id;
  
  IF v_link_used IS NULL OR v_link_used = TRUE THEN
    RAISE EXCEPTION 'Link is invalid or already used';
  END IF;

  -- Insert review
  INSERT INTO reviews (product_id, rating, comment, images, is_verified)
  VALUES (p_product_id, p_rating, p_comment, p_images, TRUE);

  -- Mark link as used
  UPDATE review_links SET is_used = TRUE WHERE id = p_link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
