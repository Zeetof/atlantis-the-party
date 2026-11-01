# Admin guide

The organizer dashboard lives at `/admin`. Unauthenticated visits redirect to `/admin/login?next=…`, and authenticated sessions visiting the login page are sent back to `/admin`.

## Access and roles

- Credentials are created by `npm run db:seed` from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the environment. Passwords are stored as bcrypt hashes.
- Sessions are signed JWT cookies (`atp_admin`), `httpOnly`, `SameSite=Lax`, `Secure` in production, valid for 8 hours.
- Edge middleware protects every `/admin/*` route; layouts and server actions re-check the session and role.
- Additional users can be added to the `AdminUser` table with a bcrypt password hash. There is no user-management screen, and no password-reset flow.

All authenticated roles can view the dashboard sections. The table describes which role may **change** each area.

| Capability | OWNER | EDITOR | REVIEWER |
| --- | --- | --- | --- |
| Dashboard, audit log | Yes | Yes | Yes |
| Event facts, ticket categories, settings | Yes | Yes | No |
| Performers (create/update) | Yes | Yes | No |
| Performers (delete) | Yes | No | No |
| Media upload, caption, approve/reject | Yes | Yes | No |
| Tribute songs (create/update) | Yes | Yes | No |
| Tribute songs (delete) | Yes | No | No |
| Claims review, verify, reject | Yes | No | Yes |
| Buyer CSV import, invitations, bulk issue | Yes | No | Yes |
| Issue/rotate cards, retry email | Yes | No | Yes |

Role failures return a flash message ("Your role does not permit that action.") rather than performing the write.

## Dashboard sections

### Overview — `/admin`

Shows counts for claims, cards, media, verified purchases and email health, plus alerts for:

- claims waiting in manual review
- media pending approval
- failed or skipped email deliveries
- Atlantis 4.0 details not yet verified

A quick link opens the sandbox verification when `DEMO_MODE="true"`.

### Event — `/admin/event`

Edits the Atlantis 4.0 record: title, edition label, date/time, venue, description, hero image, status and **details verified**. It also manages ticket categories, prices and the online/gate flags.

- Leave **details verified** off until the organizer has confirmed date, time, venue and prices. While off, the public site labels the details provisional and ticket prices as flyer prices.
- Ticket categories are display-only. Purchase buttons always go to the official Popout Tickets URL.
- The claims open/closed setting is also controlled here (`claimsOpen`). Closing claims makes new submissions return a friendly "temporarily closed" response; existing claims remain accessible to reviewers.

### Lineup — `/admin/lineup`

Creates and edits performers for Atlantis 4.0 only. Statuses are `DRAFT`, `CONFIRMED`, etc. Only `CONFIRMED` performers appear publicly. The Atlantis 2.0 archive lineup is a separate, historical set and must never be copied into 4.0.

Do not add an artist, DJ or hypeman without organizer confirmation and correct spelling.

### Media — `/admin/media`

- Uploads accept images and videos up to the configured server-action limit (12 MB) and are written to private storage.
- New uploads are `PENDING` and do not appear publicly.
- Approving a record with no public `src` copies the file from `storage/private` to `public/media`. The action refuses paths outside `storage/private` and refuses missing files.
- Rejecting or returning a record to pending removes it from public views.
- Captions are editable and appear in the gallery and edition pages.
- Every transition is audited as `MEDIA_APPROVED`, `MEDIA_REJECTED`, `MEDIA_PENDING`, etc.

The 3.7-second review clip must stay private until written consent and organizer approval are recorded.

### Tribute songs — `/admin/songs`

Manages the approved song pool used when a card is issued.

- At least one approved song must exist before any card can be issued.
- `linkStatus` distinguishes an official track URL from a search fallback. The seed uses `SEARCH_FALLBACK`; replace with exact official links when supplied.
- Do not add lyrics, album art or audio files. Only the approved title and official streaming link are shown.
- Song selection is deterministic from the claim ID, so a card's song does not change after issuance.

### Claims — `/admin/claims`

Lists claims with status, source, masked email and submission time. Open a claim to:

1. **Verify purchase** (manual queue). Enter the provider reference exactly as it appears in the provider dashboard. The server checks it against the claim's email, reuses an existing matching verification, and refuses references linked to another claim.
2. **Reject** with a short reason. Rejected claims cannot be issued.
3. **Issue card** once a `VERIFIED` verification exists. Issuance creates the unique card number, assigns an approved song, stores only a token hash, sets a 30-day expiry and attempts email delivery.
4. Review the linked verification, card, email state and audit trail.

Never approve from a screenshot or a number forwarded in chat. If a claim is unmatched, it stays in `MANUAL_REVIEW` until a real provider record is confirmed.

### Import — `/admin/import`

Imports the provider's order export so buyers can be invited instead of chasing them to self-claim.

