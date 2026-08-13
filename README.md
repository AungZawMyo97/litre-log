# Litre Log

Myanmar vehicle petrol cycle and odd/even driving-day tracker. Litre Log is also an installable PWA for phone home screens.

## Stack

- **Next.js 16** (App Router)
- **Neon PostgreSQL** (pooled connection)
- **Drizzle ORM**
- **PWA** manifest, app icons, and service worker

## Quick start

```bash
npm install
cp .env.example .env   # add your Neon DATABASE_URL and AUTH_SECRET
npm run db:push
npm run db:seed
npm run dev
```

Open `http://localhost:3000` during development. For phone installation, deploy the app over HTTPS, then use the browser's home-screen install flow.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run db:push` | Push schema to Neon |
| `npm run db:generate` | Generate SQL migrations |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed default system settings |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run lint` | Run ESLint |
| `npm run build` | Create a production build |
| `npm test` | Run business-rule tests |

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string (pooler URL recommended) |
| `AUTH_SECRET` | JWT session signing secret |

## Database

Schema lives in `lib/db/schema.ts`. Import the client from `lib/db`:

```typescript
import { db, users, vehicles } from "@/lib/db";
```

Use only from server-side code (API routes, server components, scripts) — never in client components.

## PWA

PWA metadata lives in `app/manifest.ts`. Install icons and the service worker live in `public/`:

- `public/litre-log-logo.png`
- `public/icon-192x192.png`
- `public/icon-512x512.png`
- `public/apple-touch-icon.png`
- `public/sw.js`

The service worker caches only static shell/icon assets and avoids `/api/*` so authenticated data and petrol transactions stay network-backed.

## Design

The shared theme is defined in `app/globals.css` with a white surface and muted navy-blue accents. The bottom mobile menu is fixed to the viewport for phone use.

## Petrol cycle algorithm

1. Transactions accumulate toward the configured allocation (default 40 L).
2. While total < allocation, cycle stays **OPEN**.
3. When total >= allocation, cycle **COMPLETES** on the date of the final transaction.
4. Next eligible date = completion date + interval days (default 7).
