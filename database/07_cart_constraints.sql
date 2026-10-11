-- Apply once. Existing duplicate active carts/items must be resolved first.
USE brightbuy;
-- Generate only a status marker. Do not depend on customer_id: it has
-- an ON UPDATE CASCADE foreign key, which cannot be the base of a stored
-- generated column. The composite unique key still allows only one active cart.
ALTER TABLE CART ADD COLUMN active_cart_marker INT
  GENERATED ALWAYS AS (CASE WHEN cart_status='ACTIVE' THEN 1 ELSE NULL END) STORED,
  ADD UNIQUE KEY uq_active_customer_cart (customer_id, active_cart_marker);
ALTER TABLE CART_ITEM ADD UNIQUE KEY uq_cart_variant (cart_id,variant_id);
