# The Face & The Crown Live Show · Multi-page demo

**Status:** Shared fictional registration, voting, contestant dashboard and staff operations are implemented on a separate development branch. This is **not** the final real-money production system.

## URLs and separation

- Public new platform review: https://tftc-platform-dev.vercel.app/
- Existing Benjamin single-page reference: https://tftc-live-show-demo-pp074s3w9-koriai.vercel.app/
- Existing primary TFTC site: https://tftc-live-show-demo.vercel.app/
- Git branch: `feature/tftc-platform-supabase-20261104`
- Vercel project: `tftc-platform-dev`
- Supabase project: `tftc-live-show-demo` (`slqwvbqpsmrwwlzrtxgi`)

These three website URLs remain distinct. **Do not merge or assign the new platform to the main TFTC site without explicit user approval.** The stable new development alias is reassigned manually after a tested build; Git previews build automatically but do not automatically update that alias.

## Multi-page structure

Public: `/`, `/contestants`, `/contestant/TFTC-0057`, `/leaderboard`, `/finalists`, `/about`, `/rules`, `/privacy`, `/contact`.

Contestants: `/register`, `/login`, `/dashboard` (access-code demo account); `/dashboard?code=TFTC-0057` (public fictional persona preview, not private login).

Admin: `/admin/login`, `/admin` (private staff **demo** access code).

## What's implemented

- TFTC visual system v2: near-black canvas, charcoal panels, warm gold primary actions, light typography and restrained green/red status colours. See [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md); reference images are retained in `design-references/`.
- 26 initial fictional contestants plus publicly registered **fictional** demo entries. The public directory supports search by name/ID, category and city filters, sorting, zero-results handling and shareable profile links. Individual profiles show eligibility, rank and a clearly labeled nonfunctional audition-media placeholder.
- Official demo bundles: 1=₦50, 11=₦500, 25=₦1,000, 70=₦2,500, 155=₦5,000, 325=₦10,000.
- A guarded Supabase Edge Function and atomic Postgres function credit **shared** mock vote totals, log unique transaction references, prevent retry double-credit, and enforce rate limits. Failed mock transactions credit zero votes.
- Provisional public leaderboard and Top 20, refreshed approximately every 10 seconds when open. Ties prefer the earlier last-credit timestamp.
- Simulated ₦2,000 registration; generates a unique ID and high-entropy demo access code, stores only the *hash* of the code. Fictional public data is stored in Supabase. Fields that resemble PII remain browser-only and are not sent or stored.
- Separate access-code contestant dashboard with Overview, Voting activity and My profile tabs. It displays vote totals, rank, recent mock transaction history (credited and declined), registration date, and shareable voting URL. Registered fictional entrants can edit their own public stage name, city, state, category and bio through a guarded RPC. Sample personas remain clearly marked.
- Separate staff demonstration using a private code not published in Git or the website. The code is stored as a hash in Supabase. A staff visitor can see mock statistics, transaction logs and activity, edit fictional stage names/city/bio, suspend/disqualify/restore contestants, freeze/resume voting, change phases and export dummy JSON.
- RLS on all exposed tables; browser roles cannot directly write vote ledger or staff actions. Edge Functions check a publishable app key and only invoke restricted service-role RPCs. The high-entropy staff and contestant codes are demo controls, **not** production authentication.

## Tests performed (2026-11-04)

- Shared mock voting: Minister Amara 3,420 → 3,421 with exactly one credited vote.
- Failed mock payment: 11-vote failure credited zero.
- Mock registration created TFTC-0057, then its access-code dashboard loaded at rank #27.
- Second browser credited 11 votes to TFTC-0057; first browser dashboard showed 11 votes and one transaction.
- Staff login accepted the private code and rejected a wrong code.
- Staff disqualified and restored TFTC-0057; final status `approved`.
- Staff froze voting; a new mock vote was rejected with "Demo voting is closed"; voting subsequently unfrozen and phase reset to `voting`.
- Transaction, registration and access-code SQL tests used a rollback to leave no test records; browser tests did create three permanent dummy vote transactions and one fictional registration.
- Supabase security advisor reports only informational "RLS enabled, no policy" notices on internal service-only tables, which deliberately deny public access.
- The new development review URL is public without Vercel Authentication; the original review and primary TFTC site have not been overwritten.

