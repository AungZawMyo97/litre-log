<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project Rules

- Dashboard petrol entry belongs inside each vehicle card. Do not render a separate petrol form below the vehicle list or outside the card.
- License plate parity is based on the digit-letter series such as `1A`, `2A`, `10A`, or `1B`; use the final digit of that series (`2A` is even, `1A`/`1B` are odd) before falling back to trailing plate numbers.
- This app is an installable PWA. Keep `app/manifest.ts`, `public/sw.js`, and the generated app icons in sync with branding changes.
- The service worker must not cache authenticated API responses or petrol-entry mutations. Keep `/api/*` requests network-only.
- Keep the visual theme white with muted navy-blue accents; avoid bright blue or orange-dominant UI changes unless the product direction changes.
