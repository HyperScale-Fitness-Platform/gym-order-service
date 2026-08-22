const { pool } = require("../config/db");

async function getOrCreateActiveCart(customerId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Serializes this app-level invariant for one customer without a DB unique constraint.
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [String(customerId)]);
    let cart = (await client.query("SELECT * FROM carts WHERE customer_id = $1 AND status = 'active' ORDER BY created_at ASC LIMIT 1", [customerId])).rows[0];
    if (!cart) cart = (await client.query("INSERT INTO carts (customer_id) VALUES ($1) RETURNING *", [customerId])).rows[0];
    await client.query("COMMIT");
    return cart;
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}

async function getCartWithItems(cartId, db = pool) {
  const cart = (await db.query("SELECT * FROM carts WHERE id = $1", [cartId])).rows[0];
  if (!cart) return null;
  const items = (await db.query("SELECT * FROM cart_items WHERE cart_id = $1 ORDER BY created_at", [cartId])).rows;
  return { ...cart, items };
}

async function addItem(cartId, productId, quantity, unitPriceCents) {
  const result = await pool.query(
    `INSERT INTO cart_items (cart_id, product_id, quantity, unit_price_cents)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (cart_id, product_id) DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity, unit_price_cents = EXCLUDED.unit_price_cents, updated_at = now()
     RETURNING *`, [cartId, productId, quantity, unitPriceCents],
  );
  return result.rows[0];
}
async function updateItemQuantity(cartId, productId, quantity) {
  return (await pool.query("UPDATE cart_items SET quantity = $3, updated_at = now() WHERE cart_id = $1 AND product_id = $2 RETURNING *", [cartId, productId, quantity])).rows[0] || null;
}
async function removeItem(cartId, productId) { return (await pool.query("DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2 RETURNING *", [cartId, productId])).rows[0] || null; }
async function clearCart(cartId, db = pool) { await db.query("DELETE FROM cart_items WHERE cart_id = $1", [cartId]); }
async function markCheckedOut(cartId, db = pool) { await db.query("UPDATE carts SET status = 'checked_out', updated_at = now() WHERE id = $1", [cartId]); }

module.exports = { getOrCreateActiveCart, getCartWithItems, addItem, updateItemQuantity, removeItem, clearCart, markCheckedOut };
