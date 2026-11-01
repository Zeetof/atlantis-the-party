# ATLANTIS THE PARTY

Official event site for **ATLANTIS THE PARTY** by **WESTHAN.ENT**, built around **ATLANTIS 4.0 — DETTY DECEMBER** on **December 30, 2026** at **Watercress Event Center, Allen, Ikeja, Lagos** (1:00 PM – 11:00 PM WAT).

The site presents the current edition, the four-edition archive, approved gallery media, the **999 remembrance experience**, and a verified claim flow that issues personalised tribute cards. Tickets are sold only through **Popout Tickets**; this codebase never renders a payment form.

> **Status: local demo.** Ticket verification, email delivery, object storage and the official checkout remain external integrations. No live payment or delivery claim is made. See [docs/MISSING_INFO.md](docs/MISSING_INFO.md) for everything still required from the organizer and providers.

## Stack

- Next.js 14.2 App Router, React 18, TypeScript (strict)
- Tailwind CSS with custom editorial tokens, local fonts, Framer Motion
- PostgreSQL-compatible Prisma schema; SQLite used for the local demo
- Admin sessions with JWT (`jose`), bcrypt password hashes, role guards
- AES-256-GCM for stored PII, HMAC-SHA256 for lookups, SHA-256 for card-token hashes
- Resend for card email (reports `SKIPPED` when unconfigured)
- Vitest for unit/security tests

## Quick start

Requirements: Node.js 20+, npm, and the supplied `assets-source/` directory.

```bash
npm install
cp .env.example .env.local
# Fill in the placeholders in .env.local — see docs/SETUP.md
npm run db:setup
npm run assets:prepare   # optional if public/media is already populated
npm run dev
```

Open <http://localhost:3000>. The admin dashboard is at `/admin` and redirects to `/admin/login`.

The seed creates the owner account from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in your environment file. With `DEMO_MODE="true"` it also creates one sandbox purchase:

- Ticket reference: `SANDBOX-ATP4-0001`
- Purchase email: `demo.attendee@example.com`

Those sandbox values exercise the matched-claim path locally. They are not real tickets and must not exist in production.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Cinematic hero, 4.0 details, countdown, archive timeline, 999 feature, ticket CTA |
| `/event` | Event facts, provisional-detail notice, ticketing explanation |
| `/lineup` | Confirmed 4.0 performers only; 2.0 lineup kept as archive |
| `/history` | Four-edition timeline and archive index |
| `/history/atlantis-1` … `-3` | Edition pages with source notes and flags |
| `/gallery` | Approved flyers, posters and 3.0 highlights with lightbox |
| `/999-experience` | Tribute concept, eligibility, privacy and process |
| `/claim` | Claim submission (name, purchase email, ticket reference, consent) |
| `/claim/invite/[token]` | One-time invitation emailed to an imported buyer |
| `/claim/status` | Lookup by claim reference + matching email |
| `/card/[token]` | Private personalised card, download and share |
| `/tickets` | Official ticket categories and external checkout link |
| `/faq`, `/contact`, `/privacy` | Support, contact and privacy notice |
| `/admin` | Protected dashboard (login at `/admin/login`) |
| `/admin/import` | CSV buyer import from the provider's order export |
| `/admin/invites` | Invitation status, bulk send, bulk issue and link recovery |

Machine endpoints:

| Endpoint | Method | Notes |
| --- | --- | --- |
| `/api/claims` | POST | Claim submission, rate-limited, origin-checked |
| `/api/claims/invite` | POST | Redeems a single-use invitation token, rate-limited, origin-checked |
| `/api/claims/status` | POST | Reference + email lookup, rate-limited, masked response |
| `/api/cards/[token]/download` | POST | Increments download count only |
| `/api/tickets/webhook` | POST | HMAC-signed purchase feed, idempotent |

## Delivering cards to buyers

Buyers can either claim a card themselves or receive an invitation, depending on what the organizer knows:

1. **Self-claim** — the buyer submits their purchase email and order reference at `/claim`. A matched reference becomes `VERIFIED`; anything else enters the manual review queue.
2. **Invited claim** — an organizer imports the provider's order export at `/admin/import` (order reference, purchaser email, quantity, purchase date). Each row is stored encrypted. A single-use, 30-day invitation link is emailed from `/admin/invites`.
3. **Redeem** — the buyer opens the invitation, confirms their name and consent, and the claim is created already verified. A used link reports "already used" rather than silently failing.
4. **Issue** — a reviewer issues one card per verified purchase, individually from `/admin/claims/[id]` or in batches of up to 20 from `/admin/invites`. Issuance attempts email delivery and records the real delivery status.
5. **Fallback** — when email is not configured, the invite and card links can be copied from the admin console and sent through an approved channel. Delivery is never reported as sent unless Resend accepted it.

