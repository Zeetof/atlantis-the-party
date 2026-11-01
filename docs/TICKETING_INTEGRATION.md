# Ticketing integration

## Official checkout

All purchase actions point to the organizer's official Popout Tickets page:

```
https://popouttickets.com/events/atpdettydecember
```

Links open in a new tab and carry an external-checkout indicator and an accessible "opens Popout Tickets in a new tab" label. This application does **not** render a checkout, collect card data or claim to process payments. Ticket categories and prices are transcribed from the 4.0 flyer and are marked as unverified until the organizer confirms them.

## What was supplied

The organizer supplied the official ticket URL and flyer prices. **No Popout Tickets API documentation, API key, webhook secret, order-export format or forwarding integration was supplied.** The current integration surface is therefore:

1. A ready-to-use **signed webhook** that a provider or forwarding service can call.
2. A **CSV import** for the provider's order export, with tolerant header matching.
3. A **manual review queue** for everything else.

The CSV aliases are designed to absorb typical export headings, but they are not a confirmed contract. Inspect a real export before the first production import and adjust [src/lib/ticket-csv.ts](../src/lib/ticket-csv.ts) if the provider uses different columns.

Nothing in this repository should be described as a live provider integration until a real signed event or export has been reconciled by the organizer end-to-end.

## Verification model

A claim is eligible for a card only when a matching `TicketVerification` exists with status `VERIFIED`.

Supported sources:

| Source | How it is created | Trust level |
| --- | --- | --- |
| `WEBHOOK` | Signed provider/forwarder event | Provider-signed record |
| `IMPORT` | Organizer uploads the provider's CSV order export at `/admin/import` | Provider export, operator-checked |
| `SANDBOX` | Seed when `DEMO_MODE="true"` | Local demo only; remove before production |
| `MANUAL` | Organizer verifies from `/admin/claims/[id]` using a provider reference | Human-checked record |

Screenshots, unverified numbers and verbal claims are never sufficient on their own. Manual verification requires a provider reference that matches the claim's purchase email.

## Webhook contract

`POST /api/tickets/webhook`

Headers:

| Header | Value |
| --- | --- |
| `Content-Type` | `application/json` |
| `x-atlantis-signature` | `sha256=<hex HMAC-SHA256 of the raw request body>` |

Payload (strict — unknown keys are rejected):

```json
{
  "eventSlug": "atlantis-4",
  "providerRef": "POPOUT-ORDER-REFERENCE",
  "email": "buyer@example.com",
  "quantity": 1,
  "purchasedAt": "2026-12-01T10:00:00.000Z",
  "status": "COMPLETED"
}
```

| Field | Rules |
| --- | --- |
| `eventSlug` | Optional; defaults to `atlantis-4` |
| `providerRef` | 3–120 characters; trimmed, whitespace removed, uppercased before hashing |
| `email` | Valid email, normalised to lowercase before hashing |
| `quantity` | Integer 1–20; defaults to 1 |
| `purchasedAt` | Optional ISO-8601 datetime |
| `status` | `PAID`, `COMPLETED` or `VERIFIED`; defaults to `COMPLETED` |

Example (sign the exact bytes you send; never commit the secret):

```bash
BODY='{"eventSlug":"atlantis-4","providerRef":"POPOUT-ORDER-001","email":"buyer@example.com","quantity":1,"status":"COMPLETED"}'
SIG=$(node -e '
const crypto = require("crypto");
const body = process.argv[1];
const secret = process.env.TICKETING_WEBHOOK_SECRET;
process.stdout.write(crypto.createHmac("sha256", secret).update(body, "utf8").digest("hex"));
' "$BODY")

curl -X POST https://your-site.example/api/tickets/webhook \
  -H "Content-Type: application/json" \
  -H "x-atlantis-signature: sha256=$SIG" \
  --data-raw "$BODY"
```

Responses:

