# Setup and deployment

## Prerequisites

- Node.js 20 or newer (developed on Node 20/24)
- npm 10+
- The supplied `assets-source/` directory (original flyers, posters and videos)
- SQLite for the local demo, or PostgreSQL for a production-style deployment

## 1. Install

```bash
npm install
```

## 2. Environment

Copy the placeholder file and fill in local values:

```bash
cp .env.example .env.local
node -e "console.log('AUTH_SECRET='+require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('APP_ENCRYPTION_KEY='+require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('TICKETING_WEBHOOK_SECRET='+require('crypto').randomBytes(32).toString('hex'))"
```

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | `file:./dev.db` for SQLite; a PostgreSQL URL when the schema provider is switched |
| `AUTH_SECRET` | Yes | Minimum 32 characters. Signs admin sessions and hashes PII lookups. Rotating it invalidates sessions and lookup hashes |
| `APP_ENCRYPTION_KEY` | Yes | Minimum 16 characters. Derives the AES-256-GCM key for stored email/ticket references. Rotating it makes existing ciphertext unreadable |
| `TICKETING_WEBHOOK_SECRET` | For webhook | Minimum 16 characters. Shared secret for the signed purchase feed |
| `ADMIN_EMAIL` | Yes (seed) | Owner login created by the seed |
| `ADMIN_PASSWORD` | Yes (seed) | Minimum 8 characters; use a strong unique value |
| `DEMO_MODE` | No | `true` seeds the sandbox ticket and shows demo notices. Set `false` in production |
| `NEXT_PUBLIC_SITE_URL` | Production | Public origin, e.g. `https://atlantis.example`. Also used to build emailed invitation and card links |
| `RESEND_API_KEY` | For email | When empty, card email is recorded as `SKIPPED` with an honest reason |
| `EMAIL_FROM` | For email | Verified sender, e.g. `ATLANTIS <tickets@yourdomain>` |
| `EMAIL_REPLY_TO` | No | Optional reply-to address |

Never commit `.env`, `.env.local`, the database file or `storage/private`.

> `AUTH_SECRET`, `APP_ENCRYPTION_KEY` and `TICKETING_WEBHOOK_SECRET` are unrelated secrets. Do not reuse one value for another, and do not reuse the example placeholders.

## 3. Database

The demo uses SQLite through Prisma:

```bash
npm run db:setup
```

That runs `prisma generate`, `prisma db push` and the idempotent seed. Re-run only the seed with:

```bash
npm run db:seed
```

The seed creates:

- the `atlantis-4` event and its ticket categories (prices marked unverified)
- editions 1.0–4.0 with date caveats
- the 2.0 archive lineup and media records
- approved tribute songs (marked `SEARCH_FALLBACK`)
- site settings `claimsOpen`, `tributeEnabled`, `ticketProvider`
- the owner admin account from your environment
- with `DEMO_MODE="true"`, sandbox verification `SANDBOX-ATP4-0001` / `demo.attendee@example.com`

### PostgreSQL

The schema is PostgreSQL-compatible. For a self-managed deployment:

1. Change `provider` in `prisma/schema.prisma` from `sqlite` to `postgresql`.
2. Point `DATABASE_URL` at the database.
3. Replace `prisma db push` with reviewed migrations (`prisma migrate dev` / `prisma migrate deploy`).

Do not run `db push` against production data.

For Netlify, do not edit the SQLite schema. The build uses the committed PostgreSQL copy and migrations:

```bash
npm run db:deploy   # prisma migrate deploy against prisma/schema.postgresql.prisma
```

See [NETLIFY.md](NETLIFY.md) for the full deployment procedure. Keep the models in `schema.prisma` and `schema.postgresql.prisma` in sync when editing them.

## 4. Media

If `public/media` is missing or the source assets changed:

```bash
npm run assets:prepare
```

This converts flyers to WebP, builds video posters, copies highlight clips, and places the review-only clip in `storage/private` (never in `public/`). It is safe to re-run. See [MEDIA_MANIFEST.md](MEDIA_MANIFEST.md).

## 5. Buyer import and invitations

The distribution loop needs no extra services beyond the database and Resend:

