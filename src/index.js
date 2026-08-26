require("dotenv").config();
const app = require("./app");
const { startPaymentConsumer } = require("./events/consumers/payment.consumer");

const port = process.env.PORT || 3002;

app.listen(port, () => console.log(`Order service listening on port ${port}`));

// Same tolerance payment-service's own producer connection has: don't
// block the HTTP server from starting if Kafka isn't reachable yet, just
// log it. Health checks still pass; payment status updates just won't
// arrive until Kafka comes up.
startPaymentConsumer().catch((err) => {
  console.error("Failed to start Kafka payment consumer:", err);
});
