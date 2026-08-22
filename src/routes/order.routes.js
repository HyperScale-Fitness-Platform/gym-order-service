const express = require("express");
const controller = require("../controllers/order.controller");
const { authorizeSelfOrRole } = require("../middleware/role.middleware");
const router = express.Router();
const selfOrAdmin = authorizeSelfOrRole(["admin"], ["user.id"]);

router.post("/checkout", selfOrAdmin, controller.checkout);
router.get("/", selfOrAdmin, controller.listOrders);
router.get("/:id", selfOrAdmin, controller.getOrder);
module.exports = router;