## Pass 1 acceptance tests (2026-11-04)

- [x] Directory search `TFTC-0057` returned only Demo Ada Test.
- [x] Gospel songwriter category filter returned 11 matching entries; Lagos city filter returned two matching entries at the time of testing.
- [x] Public contestant profile showed rank, sample biography, sharing actions and an explicitly labeled audition placeholder.
- [x] Created fictional contestant TFTC-0058 with simulated registration.
- [x] Opened TFTC-0058 dashboard with 0 initial votes; Overview, Voting activity and My profile tabs loaded.
- [x] Edited TFTC-0058's name, city, state, category and bio; the public profile showed the updated details.
- [x] Recorded a credited 11-vote and declined 1-vote mock transaction via the guarded database function, preserving competition phase using a transaction.
- [x] The dashboard showed 11 votes, 1 successful transaction and both sample receipts with correct success/failure.
- [x] Unauthorized direct public execution of the profile-editing RPC denied (anon/authenticated false; service role true).
- [ ] Full 375px browser and device layout testing. The automated mobile walkthrough timed out; no pass is claimed.

**Shared review state:** Another demo session left the competition phase as `finale` and TFTC-0014 (Minister Amara) `disqualified`. We deliberately did not silently alter these states. These settings block new voting and remove that contestant from public listings until staff restores them. Staff can change the demo phase to `voting` when testing payments.

## Remaining acceptance and future-production work

- [ ] Real-device mobile, tablet, desktop and keyboard QA. The latest automated mobile walkthrough timed out.
- [ ] Underage, empty-field, invalid access-code and registration failure browser edge cases.
- [ ] Full staff edit/profile and phase-switch QA; transaction export QA.
- [ ] Complete consent/media agreement and confirmed organizer contact information.
- [x] Contestant dashboard transaction details and fictional public profile editing, including role-specific access-code checks.
- [ ] Additional account settings and stronger authenticated identity for production.
- [ ] Proper user-per-person Supabase Auth and admin RBAC/2FA for eventual **production**; current demo access codes are intentionally temporary.
- [ ] Actual payment verification, receipt reconciliation, webhook idempotency, anti-abuse controls, notification delivery, uploads, audit hardening, final judging rules, legal and performance review. These are **not** needed for the mock demo but are essential before real-money launch.

## Setup

