# Althea Systems

E-commerce platform for medical equipment.

## Stack

| App | Tech | Port |
|-----|------|------|
| `apps/storefront` | Nuxt 3 + Tailwind CSS | `:3000` |
| `apps/backoffice` | Nuxt 3 + Nuxt UI | `:3001` |
| `apps/api` | AdonisJS 6 | `:3333` |

**Databases:** PostgreSQL + MongoDB · **Auth:** Access Tokens · **Payments:** Stripe

## Quick Start

```bash
pnpm install
docker compose up -d postgres mongo
pnpm dev:storefront   # localhost:3000
pnpm dev:backoffice   # localhost:3001
pnpm dev:api          # localhost:3333
```

## Team

Built by **MK3** — Bachelor CPI 2025-2026
