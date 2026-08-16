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
- `npx tsc --noEmit` — Type check
- `npx drizzle-kit push` — Push schema changes
- `npx drizzle-kit studio` — Open Drizzle Studio

## Project Rules

- **Petrol form**: Always inside the vehicle card on the dashboard. Never render outside the card or below the vehicle list.
- **License plate parity**: Determined by the digit-letter series (e.g., `1A`, `2A`, `10A`). Use the leading digit of that series (`2A` = even, `1A`/`1B` = odd). Fall back to trailing digits only when no series exists.
- **PWA**: Keep `app/manifest.ts`, `public/sw.js`, and app icons in sync with branding changes.
- **Service worker**: Never cache `/api/*` requests. Keep authenticated routes and mutations network-only.
- **Theme**: White background with muted navy-blue accents. Avoid bright blue or orange-dominant UI unless direction changes.

## Code Conventions

- Server components by default; add `"use client"` only when interactivity is required.
- colocate components, tests, and helpers next to the route they serve.
- Prefer `date-fns-tz` for timezone-aware date operations — never raw `Date` arithmetic.
- Use `startOfAppDay()` and `addAppDays()` from `lib/timezone.ts` for all date normalization.
- All monetary/quantity fields use `doublePrecision` in Drizzle schema.

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
tests/            # Vitest test files
```

## Key Domain Concepts

- **Petrol cycle**: 40L allocation per 7-day cycle (configurable via `system_settings`).
- **Cycle states**: `OPEN` → `COMPLETED` → new `OPEN` cycle. `SUPERSEDED` for manual overrides.
- **Driving restriction**: Odd/even plate parity restricts driving on odd/even calendar days.
- **Timezone**: All dates normalized to `Asia/Yangon` (UTC+6:30) via `startOfAppDay()`.