`npm install`, then `npm run dev` in `tftc-platform/`. Configure only `NEXT_PUBLIC_SUPABASE_URL` and the `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in local `.env.local`. Never place Supabase secret or service-role keys in browser-exposed configuration.

No real payments, emails or SMS are sent from this demo, and it must not be used for actual contestants' personal data.

## Gradual-build UX and external-media enhancement (staged release candidate)

The TFTC design uses the charcoal-and-gold system documented in [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md). No cinematic homepage is included.

- Public visitor: discover fictional contestants, view illustrated stand-in portraits, share a unique /contestant/TFTC-XXXX profile URL, watch an approved YouTube link in a privacy-enhanced player after clicking, or open an approved SoundCloud link. The empty state is intentional if no media has been approved.
- Supporter: select one of six fixed voting bundles, see fictional supporter detail fields (browser-only), simulate a successful or failed checkout and check public ranking. No payment, email or SMS is sent, and no real voter data is stored.
- Contestant: fictional registration progress, local-only photo preview, copyable demo access code and profile link, private code-based login/logout, profile editor, vote history and external media submission. Only YouTube or SoundCloud links are accepted, not video file uploads.
- Staff: temporary review shortcut in public navigation (must be removed before launch), separate admin layout, tabbed studio, status and phase confirmation, media moderation, reporting and CSV samples, plus logout. A media link is public only after a staff member approves it.
- Storage: contestant_media table in Supabase uses RLS. The public role can only read approved items. All changes run through Edge Functions and privileged RPCs with validated demo access codes. This is not real Supabase Auth and not suitable for production financial processing.
- Video uploads are deliberately excluded. Brief v3 requires a contestant photo, but no mandatory video-upload registration field; a production photo upload still needs private storage, file validation, moderation, and approved media-rights terms.

Acceptance required after deployment: mobile & desktop screenshot review, fictional registration and access-code login/logout, six mock voting bundles and zero-credit failure, pending YouTube submission, staff approval, public performance reveal, invalid/duplicate URL rejection, admin status/phase controls, CSV file content checks, and browser console check. Do not represent these as passed until observed.


## Pre-Benjamin acceptance: social previews, CSV tests and development QA

- Public contestant URLs generate a unique page title, description, canonical stable preview URL, Twitter summary card, and 1200×630 Open Graph PNG for WhatsApp, LinkedIn and other supported social apps. The artwork is clean and non-cinematic. The preview remains explicitly fictional.
- `/api/social-card?code=TFTC-0014` validates the contestant ID and returns 404 for invalid or unavailable contestants.
- Profiles, directory shares and successful demo voting receipts provide accurate contestant links and a WhatsApp sharing action. No messages are automatically sent.
- Admin CSV reports use the same `lib/csv-utils.mjs` formatter tested by Node's built-in test runner. Cells are quoted, UTF-8 BOM and CRLF are retained, and formula-like values are safely prefixed.
- From `tftc-platform/`, run `npm run test:unit` for the share and export regression tests. For a verified Vercel preview, set `TFTC_TEST_BASE=https://<authorized-preview>.vercel.app` and run `npm run test:smoke`.
- A staged staff browser fixture validates the UI without changing actual contestant status or competition settings. It **does not** replace authenticated integration testing. End-to-end staff authorization, downloaded CSV byte inspection, phase controls and rollback remain acceptance checks where untested.
- Production constraints remain: no real payments or outbound messaging; no `main` merge, plan changes, or production release. Real photo uploads and authentication are future blocks.

## Password-based contestant demonstration login (4 November 2026)

New fictional contestant registrations use an email and password instead of a displayed UUID access code. The email is stored in **Supabase Authentication**, and Supabase Auth stores and verifies the password. This demo never stores plaintext passwords in the TFTC Postgres tables.

- Open `/register`, enter only fictional details and a unique example-domain email, such as `singer11@example.test`, plus a password 12 to 72 characters long containing letters and numbers. Only `example.test`, `example.com`, `example.net` and `example.org` are accepted in this public demonstration. Other real addresses are rejected.
- Registration simulates the original ₦2,000 fee. On successful registration, the server creates a confirmed demonstration Supabase Auth user **without sending a verification email**, then links that user to the contestant row by validating a one-time registration access token.
- Supabase password session tokens support sign-in, refresh, profile editing, media submission, account-only dashboards and sign-out. The public browser receives a publishable key, never the service-role key. The separate tftc-demo-auth Edge Function verifies each bearer token against the Auth service and uses service-role-only RPCs to enforce ownership.
- Existing demonstration accounts and their hashed access codes are preserved. The login page offers an optional migration using the existing private access code plus new fictional email/password.
- No password recovery email is delivered in the demo; production must configure a verified transactional email provider, approved privacy terms, account recovery, security hardening and monitoring before collecting genuine applicant credentials.
- Staff demo authentication is unchanged. Production and `main` are unchanged. All payment flows remain simulated.
- RLS and function privileges block direct client access to the privileged owner lookup and update RPCs.
