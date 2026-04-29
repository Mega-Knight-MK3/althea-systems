# Installation guide

## Prerequisites

- **Node.js** 22+
- **pnpm** 10+ (`corepack enable && corepack prepare pnpm@latest --activate`)
- **Docker** with Compose v2 (for Postgres + MongoDB)
- A **Stripe** account (test mode is enough for dev)

## 1. Clone and install

```sh
git clone https://github.com/Mega-Knight-MK3/althea-systems.git
cd althea-systems
pnpm install
```

## 2. Start local databases

```sh
docker compose up -d postgres mongodb
```

Postgres listens on `localhost:5432`, MongoDB on `localhost:27017`. Both ship with
the credentials baked into `docker-compose.yml` — adjust them before any non-local
deployment.

## 3. Configure the API (`apps/api/.env`)

Copy `.env.example` if present, otherwise create one with at least:

```ini
NODE_ENV=development
PORT=3333
APP_KEY=replace-me-with-32-bytes
HOST=0.0.0.0
LOG_LEVEL=info

DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=althea
DB_PASSWORD=althea
DB_DATABASE=althea

MONGO_URI=mongodb://127.0.0.1:27017
MONGO_DATABASE=althea_assets

STOREFRONT_URL=http://localhost:3000

# Mailer — log driver writes to stdout. Switch to smtp in prod.
MAIL_DRIVER=log
MAIL_FROM_ADDRESS=no-reply@althea.local
MAIL_FROM_NAME=Althea Systems

# Stripe (test keys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_CURRENCY=eur

# Admin seeder
ADMIN_EMAIL=admin@althea.local
ADMIN_PASSWORD=AltheaAdmin!2026
ADMIN_FULL_NAME=Althea Admin
TOTP_ISSUER=Althea Backoffice
```

Run migrations and seed the first admin:

```sh
pnpm --filter api exec node ace migration:run
pnpm --filter api exec node ace db:seed
```

## 4. Configure the storefront (`apps/storefront/.env`)

```ini
NUXT_PUBLIC_API_BASE=http://localhost:3333
NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 5. Configure the backoffice (`apps/backoffice`)

The backoffice reads `NUXT_PUBLIC_API_BASE` (defaults to `http://localhost:3333`).
Override via `apps/backoffice/.env` only if your API runs elsewhere.

## 6. Run everything

In three terminals (or via a process manager of your choice):

```sh
pnpm --filter api dev          # http://localhost:3333
pnpm --filter storefront dev   # http://localhost:3000
pnpm --filter backoffice dev   # http://localhost:3001
```

Then:

- Storefront: <http://localhost:3000>
- Backoffice: <http://localhost:3001> — login `admin@althea.local` / `AltheaAdmin!2026`
- API docs (Swagger UI): <http://localhost:3333/docs>

## Troubleshooting

| Symptom                             | Fix                                                                      |
|-------------------------------------|--------------------------------------------------------------------------|
| `useXxx is not defined` in dev      | `rm -rf apps/<app>/.nuxt && pnpm dev` to rebuild auto-import index       |
| 500 on `/admin/dashboard/sales`     | API not running or session expired — log out and back in                 |
| CORS preflight blocked              | Confirm the dev origin is allowed in `apps/api/config/cors.ts`           |
| Stripe payments stuck on "Payment"  | Backoffice Stripe key doesn't match storefront — keep them in the same account |
