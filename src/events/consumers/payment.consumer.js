// TODO: wire to Kafka once payment-service exists and the topic contract is agreed.
// payment.succeeded should mark the order paid; payment.failed should mark it
// payment_failed and release each reserved order item.
async function handlePaymentEvent() { throw new Error("Payment consumer is not wired"); }
module.exports = { handlePaymentEvent };
