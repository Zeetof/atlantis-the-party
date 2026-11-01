# Qoder instruction: build Atlantis The Party from the supplied media

Read README_FIRST.md and asset_manifest.json. Inspect each media folder before designing anything. Treat the file structure as the source of truth for **which edition each media item belongs to**.

Build a polished, mobile-first, premium event website for **ATLANTIS THE PARTY** by **WESTHAN.ENT** with an editorial black/crimson/chrome identity using the actual flyers and video highlights. This is a music and entertainment party, NOT an underwater-themed event. Avoid generic AI gradient cards, stock festival photography and invented lineups.

## Required information architecture

1. Atlantis 4.0 landing section, December 30: cinematic hero, prominent BUY TICKETS action (use placeholder until genuine checkout URL provided), event facts from flyer marked pending organizer confirmation, animated typography, countdown only with confirmed date/year/timezone, responsive video/photos.
2. **Our Story / Past Editions:** distinct 1.0, 2.0, 3.0 sections with authentic history, each matching their assigned folder. Do not display 3.0 media under other editions. Display the 3.0 date as 'Date to be confirmed' until August 18 vs August 19 mismatch resolved.
3. **Lineup Archives:** Atlantis 2.0 historic artists/DJs/hypemen drawn from its lineup flyer, and independent 4.0 lineup components with 'To be announced' placeholders, not old names.
4. **Atlantis 3.0 gallery:** video thumbnails and an optimized modal player, mobile-friendly, muted autoplay only when useful, lazy loading, no autoplay sound. Exclude the clip in review_before_publishing until organizer approves.
5. **999 Tribute Card:** a stylish, original tribute collectible for verified Dec 30 ticket holders. After a verified ticket purchase, unlock a personalized card with attendee display name, unguessable card identifier, original 999-inspired artwork, admin-chosen official Juice WRLD track and **official listen link/embed**. Send a private claim/access link by email. Do not copy Juice WRLD album art or host copyrighted songs without permission.
6. **Ticket verification:** server-validated purchase via signed ticket-provider webhook/API with idempotency, or organizer-controlled manual ticket claim queue if provider has no API. Never accept screenshots, redirects or query parameters alone as proof. Set up provider adapters and required environment variables as TODOs until provider details provided. No live payment claims until actual end-to-end testing.
7. **Organizer admin:** protected access, manage lineups, galleries, card variants/assignments, ticket claims and email deliveries.
8. **Email:** secure transactional provider integration (e.g., Resend), protected sender secrets, idempotent delivery, resend controls.
9. **Accessibility, security, performance:** strong responsive design on iPhone/macOS, image optimization, WebP/AVIF as appropriate, reduced-motion support, input validation, no exposed secrets, robust errors, rate limits and audits.

## Data fidelity rules

- 1.0: August 18.
- 2.0: December 29; the provided lineup is second edition only.
- 3.0: Organizer says August 19; flyer says August 18. Flag conflict. All videos user-provided are marked as third edition, except a clip that requires review.
- 4.0: December 30 with seventh-anniversary Juice WRLD tribute.
- Do not hallucinate artist confirmations or insert performers from 2.0 into 4.0.
- Distinguish from flyer readings versus independently verified ticket facts.

## Finish criteria

Deliver working app source, functioning pages and local demo, documentation with setup/deployment steps, a media usage manifest and list of missing credentials/ticket provider specifics. Run build/lint/tests; demonstrate the card flow with sandbox/mock ticket purchase events only, clearly labeled, until real integration is configured.
