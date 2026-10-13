USE brightbuy;
ALTER TABLE CART ADD COLUMN active_cart_marker INT
  GENERATED ALWAYS AS (CASE WHEN cart_status='ACTIVE' THEN 1 ELSE NULL END) STORED,
  ADD UNIQUE KEY uq_active_customer_cart (customer_id, active_cart_marker);
ALTER TABLE CART_ITEM ADD UNIQUE KEY uq_cart_variant (cart_id,variant_id);
