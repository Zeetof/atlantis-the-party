# Missing information and approvals

This file lists everything the organizer, providers or legal reviewers still need to supply. The site intentionally shows a caveat or a fallback wherever an item is missing. Do not replace these with guesses.

## Launch blockers

### 1. Popout Tickets integration details

**Missing:** API or webhook documentation, signing method, shared secret, field names for order reference and purchaser email, refund/transfer behaviour, and confirmation that the official event URL is final.

**Current behaviour:** purchases link only to `https://popouttickets.com/events/atpdettydecember`. Verification is manual until a signed webhook is configured. The site never claims a live provider integration.

**Needed from:** Popout Tickets and WESTHAN.ENT.

### 1a. Provider order export and one-card-per-order policy

**Missing:** access to the Popout Tickets order export, a sample file showing its real column names, and a decision on how multi-ticket orders map to cards.

**Current behaviour:** `/admin/import` accepts a CSV with order reference, purchaser email, quantity and purchase date. Header matching is tolerant, but the aliases are a best guess until a real export is inspected. Each valid row becomes one verified purchase and can produce **one** card, regardless of quantity.

**Decide:** should a buyer with four tickets receive one card, or one card per attendee? If per attendee, the export must contain one row per attendee (or the organizer must split rows manually). Do not promise per-ticket cards until that export shape is confirmed.

**Needed from:** Popout Tickets and WESTHAN.ENT.

### 2. Resend credentials and sending domain

**Missing:** `RESEND_API_KEY`, a verified sending domain, the final `EMAIL_FROM`, an optional reply-to address, and approval of the invitation, card and reminder email copy.

**Current behaviour:** card and invitation delivery are recorded as `SKIPPED` with the reason "RESEND_API_KEY is not configured." No email is claimed as sent. The admin can copy invitation and card links manually, and retry once configured.

### 3. Atlantis 4.0 facts and prices

**Missing:** written confirmation of the date (December 30, 2026), time (1:00–11:00 PM WAT), venue (Watercress Event Center, Allen, Ikeja, Lagos), and current ticket prices.

**Current behaviour:** `detailsVerified` is off. The homepage and tickets page label details provisional, and all prices carry a `FLYER PRICE` badge. The flyer values currently transcribed are:

| Category | Channel | Flyer price |
| --- | --- | --- |
| Regular | Online | ₦12,000 |
| VIP | Online | ₦25,000 |
| Regular | Gate | ₦20,000 |
| VIP | Gate | ₦35,000 |

**Needed from:** WESTHAN.ENT. Enable **details verified** in `/admin/event` only after sign-off.

### 4. Official streaming links and tribute permissions

**Missing:** exact official track URLs for the approved Juice WRLD songs, chosen platform(s), and written confirmation that the organizer may use the titles and links in a remembrance experience.

**Current behaviour:** six approved titles use Spotify **search** URLs and are marked `SEARCH_FALLBACK` in `/admin/songs`. No lyrics, recordings or album art are included, and the site states it is independent of the estate.

**Needed from:** WESTHAN.ENT, with legal review. Replace every fallback before launch.

### 5. Consent for the held Atlantis 3.0 clip

**Missing:** confirmation of who appears in the 3.7-second personal/portrait clip, their consent, and written organizer approval to publish.

**Current behaviour:** the clip and poster remain in `storage/private`, no public media record has a `src`, and the gallery discloses that one clip is withheld.

**Needed from:** WESTHAN.ENT and the person(s) shown.

## Content confirmations

### 6. Atlantis 3.0 date conflict

The organizer dates 3.0 as **August 19**, while the supplied flyer reads **AUG 18**. The site displays "date under review" and preserves both records. Supply the correct date and the basis for it; do not silently pick one.

### 7. Years for Atlantis 1.0 and 2.0

Only **August 18** (1.0) and **December 29** (2.0) are printed. The years are unconfirmed and are labelled "year to be confirmed" throughout the history pages.

### 8. Atlantis 2.0 lineup credits

The archive flyer supplies 25 names across artists, DJs and hypemen. Confirm:

- exact spellings and name order
- each person's role/category
- permission to reuse the lineup flyer and the Scotty Olorin / Wavestar promos
- whether any name should be removed from the public archive

The 2.0 lineup is archive-only. It must never be presented as a 4.0 lineup.

### 9. Atlantis 4.0 lineup

**Missing:** any confirmed performers, DJs or hypemen. The lineup page intentionally shows "reveal in progress" and no names. Add only organizer-confirmed, correctly spelled names in `/admin/lineup`, with status `CONFIRMED`.

### 10. Sponsors and partners

No sponsors or partners were supplied. None are displayed. Add only written, confirmed partnerships; do not infer them from flyer logos or phone numbers.

### 11. Attendance, capacity and performance statistics

No attendance figures, capacity, or historical ticket-sales numbers were supplied. None are used. If the organizer wants them published, provide the source and the exact figure.

### 12. Contact and social channels

The published phones and WhatsApp link come from the flyer:

- 0708 344 0636
- 0903 561 9633
- WhatsApp: `wa.me/2347083440636`

Confirm both numbers are current and approved for public display, and confirm whether any official social handles or email address should replace the WhatsApp-only route. The site intentionally publishes no unverified email address.

### 13. Age policy, accessibility and venue rules

The FAQ states that no age policy, dress code or accessibility guidance was published. Supply the organizer's final policies if they exist; otherwise the current "check with the organizer" wording is accurate and should stay.

### 14. Media credits and consent

The highlight clips are crowd/performance footage. Confirm whether any performer may be named, and supply credits for photographers/videographers if required. Provide a takedown contact and review the archive for anyone who has withdrawn consent.

## Security and legal review

### 15. Privacy and data retention

The privacy notice describes encryption, access, the 30-day card-link expiry and a request process, but no fixed retention period. The organizer should approve:

- a retention period for claims, verifications, imported purchaser emails, invitation records, cards and email logs
- the lawful basis and consent wording for the 999 tribute
- who can access PII and how requests are handled
- a named privacy contact

### 16. Tribute independence and intellectual property

The site states it is independent of Juice WRLD's estate and uses original artwork only. Legal review should confirm the wording, the use of the artist's name, the remembrance framing, and the approved song titles/links.

### 17. Production infrastructure

Still to provide or decide:

- production host and domain (`NEXT_PUBLIC_SITE_URL`)
- PostgreSQL database and backup policy
- persistent storage or object storage for private uploads
- shared rate-limit store (Redis/Upstash) if scaling beyond one instance
- uptime and error monitoring
- an incident and takedown contact

### 18. Admin staffing and roles

Only the owner account is seeded. Decide which staff need `EDITOR` and `REVIEWER` accounts, create them with bcrypt hashes, and document who may import buyer lists, send invitations, issue cards or rotate links. Importing and inviting are `REVIEWER`-level actions because they expose purchaser data and bearer links. There is no self-service password reset.

## After items are supplied

1. Update the relevant admin records (event facts, prices, songs, media, performers).
2. Re-run `npm run lint`, `npm run test`, `npm run build`, and `npm run qa:smoke`.
3. Confirm the public caveats disappear only where facts are now verified.
4. Remove demo/sandbox records and set `DEMO_MODE="false"` before launch.
5. Record the final approvals (who confirmed what, and when) with the organizer.