1. Sign in to `/admin`, open **Import**, and upload the provider's CSV order export. Parsing happens in the browser; files are capped at 2 MB and 1,000 rows, and nothing is stored until you submit.
2. Re-importing the same export is safe — existing order references are skipped.
3. Open **Invites** to email single-use, 30-day invitation links, or up to 25 pending invitations per run.
4. The buyer redeems the link at `/claim/invite/<token>`. The resulting claim is already verified.
5. Issue cards individually or up to 20 at a time from **Invites**. Issuance attempts email delivery and records the true status.

Without Resend, invitations and cards are still created; the delivery status is `SKIPPED`, and links can be copied from the admin console. Set `NEXT_PUBLIC_SITE_URL` correctly before sending anything, because it is embedded in every link.

CSV columns, aliases and errors are documented in [TICKETING_INTEGRATION.md](TICKETING_INTEGRATION.md#csv-import-format). The existing schema needs no migration beyond `npm run db:setup`; there are no new environment variables.

## 6. Run

```bash
npm run dev        # http://localhost:3000
npm run lint
npm run test
npm run build && npm start
```

Against a running server you can also execute:

```bash
npm run qa:smoke
```

Set `SMOKE_BASE_URL` to test a different origin.

## 7. Production checklist

- [ ] Replace all example secrets with fresh random values.
- [ ] Set `DEMO_MODE="false"` and remove the sandbox verification record.
- [ ] Confirm `NEXT_PUBLIC_SITE_URL`, TLS and secure cookies (`NODE_ENV=production` sets `Secure`).
- [ ] Use PostgreSQL with reviewed migrations and automated backups.
- [ ] Supply a persistent disk or object storage for `storage/private` uploads. Serverless filesystems are ephemeral.
- [ ] Configure Resend with a verified sending domain; send a test card and confirm `SENT` in `/admin/emails`.
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the production origin and send a test invitation; confirm the link opens the production host, not `localhost:3000`.
- [ ] Configure the ticketing webhook and send a signed test; confirm idempotency by replaying it. Import a real provider export at `/admin/import` and confirm duplicate rows are skipped.
- [ ] Remove sandbox, test import and test claim records before launch; audit entries stay.
- [ ] Move rate limiting to a shared store (Redis/Upstash) if running more than one instance. The built-in limiter is per process.
- [ ] Confirm event details in `/admin/event` and enable `detailsVerified` only after organizer sign-off.
- [ ] Reconcile `/admin/claims`, `/admin/cards` and `/admin/audit` after launch.
- [ ] Review the privacy notice and retention policy with the organizer.
- [ ] Keep `storage/private` and the review-only clip out of the public web root.

## Troubleshooting

**`AUTH_SECRET is not configured`** — the secret is missing or shorter than 32 characters.

**`ADMIN_EMAIL and ADMIN_PASSWORD are required`** — set both before seeding.

**Admin login rejects a known password** — re-run `npm run db:seed` after changing `ADMIN_PASSWORD`; the seed updates the owner hash.

**Webhook returns 401 `Invalid signature`** — sign the exact raw body bytes, not a re-serialised object. Send `x-atlantis-signature: sha256=<hex>`. Confirm the server and signer use the same `TICKETING_WEBHOOK_SECRET`.

**Card email shows `SKIPPED`** — `RESEND_API_KEY` is empty or email configuration is invalid. This is an intentional honest status, not a silent failure. The same applies to invitation email; copy the link from `/admin/invites` if you must deliver it another way.

**Invitation link points at `localhost:3000`** — `NEXT_PUBLIC_SITE_URL` was unset when the link was created. Set the production origin, restart, and choose **New link** for affected buyers.

**CSV import rejects valid-looking rows** — check the exact header names and quantity range (1–20). The importer requires an order reference and a purchaser email; a purchase date is optional. See the alias table in [TICKETING_INTEGRATION.md](TICKETING_INTEGRATION.md#csv-import-format).

**A buyer says the invitation was "already used"** — the link is single-use. Ask them to look up their claim at `/claim/status` with their claim reference and purchase email rather than reissuing a card.

**Private media returns 404** — expected. Review-only media is not served until approved, and approval copies it into `public/media`.

**Stale admin UI after edits** — hard-reload the tab; development Fast Refresh can retain old client state around masked fields.
