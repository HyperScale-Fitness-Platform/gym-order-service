CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), customer_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL, quantity INTEGER NOT NULL CHECK (quantity > 0), unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE (cart_id, product_id)
);
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), customer_id UUID NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'awaiting_payment',
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL, quantity INTEGER NOT NULL CHECK (quantity > 0), unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_carts_customer_id ON carts(customer_id);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
