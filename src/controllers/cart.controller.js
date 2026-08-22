const cartModel = require("../models/cart.model");
const catalog = require("../services/catalog.client");

async function getCurrentCart(req, res, next) {
  try { const cart = await cartModel.getOrCreateActiveCart(req.user.id); res.json(await cartModel.getCartWithItems(cart.id)); } catch (error) { next(error); }
}
async function addItem(req, res, next) {
  try {
    const product = await catalog.getProduct(req.body.product_id);
    if (!product.is_active) return res.status(409).json({ message: "Product is inactive" });
    const cart = await cartModel.getOrCreateActiveCart(req.user.id);
    const item = await cartModel.addItem(cart.id, req.body.product_id, req.body.quantity, product.price_cents);
    res.status(201).json(item);
  } catch (error) { next(error); }
}
async function updateItem(req, res, next) {
  try { const cart = await cartModel.getOrCreateActiveCart(req.user.id); const item = await cartModel.updateItemQuantity(cart.id, req.params.productId, req.body.quantity); if (!item) return res.status(404).json({ message: "Cart item not found" }); res.json(item); } catch (error) { next(error); }
}
async function removeItem(req, res, next) {
  try { const cart = await cartModel.getOrCreateActiveCart(req.user.id); const item = await cartModel.removeItem(cart.id, req.params.productId); if (!item) return res.status(404).json({ message: "Cart item not found" }); res.status(204).send(); } catch (error) { next(error); }
}
async function clearCart(req, res, next) { try { const cart = await cartModel.getOrCreateActiveCart(req.user.id); await cartModel.clearCart(cart.id); res.status(204).send(); } catch (error) { next(error); } }
module.exports = { getCurrentCart, addItem, updateItem, removeItem, clearCart };
