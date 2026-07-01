# Brokly

An online brokerage / trading platform. Users open and verify an account, fund it, view live
market data, place and manage orders, and track a portfolio.

> **Note:** This repository is currently a documentation-and-config scaffold — no application code
> has been written yet. The product definition, stack, and architecture below are a starting
> assumption inferred from the project name. Adjust them to match reality before building.

## Tech stack

- **Frontend:** Next.js (React, TypeScript), Tailwind CSS
- **Backend:** Node.js + TypeScript, modular services behind an API/BFF layer
- **Data:** PostgreSQL (Prisma), Redis, message bus for events
- **Realtime:** WebSockets for quotes and order updates
- **Infra:** Docker for local dev; CI runs lint + typecheck + tests

## Getting started

```bash
# 1. Use the pinned Node version
nvm use            # reads .nvmrc

# 2. Configure environment
cp .env.example .env.local
# fill in the values

# 3. Install and run (once the app is scaffolded)
npm install
npm run dev
```

## Documentation

| Doc | What's in it |
| --- | --- |
| [`CLAUDE.md`](./CLAUDE.md) | Guidance for AI agents + repo conventions |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | System components and how they fit together |
| [`docs/DATA_MODEL.md`](./docs/DATA_MODEL.md) | Core entities and relationships |
| [`docs/API.md`](./docs/API.md) | REST endpoints and realtime events |
| [`docs/SETUP.md`](./docs/SETUP.md) | Local environment setup |
| [`docs/HANDOFF.md`](./docs/HANDOFF.md) | Detailed engineering handoff |
| [`docs/diagrams/`](./docs/diagrams/) | Mermaid source for all diagrams |

## Repository layout

```
Brokly/
├── CLAUDE.md            # Agent guidance + conventions
├── README.md
├── .env.example         # Required environment variables
├── .claude/             # Claude Code settings + slash commands
├── docs/                # Architecture, data model, API, setup, handoff
│   └── diagrams/        # Mermaid diagrams
└── src/                 # Application code (to be added)
```

## Contributing

Conventional Commits (`feat:`, `fix:`, `docs:`, …). Branch as `feature/<slug>`; open PRs
against `main`. Run `npm run typecheck && npm run lint && npm test` before pushing.

## License

MIT — see [`LICENSE`](./LICENSE).
