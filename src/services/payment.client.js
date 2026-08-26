const paymentServiceUrl = () => {
  if (!process.env.PAYMENT_SERVICE_URL) throw new Error("PAYMENT_SERVICE_URL is required");
  return process.env.PAYMENT_SERVICE_URL;
};

async function request(customerId, path, options = {}) {
  // Unlike catalog.client.js (which calls as "order-service"/"service"),
  // this call must be attributed to the real customer — payment-service's
  // ownership checks (continue/delete a payment) compare against user-id,
  // and the payment row itself is created under this id.
  const headers = {
    "Content-Type": "application/json",
    "user-id": customerId,
    "user-role": "customer",
    ...options.headers,
  };

  const response = await fetch(`${paymentServiceUrl()}${path}`, { ...options, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.message || `Payment request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? null : response.json();
}

// referenceType is always "order" here — payment-service is shared across
// domains (operations uses "membership"/"pt_package") and dispatches back
// to whichever service owns that reference type via the PAYMENT_STATUS
// Kafka topic, not via a direct callback.
function createPaymentIntent(customerId, orderId, amountCents, currency = "egp") {
  return request(customerId, "/payments", {
    method: "POST",
    body: JSON.stringify({
      referenceType: "order",
      referenceId: orderId,
      amountCents,
      currency,
    }),
  });
}

module.exports = { createPaymentIntent };
