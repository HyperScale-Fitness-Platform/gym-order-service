const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "gym-order-service",
  brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
});

// Own consumer group, same pattern operations-service used
// ("gym-operations-payment-group") — a dedicated group per consuming
// service, not shared.
const consumer = kafka.consumer({ groupId: "gym-order-payment-group" });

module.exports = { kafka, consumer };
