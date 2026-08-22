const express = require("express");
const controller = require("../controllers/cart.controller");
const { authorizeSelfOrRole } = require("../middleware/role.middleware");
const { validateCartItem, validateQuantity } = require("../middleware/order.validation.middleware");
const router = express.Router();
const selfOnly = authorizeSelfOrRole([], ["user.id"]);

router.get("/", selfOnly, controller.getCurrentCart);
router.post("/items", selfOnly, validateCartItem, controller.addItem);
router.put("/items/:productId", selfOnly, validateQuantity, controller.updateItem);
router.delete("/items/:productId", selfOnly, controller.removeItem);
router.delete("/", selfOnly, controller.clearCart);
module.exports = router;
