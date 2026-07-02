-- Create review_links table
CREATE TABLE IF NOT EXISTS review_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  customer_email TEXT,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE review_links ENABLE ROW LEVEL SECURITY;

-- Covers both anon and authenticated roles
CREATE POLICY "anyone insert review_links" ON review_links FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone select unused review_links" ON review_links FOR SELECT USING (is_used = FALSE);
CREATE POLICY "anyone update review_links" ON review_links FOR UPDATE USING (is_used = FALSE);

-- RPC: inserts review, marks link used, returns review_id for image uploads
CREATE OR REPLACE FUNCTION submit_review_and_use_link(
  p_link_id UUID,
  p_product_id UUID,
  p_rating INT,
  p_comment TEXT,
  p_customer_name TEXT
) RETURNS UUID AS $$
DECLARE
  v_link_used BOOLEAN;
  v_review_id UUID;
BEGIN
  SELECT is_used INTO v_link_used FROM review_links WHERE id = p_link_id;
  IF v_link_used IS NULL OR v_link_used = TRUE THEN
    RAISE EXCEPTION 'Link is invalid or already used';
  END IF;
  INSERT INTO reviews (product_id, rating, comment, customer_name, is_verified)
  VALUES (p_product_id, p_rating, p_comment, p_customer_name, TRUE)
  RETURNING id INTO v_review_id;
  UPDATE review_links SET is_used = TRUE WHERE id = p_link_id;
  RETURN v_review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
