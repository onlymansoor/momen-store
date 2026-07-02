-- Create review_links table
CREATE TABLE IF NOT EXISTS review_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  customer_email TEXT,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE review_links ENABLE ROW LEVEL SECURITY;

-- Covers both anon (unauthenticated) and authenticated (logged-in admin) roles
CREATE POLICY "anyone insert review_links" ON review_links FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone select unused review_links" ON review_links FOR SELECT USING (is_used = FALSE);
CREATE POLICY "anyone update review_links" ON review_links FOR UPDATE USING (is_used = FALSE);

-- RPC for submitting review and marking link as used (bypasses RLS)
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
  SELECT is_used INTO v_link_used FROM review_links WHERE id = p_link_id;
  IF v_link_used IS NULL OR v_link_used = TRUE THEN
    RAISE EXCEPTION 'Link is invalid or already used';
  END IF;
  INSERT INTO reviews (product_id, rating, comment, images, is_verified)
  VALUES (p_product_id, p_rating, p_comment, p_images, TRUE);
  UPDATE review_links SET is_used = TRUE WHERE id = p_link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
