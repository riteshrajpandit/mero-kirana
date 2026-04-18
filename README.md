# Mero Kirana MVP

Offline-first PWA for Nepal grocery stores, built with Next.js 16, Prisma, PostgreSQL, Dexie, and background sync.

## Stack

- Next.js 16 App Router
- TypeScript + Tailwind CSS
- Prisma + PostgreSQL
- Dexie IndexedDB (offline writes)
- Queue-based sync engine with exponential backoff

## Architecture

### Multi-tenant isolation

- Every persisted model includes `shopId`.
- All server reads and writes are scoped by `shopId`.
- `shopId` now comes from verified JWT session claims, never from client headers.
- API body does not accept arbitrary mass assignment (`zod.strict()`).

### Shopkeeper registration + trial

- New shopkeepers can self-register from `/login` via the Register button.
- Registration creates:
  - `Shop` with `subscriptionStatus=TRIAL`
  - `trialStartedAt` and `trialEndsAt` (`+15` days)
  - owner `User` with `role=OWNER` and hashed password
- Registration auto-signs-in the owner via HTTP-only cookie JWT.
- Trial metadata is implemented now and can be enforced later in guards/rules.

### Offline-first write flow

1. Save customer/transaction to Dexie immediately
2. Mark `isSynced = false`
3. Upsert a sync queue task
4. Render UI immediately from local database

### Background sync flow

1. Detect online state using browser events
2. Pull eligible queue items (`pending` + `nextAttemptAt <= now`)
3. POST records to API using authenticated session cookie
4. On success, mark local record synced and remove queue item
5. On failure, increment retry and schedule exponential backoff

### Conflict strategy

- Last Write Wins using `updatedAt`
- If incoming write is older than server row, server ignores and logs conflict
- `version` included for future upgrade to stronger conflict control

## Folder Structure

```text
app/
	api/
		customers/route.ts
		transactions/route.ts
	dashboard/
		dashboard-client.tsx
		page.tsx
	customers/page.tsx
	transactions/page.tsx
	components/pwa-register.tsx
	manifest.ts

lib/
	auth/constants.ts
	db/prisma.ts
	offline/
		db.ts
		mutations.ts
	sync/
		engine.ts
		useOffline.ts
		useSync.ts

prisma/
	schema.prisma

server/
	auth/
	repositories/
	services/
	validation/

types/
	shared.ts
```

## Local Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create env file:

```bash
cp .env.example .env
```

3. Generate Prisma client and run migration:

```bash
pnpm prisma generate
pnpm prisma migrate dev --name init
pnpm prisma:seed
```

4. Start app:

```bash
pnpm dev
```

## API Endpoints

- `GET /api/customers`
- `POST /api/customers`
- `GET /api/transactions`
- `POST /api/transactions`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/register`
- `POST /api/subscription/renew` (owner only)

All endpoints are shop-scoped and validated using Zod.

## Notes

- Auth uses HTTP-only cookie JWT sessions.
- Set `AUTH_JWT_SECRET` to a long random value (32+ chars).
- For Supabase pooler, keep `DATABASE_URL` on port `6543` with `pgbouncer=true&connection_limit=1&pool_timeout=20`.
- Seed defaults can be overridden using `SEED_*` env variables.
