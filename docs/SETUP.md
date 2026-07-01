# Local setup

> Steps for once the application code exists. Today the repo is a scaffold, so some commands are
> placeholders — update them as scripts are added.

## Prerequisites

- Node.js (version pinned in [`.nvmrc`](../.nvmrc)) — `nvm use`
- Docker + Docker Compose (for PostgreSQL and Redis)
- A package manager (npm assumed below)

## Steps

```bash
# 1. Node version
nvm use

# 2. Environment
cp .env.example .env.local
#   Fill in DATABASE_URL, REDIS_URL, secrets, and provider keys.

# 3. Start infra
docker compose up -d        # postgres + redis (compose file to be added)

# 4. Install dependencies
npm install

# 5. Database
npm run db:migrate
npm run db:seed             # optional demo data

# 6. Run
npm run dev                 # http://localhost:3000
```

## Verifying

```bash
npm run typecheck
npm run lint
npm test
```

## Provider keys

`MARKET_DATA_API_KEY`, `LIQUIDITY_PROVIDER_API_KEY`, `PAYMENTS_API_KEY`, and `KYC_PROVIDER_API_KEY`
are required for the corresponding features. Without them, run those services against mocks/stubs.
Never commit real keys — `.env.local` is gitignored; `.env.example` documents shape only.

## Troubleshooting

- **DB connection refused** — is `docker compose` up? Does `DATABASE_URL` match the compose ports?
- **Type errors after pulling** — re-run `npm install`; the schema or generated Prisma client may
  have changed (`npm run db:generate`).
- **No live quotes** — market data key missing or the WebSocket gateway isn't running.
