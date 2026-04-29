# Security plan

This document describes the security controls, threat model and operational
practices for Althea Systems.

## 1. Identity and session management

- **Customer auth**: bearer access tokens issued by `@adonisjs/auth` via the
  `DbAccessTokensProvider`. Default TTL is 12 hours, 30 days when "remember me"
  is checked.
- **Admin auth**: separate token name (`backoffice_session`), 8-hour TTL, and
  mandatory role + active checks at the middleware boundary
  (`apps/api/app/middleware/admin_middleware.ts`).
- **2FA (admin)**: TOTP via `otplib` and an encrypted 5-minute challenge token
  generated with `@adonisjs/core/services/encryption`. Recovery codes are
  generated once, hashed with SHA-256 before storage, and consumed atomically.
- **Password hashing**: `scrypt` via `@adonisjs/core/services/hash` with the
  default cost. Never log or return password hashes (see `serializeAs: null`).
- **Token revocation**: every `/logout` deletes the current row from
  `auth_access_tokens`. Compromised tokens can be invalidated by deleting the
  row directly.

## 2. Transport and data at rest

- **TLS**: production hosts must terminate TLS at Nginx / the load balancer.
  HTTP must redirect to HTTPS.
- **Database**: Postgres connection is restricted to the API host via SG/VPC
  rules. Backups are encrypted at rest by the managed service.
- **PDF storage**: invoices and credit notes live under `apps/api/storage/`
  during dev. Production deployment must move them to S3-compatible storage with
  bucket policies that deny public access; signed URLs for download.
- **Secrets**: all secrets read from `.env`. The repository's `.gitignore`
  excludes `.env*` files. Use a secret manager in production.

## 3. Application-level protections

| Threat               | Control                                                                 |
|----------------------|-------------------------------------------------------------------------|
| **SQL injection**    | All queries use Lucid query builder or parameterized raw queries; no string concatenation in SQL. |
| **XSS (stored)**     | Vue interpolates with `{{ }}` (escaped). The TipTap rich text is sanitized to a known mark/extension set. Never use `v-html` on untrusted input. |
| **XSS (reflected)**  | Toast/error messages display values via `{{ }}`. The chatbot/contact form runs visitor input through `{{ }}` as well. |
| **CSRF**             | API uses bearer tokens, not cookies, so traditional CSRF doesn't apply. The admin login uses an encrypted challenge that's bound to the session that requested it. |
| **Mass assignment**  | Lucid models populate via explicit `.merge(payload)` from Vine validators; no `request.all()` is forwarded directly. |
| **Open redirect**    | The login redirect parameter only accepts in-app paths and is validated at the boundary in the backoffice login page. |
| **Replay (2FA)**     | Challenge tokens have a 5-minute TTL, are encrypted with the app key and have a fixed `purpose`. Recovery codes are removed from the user's set once consumed. |
| **Brute force**      | Pending — recommend adding `@adonisjs/limiter` to `/auth/login` and `/admin/auth/login` (5 req/min/IP) before production. |
| **Privilege escalation** | Admin endpoints sit behind `auth + admin` middleware. The user-update validator does not accept role from the storefront flow. |
| **CORS**             | `apps/api/config/cors.ts`: production must restrict `origin` to the storefront and backoffice hostnames. |

## 4. Payments

- All card data is collected via Stripe Elements; the API never sees the PAN.
- We persist only the Stripe payment method id, brand and last four digits.
- Stripe customer creation is lazy via `ensureStripeCustomer` so legacy users
  get a customer the first time they save a card or pay.
- `payment_intent` confirmation is verified server-side before creating an order
  (status must be `succeeded`).

## 5. RGPD / GDPR

- Personal data lives in PostgreSQL: users, addresses, orders, contact
  messages, chatbot sessions.
- **Right to access**: customers see their data via `/account`. Admins can
  export through `/admin/users/:id`.
- **Right to erasure**: the admin user-detail page exposes a delete action that
  permanently removes the user (cascade on FK rules and `onDelete('SET NULL')`
  for chatbot sessions). Admin accounts cannot be deleted from the UI.
- **Right to rectification**: customers update profile/email/password from
  `/account`; admin can update names through the API.
- **Data retention**: production should set retention policies (e.g. delete
  contact messages 24 months after creation, anonymize orders after 10 years
  for accounting compliance).
- **Data minimization**: forms ask only for what is needed for the order. We do
  not collect birth dates, government ids or marketing preferences by default.

## 6. Logging and observability

- API logs use `pino` and are JSON-structured. In production, ship them to your
  log aggregator and never include passwords, tokens or payment data.
- Failed mail deliveries log the recipient and link only — not the body.
- Admin status changes on orders are persisted to `order_status_history` along
  with the admin who made the change.

## 7. Testing cadence

- Pre-merge: API typecheck + Japa unit/functional suites run automatically in
  CI (`.github/workflows/ci.yml`).
- Pre-release: manual checklist
  - SSO flow: customer register → verify email → login → checkout
  - Backoffice flow: 2FA enroll → login → CRUD products + categories
  - Stripe in test mode: 4242 4242 4242 4242 succeeds, declined card surfaces
- Post-release: weekly automated dependency audit (`pnpm audit`) and quarterly
  manual penetration testing of authentication, authorization and payment
  paths.

## 8. Incident response

- Rotate `APP_KEY` and admin passwords; force re-login by deleting all access
  tokens (`DELETE FROM auth_access_tokens;`).
- Revoke compromised Stripe API keys via the Stripe dashboard and rotate
  webhook secrets.
- Notify users within 72 hours if their personal data is impacted (GDPR
  Article 33).
