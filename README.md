# Gym Order Service

The Order Service owns the e-commerce checkout domain for the HyperScale Fitness Platform. It stores customer carts, immutable order snapshots, and order status. Product data and inventory remain the responsibility of `gym-catalog-service`.

## Features

- Express API server with PostgreSQL persistence via `pg`
- SQL migrations, applied before startup by `docker-entrypoint.sh`
- Customer cart management with one active cart per customer
- Price snapshots on cart and order items, so catalog price changes do not alter existing records
- Checkout saga that reserves catalog stock sequentially and releases prior reservations if a later one fails
- Audit history: failed reservations leave the created order with `cancelled` status
- Gateway-trusted identity headers; no JWT verification or CORS middleware in this service
- Docker, Kubernetes, Jenkins, and Postman artifacts

## Domain ownership and checkout flow

The service owns the `gym_order` database. Its `product_id` values are opaque catalog-service IDs: there are no cross-database foreign keys.

On checkout, the service creates an `awaiting_payment` order from the cart's price snapshot. It then calls Catalog's internal `reserve-stock` endpoint for every item. On a reservation failure, every successful prior reservation is released and the order status becomes `cancelled`. When all reservations succeed, the cart becomes `checked_out` and the frontend receives the order ID for the future payment-service flow.

Payment-event handling is deliberately a stub until the payment-service Kafka topic contract is agreed. A future failed-payment handler must release reserved stock for every order item.

## API

For direct service calls, send the headers set by the API gateway:

```http
user-id: <customer UUID>
user-role: customer
```

The gateway exposes these paths under `/orders`; direct service calls use the paths below.

| Method   | Path                         | Description                                         |
| -------- | ---------------------------- | --------------------------------------------------- |
| `GET`    | `/health`                    | Public health check                                 |
| `GET`    | `/api/cart`                  | Get or create the current customer's active cart    |
| `POST`   | `/api/cart/items`            | Add `{ "product_id", "quantity" }` to the cart      |
| `PUT`    | `/api/cart/items/:productId` | Set an item's `{ "quantity" }`                      |
| `DELETE` | `/api/cart/items/:productId` | Remove an item                                      |
| `DELETE` | `/api/cart`                  | Clear the active cart                               |
| `POST`   | `/api/orders/checkout`       | Create an order and reserve stock                   |
| `GET`    | `/api/orders`                | List current orders; admin may pass `?customer_id=` |
| `GET`    | `/api/orders/:id`            | Get an owned order, or any order as admin           |

## Local development

1. Install packages:

```bash
npm install
```

2. Copy the environment template:

```bash
cp .env.example .env
```

3. Start the service database:

```bash
docker compose up -d db
```

4. Ensure Catalog is reachable at `CATALOG_SERVICE_URL`, then apply migrations and run the service:

```bash
npm run migrate
npm run dev
```

The direct API base is `http://localhost:3002`. The root platform Compose stack starts Order together with Catalog, the gateway, and all required databases.

## Postman

Import `Order-Service.postman_collection.json`. Use `http://localhost:3002` as `base_url` for direct calls with the included trusted identity headers. For gateway calls, use `http://localhost:8081/orders` and replace the direct headers with `Authorization: Bearer <token>`.

First create a product with the Catalog collection, copy its ID into `product_id`, then run Cart → Add Item → Checkout.

## Docker

```bash
docker build -t gym-order-service .
docker run -p 3002:3002 \
  -e DATABASE_URL="postgresql://postgres:postgres@db:5432/gym_order" \
  -e CATALOG_SERVICE_URL="http://catalog-service:3000" \
  gym-order-service
```

## Kubernetes

Manifests are in `k8s/`. They deploy the service and its dedicated PostgreSQL StatefulSet. `DATABASE_URL` is supplied by `postgres-secret`; `CATALOG_SERVICE_URL` is supplied as a service-to-service URL.

## Validation

The service intentionally has no test suite yet, matching the requested Catalog Service parity. Run static validation with:

```bash
npm run lint
```
