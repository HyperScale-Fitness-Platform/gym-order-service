const { pool } = require("../config/db");

async function createOrder(customerId, items, totalCents, db = pool) {
  const order = (await db.query("INSERT INTO orders (customer_id, total_cents) VALUES ($1, $2) RETURNING *", [customerId, totalCents])).rows[0];
  for (const item of items) await db.query("INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents) VALUES ($1, $2, $3, $4)", [order.id, item.product_id, item.quantity, item.unit_price_cents]);
  return order;
}
async function getOrderById(id) {
  const order = (await pool.query("SELECT * FROM orders WHERE id = $1", [id])).rows[0];
  if (!order) return null;
  const items = (await pool.query("SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at", [id])).rows;
  return { ...order, items };
}
async function listOrders(customerId) { return (await pool.query("SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC", [customerId])).rows; }
async function updateOrderStatus(id, status, db = pool) { return (await db.query("UPDATE orders SET status = $2, updated_at = now() WHERE id = $1 RETURNING *", [id, status])).rows[0] || null; }
module.exports = { createOrder, getOrderById, listOrders, updateOrderStatus };
