ALTER TABLE orders
  ADD UNIQUE INDEX uq_orders_bid (bid_id);
