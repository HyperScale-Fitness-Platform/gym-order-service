const catalogServiceUrl = () => {
  if (!process.env.CATALOG_SERVICE_URL) throw new Error("CATALOG_SERVICE_URL is required");
  return process.env.CATALOG_SERVICE_URL;
};
const headers = { "Content-Type": "application/json", "user-id": "order-service", "user-role": "service" };

async function request(path, options = {}) {
  const response = await fetch(`${catalogServiceUrl()}${path}`, { ...options, headers: { ...headers, ...options.headers } });
  if (!response.ok) { const error = new Error((await response.json().catch(() => ({}))).message || `Catalog request failed (${response.status})`); error.status = response.status; throw error; }
  return response.status === 204 ? null : response.json();
}
const getProduct = (productId) => request(`/api/products/${productId}`);
const reserveStock = (productId, quantity) => request(`/api/products/${productId}/reserve-stock`, { method: "POST", body: JSON.stringify({ quantity }) });
const releaseStock = (productId, quantity) => request(`/api/products/${productId}/release-stock`, { method: "POST", body: JSON.stringify({ quantity }) });
module.exports = { getProduct, reserveStock, releaseStock };
