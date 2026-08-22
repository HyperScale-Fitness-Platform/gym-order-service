async function publishOrderPlaced(order) {
  // TODO: publish order.placed once the Kafka topic contract is agreed.
  console.log("Order placed event not wired", order.id);
}
module.exports = { publishOrderPlaced };