1. Export orders from Popout Tickets as a comma-separated CSV. The parser accepts common header names and reads columns positionally when no header is recognised. The expected columns are order reference, purchaser email, quantity and purchase date. See [TICKETING_INTEGRATION.md](TICKETING_INTEGRATION.md#csv-import-format) for the exact aliases.
2. Select the file. The browser parses it locally and shows valid rows, skipped rows and per-row errors before anything is uploaded. Nothing is sent until **Import** is submitted; files over 2 MB are rejected.
3. Review the masked preview (email reduced to its first two characters, reference reduced to its last four).
4. Submit. Valid rows are stored as `VERIFIED` verifications with the batch name, encrypted reference and encrypted purchaser email.
5. Re-importing the same export is safe: rows whose normalised reference already exists are skipped and counted separately.

Rules:

- Import only a real provider export. Do not hand-type references; the console cannot detect a transposed character.
- One import row is one provider order. **One card is issued per verified order, not per individual ticket when `quantity` is greater than 1.** If the organizer wants one card per attendee, the provider export must contain one row per attendee; agree that policy before inviting anyone.
- Rows with invalid emails, missing references or quantities outside 1–20 are rejected individually and reported, not silently dropped.
- Imported rows are visible in the claims queue only after the buyer accepts the invitation.

### Invites — `/admin/invites`

Controls the invitation and bulk-issuance loop.

- **Invitation states:** `NOT_SENT`, `SENT`, `FAILED`, `SKIPPED` (email unconfigured), `EXPIRED` (30 days passed) and `CLAIMED`.
- **Create & email** sends a single-use invitation to the purchaser. **Email again** re-sends the same live link; **New link** replaces the previous token (the old link stops working) and is needed for `EXPIRED` invitations.
- **Send pending** invites up to 25 uninvited purchases per run.
- **Issue verified** creates cards for up to 20 claimed, verified purchases per run and attempts email delivery for each. Issuance is still refused for anything that is not `VERIFIED` and unissued.
- When email is not configured, the status is `SKIPPED` and the invitation link can be copied and sent through an approved private channel. Do not paste links into public groups or screenshots.
- Search by the masked purchaser email to find a single buyer. The console never displays a full email or full order reference.

Invitations expire after 30 days and are consumed on first successful claim. A used link shows "already used" rather than a generic failure, so a buyer who loses the result can be told to use `/claim/status`.

### Cards — `/admin/cards`

Lists issued cards with masked numbers, downloads and email status. A card detail page provides:

- the private card link, masked by default with a reveal control
- **Create new link** (token rotation): invalidates the old URL; requires confirmation
- **Resend email**: forces a new delivery attempt
- download count and expiry

Card links are private. Do not paste them into public channels, screenshots or group chats.

### Emails — `/admin/emails`

Shows each delivery attempt with status:

| Status | Meaning |
| --- | --- |
| `PENDING` | Attempt in progress or interrupted |
| `SENT` | Resend accepted the message; message ID stored |
| `FAILED` | Resend returned an error; error detail stored |
| `SKIPPED` | Email is not configured (for example, no `RESEND_API_KEY`); reason stored |

Retry from the card detail page or the emails list. A `SKIPPED` result is an honest configuration state, not a delivery claim.

### Audit — `/admin/audit`

Append-only record of admin and system activity: logins and failures, event and ticket changes, performer and song changes, media transitions, claim verification/rejection, card issuance, link rotation, email retries, setting changes and received ticket verifications. Each entry records actor, action, entity, timestamp and a hashed IP where applicable.

Review the audit log after any unusual claim activity or account concern.

## Standard operating routine

**At launch**

1. Confirm event facts and prices; enable **details verified**.
2. Confirm the official ticket URL in `/admin/event`.
3. Verify the tribute song list and official links.
4. Confirm Resend is configured and send a test card to an internal address.
5. Import a two-row test export, invite yourself, redeem the invitation and confirm a used link reports "already used".
6. Deliver a signed test purchase, replay it, and confirm idempotency.
7. Set `DEMO_MODE="false"` and remove sandbox and test import records.

**Daily during sales**

1. Import the latest provider export; confirm the skipped count matches the overlap with earlier imports.
2. Send pending invitations, then work the claimed queue.
3. Clear the manual review queue from `/admin/claims`.
4. Check `/admin/emails` for `FAILED` or unexpected `SKIPPED` entries.
5. Confirm new cards have plausible download/email activity.
6. Keep claims open only while staffing allows review.

**Incident response**

- Leaked card link: rotate the token in `/admin/cards/[id]` immediately.
- Leaked or misdirected invitation link: open `/admin/invites`, choose **New link** for that buyer, and send it only to the purchaser's email on file. Rotating invalidates the exposed link.
- Suspicious claim volume: close claims in `/admin/event`, review `/admin/audit`, and tighten provider-side validation.
- Email outage: leave deliveries `FAILED`/`SKIPPED`; invitation links remain copyable and cards can be re-sent or linked privately. Do not issue duplicate cards. Retry once the provider recovers.
- Compromised admin account: deactivate the `AdminUser`, rotate `AUTH_SECRET` (invalidates all sessions), and review the audit log. An admin session can reveal invitation and card links, so treat a compromise as a link exposure.
- Lost encryption key: stored email/ticket ciphertext, invitation links and card links cannot be recovered. Restore from backup only with the matching key.

## Data handling

- Full emails and ticket references are encrypted at rest; the dashboard displays masked/last-four values except where a reviewer explicitly reveals a value.
- CSV files are parsed in the browser; the uploaded payload contains only validated order rows, and the original file is never stored.
- Invitation and card links are bearer credentials. Anyone holding a valid invite link can claim the card, so treat them like passwords.
- Card tokens are stored hashed; only admins can reveal the current link for a card.
- Do not export PII into spreadsheets or share it over unsecured channels.
- Define a retention period with the organizer and purge claims, verifications and email records after it.
