const { pool } = require("../config/db");
const cartModel = require("../models/cart.model");
const orderModel = require("../models/order.model");
const catalog = require("../services/catalog.client");
const payment = require("../services/payment.client");

async function checkout(req, res, next) {
  let order;
  const reserved = [];
  try {
    const cart = await cartModel.getOrCreateActiveCart(req.user.id);
    const cartWithItems = await cartModel.getCartWithItems(cart.id);
    if (!cartWithItems.items.length)
      return res.status(400).json({ message: "Cart is empty" });
    const totalCents = cartWithItems.items.reduce(
      (total, item) => total + item.quantity * item.unit_price_cents,
      0,
    );

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      order = await orderModel.createOrder(
        req.user.id,
        cartWithItems.items,
        totalCents,
        client,
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    for (const item of cartWithItems.items) {
      try {
        await catalog.reserveStock(item.product_id, item.quantity);
        reserved.push(item);
      } catch {
        await Promise.allSettled(
          reserved.map((reservedItem) =>
            catalog.releaseStock(
              reservedItem.product_id,
              reservedItem.quantity,
            ),
          ),
        );
        await orderModel.updateOrderStatus(order.id, "cancelled");
        return res
          .status(409)
          .json({
            message: "Unable to reserve product stock",
            product_id: item.product_id,
          });
      }
    }

    // All stock is reserved — now start the actual payment. If payment-service
    // can't create the intent (down, validation failure, etc.), this is the
    // same failure shape as a reservation failure: release everything and
    // cancel the order rather than leaving it stuck in awaiting_payment with
    // no way to ever pay for it.
    let clientSecret;
    try {
      const intent = await payment.createPaymentIntent(
        req.user.id,
        order.id,
        totalCents,
        "egp",
      );
      clientSecret = intent.clientSecret;
    } catch (error) {
      await Promise.allSettled(
        reserved.map((reservedItem) =>
          catalog.releaseStock(reservedItem.product_id, reservedItem.quantity),
        ),
      );
      await orderModel.updateOrderStatus(order.id, "cancelled");
      return res
        .status(502)
        .json({ message: "Unable to start payment for this order" });
    }

    const finalize = await pool.connect();
    try {
      await finalize.query("BEGIN");
      await cartModel.markCheckedOut(cart.id, finalize);
      await finalize.query("COMMIT");
    } catch (error) {
      await finalize.query("ROLLBACK");
      throw error;
    } finally {
      finalize.release();
    }

    return res
      .status(201)
      .json({
        order_id: order.id,
        status: "awaiting_payment",
        total_cents: totalCents,
        clientSecret,
      });
  } catch (error) {
    next(error);
  }
}

async function getOrder(req, res, next) {
  try {
    const order = await orderModel.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (
      req.user.role !== "admin" &&
      String(order.customer_id) !== String(req.user.id)
    )
      return res.status(403).json({ message: "Forbidden" });
    res.json(order);
  } catch (error) {
    next(error);
  }
}
async function listOrders(req, res, next) {
  try {
    const customerId =
      req.user.role === "admin" && req.query.customer_id
        ? req.query.customer_id
        : req.user.id;
    res.json(await orderModel.listOrders(customerId));
  } catch (error) {
    next(error);
  }
}
module.exports = { checkout, getOrder, listOrders };
