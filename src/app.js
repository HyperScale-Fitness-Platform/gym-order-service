const express = require("express");
const auth = require("./middleware/auth.middleware");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");
const errorHandler = require("./middleware/errorHandler.middleware");
const notFound = require("./middleware/notFound.middleware");
const app = express();

app.use(express.json());
app.use(auth);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use(notFound);
app.use(errorHandler);
module.exports = app;
