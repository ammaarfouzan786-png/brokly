# API

> Draft surface for the assumed product. All endpoints require authentication unless noted. Money
> and quantity fields are integer minor units. Responses are JSON.

## Conventions

- Base path: `/api/v1`
- Auth: `Authorization: Bearer <token>`
- Mutations accept an `Idempotency-Key` header.
- Errors: `{ "error": { "code": string, "message": string } }` with an appropriate HTTP status.

## REST endpoints

### Auth & accounts

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/auth/register` | Create a user (no auth). |
| `POST` | `/auth/login` | Exchange credentials for a token (no auth). |
| `GET` | `/accounts` | List the caller's accounts. |
| `POST` | `/accounts` | Open a new account. |
| `GET` | `/accounts/:id` | Account detail + cash balance. |

### KYC

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/kyc/submit` | Submit identity details to the provider. |
| `GET` | `/kyc/status` | Current verification status. |

### Funding

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/accounts/:id/deposits` | Initiate a deposit. |
| `POST` | `/accounts/:id/withdrawals` | Initiate a withdrawal. |
| `GET` | `/accounts/:id/ledger` | Ledger entries (paginated). |

### Market data

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/instruments` | Search/list tradable instruments. |
| `GET` | `/instruments/:symbol/quote` | Latest quote snapshot. |
| `GET` | `/instruments/:symbol/bars` | Historical bars (range + interval). |

### Orders & portfolio

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/orders` | Place an order. |
| `GET` | `/orders` | List orders (filter by status). |
| `GET` | `/orders/:id` | Order detail + fills. |
| `DELETE` | `/orders/:id` | Cancel an open order. |
| `GET` | `/accounts/:id/positions` | Current positions + P&L. |

### Place order — request

```json
POST /api/v1/orders
{
  "accountId": "uuid",
  "symbol": "AAPL",
  "side": "buy",
  "type": "limit",
  "qty": 10,
  "limitPriceMinor": 19250
}
```

### Place order — response

```json
201 Created
{
  "id": "uuid",
  "status": "filled",
  "fills": [{ "qty": 10, "priceMinor": 19248, "executedAt": "2026-07-01T15:30:00Z" }]
}
```

## Realtime (WebSocket)

Connect to `/ws` with the bearer token. Subscribe by sending
`{ "type": "subscribe", "channels": ["quotes:AAPL", "orders:<accountId>"] }`.

Server → client messages:

| Event | Payload |
| --- | --- |
| `quote` | `{ symbol, bidMinor, askMinor, ts }` |
| `order.update` | `{ orderId, status }` |
| `fill` | `{ orderId, qty, priceMinor, ts }` |