Invitation and card links are private single-recipient links. See [docs/ADMIN.md](docs/ADMIN.md) for the operating procedure.

## Content integrity rules

These are enforced in seed data and page copy, and must stay true in future edits:

- Atlantis 1.0 (August 18) and 2.0 (December 29) have **no confirmed year**; both are labelled "year to be confirmed".
- Atlantis 3.0 is dated **August 19 by the organizer but August 18 on the flyer**. The conflict is displayed as "date under review" and must not be silently resolved.
- Atlantis 4.0 facts are marked **provisional** until `detailsVerified` is enabled in `/admin/event`.
- The Atlantis 2.0 lineup is archive only and is never presented as a 4.0 lineup. No 4.0 performers, DJs, hypemen, sponsors or attendance figures are invented.
- The 3.7-second personal/selfie clip is **withheld** in `storage/private` and is not served publicly.
- There is no water/aquatic theme. Atlantis here is a black, crimson and chrome editorial identity.
- Tribute artwork is original. No album art, lyrics, recordings or estate affiliation is used. Song links are marked as search fallbacks until official track URLs are supplied.
- Ticket prices are labelled as flyer prices until confirmed with the provider.

## Security summary

- No secrets are committed. `.env`, `.env.local`, the SQLite database and `storage/private` are gitignored.
- Admin routes are protected by Edge middleware and re-checked in layouts and server actions.
- Claims require reference + email; responses show a masked email and at most the last four digits of a card number.
- Full ticket references, emails and IP addresses are encrypted or HMAC-hashed at rest.
- Claim and lookup endpoints are rate-limited per IP and per email. Limits are in-memory and single-instance; use a shared store for scaled deployments.
- Imported purchaser rows are encrypted at rest; the console shows masked emails and only the last four characters of each order reference.
- Invitation tokens are 256-bit, single-use, stored as SHA-256 hashes plus ciphertext for admin re-send, and expire after 30 days.
- Card links use 256-bit opaque tokens, stored only as SHA-256 hashes, with a 30-day expiry and an admin rotation action.
- The ticketing webhook verifies the raw body HMAC before parsing and is idempotent by provider reference.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run lint` | ESLint (Next.js config) |
| `npm run test` | Vitest suite |
| `npm run db:setup` | Generate client, push schema, seed |
| `npm run db:seed` | Re-run the idempotent seed |
| `npm run db:deploy` | Apply PostgreSQL migrations for a Netlify deployment |
| `npm run netlify:build` | Netlify build: PostgreSQL client, migrate, seed, Next build |
| `npm run assets:prepare` | Rebuild WebP media and private copies from `assets-source/` |
| `npm run qa:smoke` | HTTP smoke checks against a running server |

## Deploying

The local demo runs on SQLite. For Netlify, the included [`netlify.toml`](netlify.toml) builds with [`prisma/schema.postgresql.prisma`](prisma/schema.postgresql.prisma), applies migrations, seeds the database, then runs the Next.js build. A managed PostgreSQL database and the environment variables in [docs/NETLIFY.md](docs/NETLIFY.md) are required. Netlify cannot host the SQLite file or persist new media uploads.

This is a server-rendered Next.js app: deploy from Git or the Netlify CLI, not by dragging a zip into the Netlify dashboard.

## Documentation

- [docs/SETUP.md](docs/SETUP.md) — environment, database, build and deployment
- [docs/NETLIFY.md](docs/NETLIFY.md) — Netlify build, PostgreSQL and environment setup
- [docs/ADMIN.md](docs/ADMIN.md) — dashboard roles and operating workflows
- [docs/TICKETING_INTEGRATION.md](docs/TICKETING_INTEGRATION.md) — official checkout, webhook contract and claim matching
- [docs/MEDIA_MANIFEST.md](docs/MEDIA_MANIFEST.md) — source-to-output media manifest and usage
- [docs/MISSING_INFO.md](docs/MISSING_INFO.md) — unconfirmed facts, credentials and approvals

## Contact details on the site

- Phone: 0708 344 0636, 0903 561 9633 (from the supplied flyer)
- Venue: Watercress Event Center, Allen, Ikeja, Lagos
- Official tickets: <https://popouttickets.com/events/atpdettydecember>

These are transcribed from organizer-supplied artwork and should be reconfirmed before launch.
