# Business Platform

A fresh modular foundation for product catalog, supplier management, procurement, and inventory workflows. The original generated application remains outside this folder and can be migrated module by module.

## Stack

- Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS 4
- Express 5 API with Helmet, CORS, Pino request logging, and graceful shutdown
- MySQL/MariaDB via XAMPP, Drizzle ORM, and versioned SQL migrations
- Zod contracts shared by the browser and API
- npm workspaces for dependency and script management

## Project structure

```text
business-platform/
├── apps/
│   ├── web/                  # Next.js UI
│   └── api/                  # Express API
├── packages/
│   ├── contracts/            # Shared Zod schemas and TypeScript contracts
│   └── database/             # Drizzle schema, connection, and migrations
├── docs/                     # Architecture and engineering decisions
├── .env.example
└── package.json              # Workspace commands
```

## First-time setup

1. Start **MySQL** in XAMPP.
2. Open PowerShell in this folder.
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env` if `.env` is missing.
5. Create and migrate the database: `npm run db:setup`
6. Start both applications: `npm run dev`
7. Open `http://localhost:3000`

The Express API runs at `http://localhost:4000`. During development, Next.js proxies `/api/*` requests to Express, so browser code uses one origin.

## Everyday commands

- `npm run dev` — start web and API together
- `npm run dev:web` — start only Next.js
- `npm run dev:api` — start only Express
- `npm run check` — lint, type-check, and build every workspace
- `npm run db:generate` — generate SQL after changing the Drizzle schema
- `npm run db:migrate` — apply pending migrations
- `npm run db:studio` — inspect data with Drizzle Studio

## Migration strategy

Do not copy the old application wholesale. Migrate one domain at a time:

1. Product catalog
2. Supplier onboarding
3. Authentication and role-based access
4. Procurement requests and approvals
5. Purchase orders and receiving
6. Warehouses, inventory movements, and reporting

Each domain should own its API routes, business service, repository, contracts, and UI feature folder.
