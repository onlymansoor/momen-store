-- SECURITY DEFINER RPC for inserting notifications (bypasses RLS)
CREATE OR REPLACE FUNCTION insert_notification(
  notif_type TEXT,
  notif_title TEXT,
  notif_message TEXT,
  notif_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO notifications (type, title, message, data)
  VALUES (notif_type, notif_title, notif_message, notif_data)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;
