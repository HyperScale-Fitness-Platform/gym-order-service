const { consumer } = require("../../config/kafka");
const orderModel = require("../../models/order.model");
const catalog = require("../../services/catalog.client");

// Mirrors operations-service's activateByPayment/failByPayment split, just
// for the "order" reference type instead of "membership"/"pt_package".
async function handlePaymentEvent({ referenceType, referenceId, status }) {
  if (referenceType !== "order") return; // not ours — payment-service is shared across domains

  if (status === "succeeded") {
    await orderModel.updateOrderStatus(referenceId, "paid");
    return;
  }

  if (status === "failed") {
    const order = await orderModel.getOrderById(referenceId);
    if (!order) return;

    // Compensation: release everything reserved at checkout, same as the
    // reservation-failure path in order.controller.js's checkout().
    await Promise.allSettled(
      order.items.map((item) =>
        catalog.releaseStock(item.product_id, item.quantity),
      ),
    );

    await orderModel.updateOrderStatus(referenceId, "payment_failed");
  }
}

async function startPaymentConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: "PAYMENT_STATUS", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const event = JSON.parse(message.value.toString());
        await handlePaymentEvent(event);
      } catch (err) {
        // Don't crash the consumer loop over one bad/unexpected message —
        // log and move on, same tolerance payment-service's webhook
        // handler has for unrecognized event types.
        console.error("Failed to process PAYMENT_STATUS message:", err);
      }
    },
  });

  console.log("order-service Kafka consumer subscribed to PAYMENT_STATUS");
}

module.exports = { handlePaymentEvent, startPaymentConsumer };