| Status | Meaning |
| --- | --- |
| `201` | New verification stored |
| `200` | Duplicate `providerRef`; existing record returned, nothing changed |
| `400` | Empty body, body over 20 KB, or non-JSON payload |
| `401` | Missing/invalid signature |
| `422` | Valid signature but invalid schema |
| `429` | More than 120 calls per IP per minute |
| `503` | `TICKETING_WEBHOOK_SECRET` is not configured |

Security properties:

- The signature is verified against the **raw body before JSON parsing**.
- The endpoint is idempotent by HMAC hash of the normalised provider reference.
- Raw payloads are capped and stored truncated to 10,000 characters.
- A duplicate reference returns the existing record regardless of a changed email, so the endpoint cannot be used to enumerate or overwrite purchases.
- The provider reference and buyer email are stored as HMAC hashes plus masked/last-four display values.

## CSV import format

`/admin/import` accepts the provider's order export as CSV. Parsing happens in the browser; only validated rows are submitted to the server action. Limits: 2 MB per file and 1,000 data rows per import (split larger exports).

```csv
Order Reference,Email,Quantity,Purchase Date
POPOUT-ORDER-001,buyer@example.com,2,2026-12-01T10:00:00Z
POPOUT-ORDER-002,second@example.com,1,2026-12-02 14:35
```

Required columns:

| Field | Header aliases (normalised: lowercase, non-alphanumerics removed) | Rules |
| --- | --- | --- |
| Order reference | `orderreference`, `orderref`, `reference`, `providerref`, `ticketreference`, `ticketref`, `orderid`, `order` | 3–120 characters; whitespace removed and uppercased |
| Purchaser email | `email`, `emailaddress`, `purchaseremail`, `buyeremail`, `customeremail`, `purchaseemail` | Valid email, max 160 characters, lowercased |
| Quantity | `quantity`, `qty`, `tickets`, `ticketcount` | Whole number 1–20; blank defaults to 1 |
| Purchase date | `purchasedat`, `purchasedate`, `orderdate`, `date` | Optional; any value `new Date()` can parse |

If no recognised header row is present, columns are read positionally in the order above. Quoted fields, escaped quotes, CRLF line endings and a UTF-8 BOM are supported.

Behaviour:

- Each valid row becomes a `VERIFIED` `TicketVerification` with `source: "IMPORT"`, an `IMP-XXXXXXXXXXXX` batch label, encrypted reference and encrypted purchaser email.
- Rows whose normalised reference already exists are skipped and reported. Re-importing the same export is therefore safe.
- Invalid rows (missing reference, bad email, out-of-range quantity, unparseable date, duplicate reference inside the same file) are listed with line numbers and excluded.
- An import does **not** create a claim or a card. It only makes the order eligible for an invitation.
- **One card per verified purchase.** A row with `quantity: 2` still produces one card. To issue one card per attendee, the export must contain one row per attendee; agree that policy with the organizer before importing.

## Invitation flow

Imported buyers do not have to find `/claim` themselves.

1. An organizer opens `/admin/invites` and sends an invitation (single or up to 25 pending per run).
2. The server creates a 256-bit token, stores only its SHA-256 hash plus encrypted ciphertext, and sets a 30-day expiry.
3. The email contains `/claim/invite/<token>`. When Resend is unconfigured the status is `SKIPPED`, and the same link is available through the admin copy control for manual delivery.
4. The buyer opens the link, sees the masked purchaser email, order last four and expiry, then enters a display name and consent.
5. Acceptance creates the claim directly as `VERIFIED`, linked to the verification, and consumes the invitation.
6. Reopening the link reports "already used"; an expired link reports expiry. **New link** on `/admin/invites` rotates the token and invalidates the previous URL.
7. Issuance remains a separate reviewer action, either on `/admin/claims/[id]` or in batches of up to 20 from `/admin/invites`.

A claimed invitation is indistinguishable from a self-submitted matched claim except for `source: "INVITE"`. Neither can be issued twice.

