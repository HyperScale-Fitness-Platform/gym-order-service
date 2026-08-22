function validateCartItem(req, res, next) {
  const { product_id: productId, quantity } = req.body || {};
  if (!productId || typeof productId !== "string") return res.status(400).json({ message: "product_id is required" });
  if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0) return res.status(400).json({ message: "quantity must be a positive integer" });
  req.body.quantity = Number(quantity);
  next();
}

function validateQuantity(req, res, next) {
  const { quantity } = req.body || {};
  if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0) return res.status(400).json({ message: "quantity must be a positive integer" });
  req.body.quantity = Number(quantity);
  next();
}

module.exports = { validateCartItem, validateQuantity };
