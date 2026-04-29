# Deployment guide

This is a baseline deployment recipe. Adapt to your hosting provider as needed.

## Topology

- **API**: Node 22 process behind Nginx / a load balancer. Public endpoint `/api`
  or a dedicated subdomain.
- **Storefront**: Nuxt SSR running on Node 22, behind a CDN that respects
  `cache-control` from the SSR response.
- **Backoffice**: Nuxt SSR or static + SSR hybrid. Locked behind the corporate
  IP allow-list or VPN if possible.
- **Postgres**: managed instance (RDS, Cloud SQL, etc.) with daily backups.
- **MongoDB**: managed instance with GridFS for product images.
- **Object storage** (recommended): S3-compatible bucket for invoice/credit-note
  PDFs (replace `apps/api/app/services/invoice_generator.ts` storage path).

## Environment

API (Production):

```ini
NODE_ENV=production
APP_KEY=<32-byte secret, openssl rand -hex 32>
HOST=0.0.0.0
PORT=3333
LOG_LEVEL=info

DB_HOST=...
DB_PORT=5432
DB_USER=...
DB_PASSWORD=...
DB_DATABASE=...
MONGO_URI=mongodb+srv://...
MONGO_DATABASE=...

STOREFRONT_URL=https://shop.althea.example.com

MAIL_DRIVER=smtp
SMTP_HOST=...
SMTP_PORT=587
MAIL_FROM_ADDRESS=no-reply@althea.example.com
MAIL_FROM_NAME=Althea Systems

STRIPE_SECRET_KEY=sk_live_...
STRIPE_CURRENCY=eur

ADMIN_EMAIL=ops@althea.example.com
ADMIN_PASSWORD=<rotate after first login>
TOTP_ISSUER=Althea Backoffice
```

Storefront (Production):

```ini
NUXT_PUBLIC_API_BASE=https://api.althea.example.com
NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## Build

```sh
pnpm install --frozen-lockfile
pnpm --filter api exec node ace build
pnpm --filter storefront build
pnpm --filter backoffice build
```

Build artefacts:

- API: `apps/api/build/`
- Storefront: `apps/storefront/.output/`
- Backoffice: `apps/backoffice/.output/`

## Run

API (with PM2 or systemd):

```sh
cd apps/api/build && node bin/server.js
```

Storefront / backoffice:

```sh
node apps/storefront/.output/server/index.mjs
node apps/backoffice/.output/server/index.mjs
```

## Database migration

Always run migrations as part of the deploy step (after the build, before
flipping traffic):

```sh
cd apps/api/build && node ace migration:run --force
```

For zero-downtime, add new columns nullable, deploy code that tolerates both
shapes, backfill, then deploy code requiring the new shape.

## Reverse proxy (Nginx skeleton)

```nginx
server {
  listen 443 ssl http2;
  server_name api.althea.example.com;
  ssl_certificate     /etc/letsencrypt/live/api.althea.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.althea.example.com/privkey.pem;

  location / {
    proxy_pass http://127.0.0.1:3333;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Repeat for `shop.` (storefront) and `admin.` (backoffice). Disable HTTP and
redirect to HTTPS on every host.

## Operations

- Backups: nightly logical Postgres dump + MongoDB dump. Test restore quarterly.
- Monitoring: scrape API logs (pino) into your aggregator; alert on 5xx > 1%
  over 5 min.
- Stripe webhooks: not yet wired; add `/stripe/webhook` consuming
  `payment_intent.succeeded` and reconcile against orders.
- Secrets rotation: rotate `APP_KEY`, Stripe live key, and DB passwords on a
  scheduled cadence (90 days).
