<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Tech Stack

- **Framework**: Next.js (App Router, server components by default)
- **Database**: PostgreSQL via Drizzle ORM
- **Auth**: Session-based (cookie)
- **Styling**: Tailwind CSS v4 with CSS custom properties for theming
- **Language**: TypeScript strict
- **Testing**: Vitest
- **PWA**: Service worker in `public/sw.js`, manifest in `app/manifest.ts`

## Commands

- `npm run dev` — Start dev server
- `npm test` — Run tests
- `npm run test:integration` — Run database tests; requires a separate `TEST_DATABASE_URL`
- `npx tsc --noEmit` — Type check
- `npm run db:migrate` — Apply tracked Drizzle migrations
- `npx drizzle-kit push` — Push schema changes
- `npx drizzle-kit studio` — Open Drizzle Studio

## Project Rules

- **Petrol form**: Always inside the vehicle card on the dashboard. Never render outside the card or below the vehicle list.
- **License plate parity**: Determined by the digit-letter series (e.g., `1A`, `2A`, `10A`). Use the leading digit of that series (`2A` = even, `1A`/`1B` = odd). Fall back to trailing digits only when no series exists.
- **PWA**: Keep `app/manifest.ts`, `public/sw.js`, and app icons in sync with branding changes.
- **Service worker**: Never cache `/api/*` requests. Keep authenticated routes and mutations network-only.
- **Theme**: White background with muted navy-blue accents. Avoid bright blue or orange-dominant UI unless direction changes.
- **Cycle timing**: The first refill starts the configurable 7-day window. Completing the allocation does not restart or extend that window.
- **Petrol eligibility**: Keep derived eligibility separate from persisted cycle status. A new allocation may be available while the previous cycle remains `COMPLETED` or `SUPERSEDED`.
- **Driving enforcement**: Petrol may only be recorded when the vehicle is allowed to drive on the transaction date.
- **Transaction safety**: Serialize petrol writes per vehicle inside one database transaction. Ownership lookup, cycle selection, validation, insertion, and cycle update must use the same transaction client.
- **Refill dates**: Accept real, nonfuture app-timezone dates only. A refill cannot predate the active cycle.
- **Test database safety**: Integration tests use only `TEST_DATABASE_URL`, which must differ from `DATABASE_URL`. Never reset or delete test data through the development or production connection.
- **Next.js proxy**: Use root `proxy.ts` for optimistic route checks. Every data access and mutation must still perform its own authorization.

## Code Conventions

- Server components by default; add `"use client"` only when interactivity is required.
- colocate components, tests, and helpers next to the route they serve.
- Prefer `date-fns-tz` for timezone-aware date operations — never raw `Date` arithmetic.
- Use `startOfAppDay()` and `addAppDays()` from `lib/timezone.ts` for all date normalization.
- Honor the configured app timezone end to end, defaulting to `Asia/Yangon`; do not silently format dates in the server's local timezone.
- All monetary/quantity fields use `doublePrecision` in Drizzle schema.
- Keep pure domain rules, database repositories, application orchestration, route validation, and React presentation in separate modules. Server services must not import component types.
- Return expected domain failures as typed errors and map them to localized API responses. Never expose raw database or validation-library errors.

## File Structure

```
app/
  (app)/          # Authenticated routes (dashboard, calendar, history, vehicles)
  api/            # API route handlers
  login/          # Login page
components/       # Shared React components
lib/
  db/             # Drizzle schema, migrations
  services/       # Business logic (petrol-cycle, vehicle-restriction, etc.)
  i18n/           # Burmese UI copy
  settings.ts     # System settings with DB fallback to defaults
  timezone.ts     # Timezone-aware date helpers
  dashboard.ts    # Dashboard data fetching
public/           # Static assets, service worker, icons
drizzle/          # Tracked, data-preserving database migrations
tests/            # Vitest test files
```

## Key Domain Concepts

- **Petrol cycle**: 40L allocation per 7-day window beginning with the first refill (configurable via `system_settings`).
- **Cycle states**: `OPEN` → `COMPLETED` → new `OPEN` cycle. `SUPERSEDED` for manual overrides.
- **Driving restriction**: Odd/even plate parity restricts driving on odd/even calendar days.
- **Timezone**: All dates normalized to `Asia/Yangon` (UTC+6:30) via `startOfAppDay()`.