`POST /api/claims/invite` accepts:

```json
{ "token": "<invitation token>", "displayName": "Ada Okafor", "consent": true }
```

| Status | Meaning |
| --- | --- |
| `201` | Claim created; body includes the public reference |
| `400` | Invalid body or invalid token |
| `403` | Cross-origin request |
| `409` | Invitation already used |
| `410` | Invitation expired |
| `429` | More than 10 attempts per IP per hour |
| `503` | Claims are closed in `/admin/event` |

Responses are `Cache-Control: no-store` and never include the purchaser email, order reference or card link.

## Claim flow

1. **Purchase** on Popout Tickets (external).
2. **Submit a claim** at `/claim` with display name, purchase email, ticket/order reference and privacy consent.
3. The server normalises the reference and email, then looks for a `VERIFIED` ticket verification with both matching hashes.
4. If matched, the claim is created as `VERIFIED` and linked to the verification. If not, it is created as `MANUAL_REVIEW`.
5. `POST /api/claims` returns the public claim reference (`ATP4-XXXXXX`). The same reference is never issued for two claims.
6. A duplicate verification claim, or an existing in-review claim for the same email, returns `409` instead of creating another claim.
7. The organizer issues a card from the dashboard. Issuance is refused unless the linked verification is still `VERIFIED`, and is refused if a card already exists.
8. Email delivery is attempted through Resend and recorded as `SENT`, `FAILED`, `SKIPPED` or `PENDING`. Delivery failure does not silently issue a second card.

Claim statuses: `PENDING`, `MANUAL_REVIEW`, `VERIFIED`, `ISSUED`, `REJECTED`.
Verification statuses: `PENDING`, `VERIFIED`, `REJECTED`.

### Manual verification rules

From `/admin/claims/[id]` a reviewer supplies a provider reference. The server:

- rejects references shorter than 4 characters after normalisation;
- refuses a claim that already has a card or verification;
- reuses an existing verification only when its purchaser email hash matches the claim;
- refuses a reference already linked to another claim;
- marks the verification `VERIFIED` and records an audit entry.

Operators must confirm the reference in the provider's own dashboard before entering it. Do not approve based on a screenshot or a number quoted in chat.

## Card link and privacy

- Card URLs use a 256-bit opaque token: `/card/<token>`.
- Only a SHA-256 hash of the token is stored; the encrypted token is kept for admin display, not for lookup.
- Links expire 30 days after issuance. A reviewer can rotate a token from `/admin/cards`.
- `/claim/status` requires both the claim reference and the matching purchase email. It returns a masked email and only the last four digits of the card number; it never returns the card link.
- The card page does not print the raw token, and share/copy actions warn that the link is private.

## Rate limits

| Scope | Limit |
| --- | --- |
| Claim submission per IP | 5 per hour |
| Claim submission per email hash | 3 per day |
| Invitation redemption per IP | 10 per hour |
| Claim status per IP | 12 per hour |
| Webhook per IP | 120 per minute |

Limits are in-memory for a single instance. Replace with a shared store before scaling horizontally.

## Going live (required before any "live" claim)

- [ ] Obtain written provider integration details (API or webhook contract, signing algorithm and secret).
- [ ] Obtain and inspect a real Popout Tickets order export; confirm the column names and whether one row can represent several attendees.
- [ ] Configure `TICKETING_WEBHOOK_SECRET` and deliver a signed production event.
- [ ] Replay the same event and confirm `200 duplicate: true` with no new record.
- [ ] Import the real export, confirm duplicates are skipped, and invite an internal address end to end.
- [ ] Submit a claim with the matching email/reference and confirm it becomes `VERIFIED`.
- [ ] Issue a card and confirm the Resend delivery status is `SENT`.
- [ ] Confirm prices, date, time and venue with the organizer and enable `detailsVerified`.
- [ ] Set `DEMO_MODE="false"` and remove all sandbox and test import records.
