# Deploying on Netlify

This project is a Next.js server application, not a static site. Netlify builds it with the Next.js Runtime and runs pages, server actions and API routes as functions.

**Do not drag-and-drop a zip into Netlify.** That only publishes static files and cannot run the claim, admin or API routes. Deploy from a Git repository or with the Netlify CLI so Netlify runs the build.

The `atlantis-the-party-netlify.zip` package contains the source, `public/media`, the PostgreSQL schema and migrations. It deliberately excludes `node_modules`, `.next`, local environment files, `prisma/dev.db`, `storage/private` and the large `assets-source/` originals. The processed public media is already included, so the site deploys without them.

## What changes on Netlify

| Local demo | Netlify |
| --- | --- |
| SQLite file (`prisma/dev.db`) | PostgreSQL via `DATABASE_URL` |
| `prisma/schema.prisma` | `prisma/schema.postgresql.prisma` (used by the build) |
| `npm run build` | `npm run netlify:build` (generate client, migrate, seed, build) |
| Files written to `storage/private` and `public/media` | Not persisted; media uploads are disabled on Netlify |
| In-memory rate limits | Per function instance, best-effort |

The build command is defined in `netlify.toml`:

```bash
prisma generate --schema prisma/schema.postgresql.prisma
prisma migrate deploy --schema prisma/schema.postgresql.prisma
tsx scripts/netlify-seed.ts
next build
```

The seed wrapper is intentionally conservative:

- **First build (empty database):** it runs the full seed and creates the event, editions, lineup, media records, songs, settings and owner account.
- **Later builds:** it skips the content seed so organizer edits are not overwritten. It still syncs the owner password from `ADMIN_PASSWORD`, so changing that variable and redeploying updates the owner login.
- **Forced reseed:** set `FORCE_SEED="true"` for one build to run the full seed. This **overwrites** seeded content such as ticket prices, song links, captions and settings. Unset it immediately afterwards.

## 1. Create a PostgreSQL database

Use Neon, Supabase, Railway or any managed PostgreSQL. For Neon:

1. Create a project and copy the connection string.
2. Prefer the **direct** (non-pooled) connection string for this build, because the build runs migrations.
3. If you must use a pooled URL, confirm migrations run; some poolers reject the session behaviour Prisma needs. In that case run `npm run db:deploy` once from your machine with a direct URL, then remove the migrate step from the build.

The database starts empty. The first Netlify build creates every table and seeds content.

Serverless functions open database connections per instance. For a busy launch, use your provider's pooled URL for runtime queries and run migrations separately with a direct URL. If the pooled URL cannot run `prisma migrate deploy`, run `npm run db:deploy` once with the direct URL and change the build command to omit the migrate step. A low-traffic event site can usually run on the direct URL throughout.

## 2. Add environment variables

In **Site configuration → Environment variables**, add:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | 32+ random characters |
| `APP_ENCRYPTION_KEY` | 32+ different random characters |
| `TICKETING_WEBHOOK_SECRET` | 32+ different random characters (or leave empty until needed) |
| `ADMIN_EMAIL` | Owner login email |
| `ADMIN_PASSWORD` | Strong owner password |
| `DEMO_MODE` | `false` |
| `NEXT_PUBLIC_SITE_URL` | `https://your-site.netlify.app` or your custom domain |
| `RESEND_API_KEY` | Optional; leave empty to run with honest `SKIPPED` email status |
| `EMAIL_FROM` | Verified sender when Resend is configured |
| `EMAIL_REPLY_TO` | Optional |
| `FORCE_SEED` | Optional. `true` on one build re-runs the full seed and overwrites seeded content |

Generate secrets with:

```bash
openssl rand -hex 32
```

Use a different value for each secret. `NEXT_PUBLIC_SITE_URL` is embedded in invitation, card, sitemap and metadata links at build time. If you change it, redeploy. Without it, links fall back to `http://localhost:3000`.

Netlify makes environment variables available to builds by default. If you mark one as "functions only", the build cannot read it; do not do that for `DATABASE_URL`, `ADMIN_*` or the secrets.

## 3. Deploy

### Option A — Git (recommended)

1. Push this unzipped project to a Git repository.
2. In Netlify, choose **Add new site → Import an existing project**.
3. Select the repository. Netlify reads `netlify.toml`, so keep the detected build command as `npm run netlify:build` and publish directory `.next`.
4. Add the environment variables before the first build, then deploy.

### Option B — Netlify CLI without Git

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --build --prod
```

`--build` runs the build locally with the linked site's environment variables and deploys the result. You still need the PostgreSQL database reachable from this machine during the build.

## 4. Verify the deployment

1. Open `/` and confirm the hero and event details render.
2. Open `/admin/login` and sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
3. In `/admin/event`, confirm the seeded event and ticket categories.
4. If Resend is configured, send a test invitation from `/admin/invites`; otherwise confirm the status is `SKIPPED` and the copy-link fallback works.
5. Run the smoke checks against the live site:

```bash
SMOKE_BASE_URL="https://your-site.netlify.app" npm run qa:smoke
```

6. Confirm `/robots.txt` and `/sitemap.xml` contain the production URL, not localhost.

## Known Netlify limitations

- **Media uploads do not persist.** `/admin/media` writes to `storage/private` and `public/media`, which are ephemeral or read-only in functions. Approving or uploading new media will fail. Add media locally, rebuild, and redeploy, or connect Netlify Blobs / S3 before enabling uploads. Existing gallery media is included in the deployment.
- **Function request body limit.** Netlify limits function payloads (commonly 6 MB). The app allows 12 MB uploads locally, but large uploads will be rejected by Netlify before the app sees them.
- **Rate limits are per instance.** The built-in limiter is in memory. For strict global limits, move it to Upstash Redis or similar.
- **Migrations run during the build.** Avoid concurrent deploys against the same database. Netlify rollbacks do not roll back database changes.
- **Cold starts.** The first request after idle can be slower; Prisma opens a new database connection.
- **Private files.** `storage/private` is not part of the deployment; withheld media must stay out of public storage.

## Troubleshooting

**Build fails with `the URL must start with postgresql://`** — `DATABASE_URL` still points at SQLite, or is missing. Set the PostgreSQL URL for the Netlify build environment.

**Build fails on `prisma migrate deploy`** — the database is unreachable, the URL is pooled and incompatible, or the build does not have `DATABASE_URL`. Test the URL from a machine with `npx prisma migrate deploy --schema prisma/schema.postgresql.prisma`.

**Build fails in `tsx prisma/seed.ts`** — `ADMIN_EMAIL` and `ADMIN_PASSWORD` are missing, or the database schema was not created. Read the migration error above it.

**Admin login rejects the password** — redeploy with the intended `ADMIN_PASSWORD`, or change it and trigger a new build; the seed updates the owner hash on every build.

**Invitation links open localhost** — set `NEXT_PUBLIC_SITE_URL`, redeploy, then use **New link** on `/admin/invites` for affected buyers.

**All data disappears after a redeploy** — the site is still using SQLite. Check that the Netlify build ran `netlify:build` and that the Postgres URL is set.

**Page shows a database error** — the schema is out of date. Trigger a new build so `prisma migrate deploy` runs, or run `npm run db:deploy` with the production URL.
