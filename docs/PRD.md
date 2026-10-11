# PRD — Henna Design Hub

> Product Requirements Document. This is the single source of truth for the **product
> (management)** — it merges the behavioural spec and the technical plan into one document.
> Implementation scaffolding steps live in `specs/setup.md` + `specs/plan.md`; deep research in
> `docs/research-findings.md`. Status: MVP defined, not yet built (build order in §9).

## 1. Overview

### Problem

Henna/mehndi artists and enthusiasts have no single, trustworthy public place to showcase and
discover a large collection of designs. Existing galleries are scattered, do not attribute works
to named artists, and do not let users contribute their own designs.

### Goal

Give henna/mehndi artists and enthusiasts a single public place to showcase and discover a
collection of 1,000+ designs. Registered users contribute their own designs, each attributed to
their name, while anyone can browse, search, and view the collection. Admins keep the public
gallery trustworthy by approving submissions before they appear.

### Success metrics

- ≥1,000 designs visible in the public gallery (licensed imports + user submissions).
- Registered users can upload and see their own status (pending/approved/rejected).
- Design-detail and artist-profile pages are indexed and shareable.
- Moderation keeps the public surface free of spam, duplicates, and unlicensed content.

## 2. Users & personas

| Persona | Role | Key needs |
| --- | --- | --- |
| Casual visitor | Not logged in | Browse, search, filter, open designs/artists |
| Henna artist (contributor) | Registered user | Upload work with their name, see moderation status, manage own designs |
| Admin / moderator | Admin role | Approve/reject, remove content, handle reports/takedowns |

Roles: **visitor**, **user**, **admin**. Admin is assigned, never self-selected.

## 3. User scenarios

- A visitor opens the site → sees a gallery of published designs with thumbnail, title, artist name.
- A visitor searches or filters → gets only matching designs; the result view is shareable via URL.
- A visitor opens a design → sees the large image, its details, and the artist's name/profile.
- A visitor opens an artist profile → sees that artist's published designs.
- A user signs up (email + password) → gets an account and a display (artist) name.
- A user uploads a design → it becomes **pending** and is told it awaits review.
- A user views "My designs" → sees each design's status; a rejection shows the reason.
- A user edits/deletes their own design → applied; others' designs are untouchable.
- An admin opens the moderation queue → approves or rejects with a reason; can remove published designs.
- An admin runs the importer → licensed designs are loaded with attribution.
- *(Phase 2)* A user likes/saves a design → it appears in their saved list; counts update.
- *(Phase 2)* A user comments on a design → it shows publicly; admins can remove it.

## 4. Functional requirements

### Accounts & access

- **FR-1** A user can register with an email and password. Email must be unique.
- **FR-2** A user can log in and log out; a session persists across page reloads.
- **FR-3** A user has a display (artist) name, shown on every design they own.
- **FR-4** Roles: visitor, user, admin; admin is assigned, never self-selected.
- **FR-5** Protected actions (upload, edit, delete, moderate) require the role and are enforced
  by the server, not only the UI.

### Designs

- **FR-6** A design = one image, a title, an owner (or attribution for imported work), an optional
  description, and categories: style, body part, occasion, difficulty (+ optional colour/medium,
  coverage, era).
- **FR-7** A logged-in user submits a design via a form with an image upload.
- **FR-8** A new submission is **pending** and is NOT shown publicly until approved.
- **FR-9** An owner can edit metadata of, and delete, their own design.
- **FR-10** A rejected design shows the rejection reason to its owner.
- **FR-11** A design detail page shows: large image, title, artist name (linked), categories,
  description, date added.
- **FR-12** The upload form requires an unchecked-by-default ownership confirmation that the work
  is the user's own or they have permission to share it.
- **FR-13** "Black henna" (PPD) is never a style/category; it is only an upload-time safety warning
  and a search synonym that routes to that warning.

### Gallery & discovery

- **FR-14** The gallery shows only approved designs, newest first, with pagination/progressive loading.
- **FR-15** Free-text search over title, description, artist name, and categories.
- **FR-16** Filters by style, body part, occasion, difficulty; combine (AND across types).
- **FR-17** Search/filter state reflected in the URL (shareable/bookmarkable).
- **FR-18** No matches → clear empty state.
- **FR-19** Gallery usable on mobile and desktop.

### Artist profiles

- **FR-20** Each user has a public profile: display name + their approved designs.

### Moderation

- **FR-21** An admin sees the pending queue.
- **FR-22** An admin approves or rejects with a reason.
- **FR-23** An admin can remove (unpublish) any published design.
- **FR-24** Only admins access moderation features.
- **FR-25** Visitors can report a design (or comment) with a reason; reports are private to admins;
  many reports on one design collapse to a single review item.
- **FR-26** A public takedown/reporting contact exists; confirmed infringing content is removed.

### Import

- **FR-27** An importer loads designs from explicitly licensed, re-hostable sources (target ≥1,000).
- **FR-28** Every imported design records source, author, license, and original URL.
- **FR-29** Imported designs without an owner show an attribution label, not a profile link.

### Phase 2 — Likes & comments

- **FR-30** A logged-in user can like/unlike a design exactly once; a count is shown.
- **FR-31** A logged-in user can comment on a design; comments are public and removable by an admin.

## 5. Edge cases & rules

- Duplicate email on registration → clear error; no account created.
- Wrong credentials → generic error; do not reveal which field was wrong.
- Uploads: non-image, corrupted, or oversized files rejected with a clear message; large images
  resized/compressed.
- Missing required fields → validation error; nothing saved.
- Unauthenticated/unauthorized actions → blocked/redirected, enforced server-side.
- Cross-user access: editing/deleting another user's design is denied even when crafted manually.
- Deleted/unpublished designs are unreachable by direct link for non-owners/admins.
- Display name: 2–50 chars, trimmed, not all-whitespace; need not be unique.
- Search input: empty string returns all; special characters must not break the query.
- Pagination beyond the last page → sensible empty result, not an error.
- Rate limiting on registration, upload, and reports.
- Ownership attestation required before an upload is accepted.
- "Black henna" searches → safety warning, never designs.
- Reports: ≤1 per user per design per day; duplicates collapse into one review item.
- Imported content only from sources permitting re-hosting; source/author/license/URL mandatory.
- Imported designs may have no owner; UI must not error.
- Deletion policy: hide (soft-delete) so likes/comments/audit survive.

## 6. Non-functional requirements

- **Performance:** LCP < 2.5 s, CLS < 0.1, INP < 200 ms; grid thumbnails 30–80 KB; right-sized
  responsive images; keyset pagination (no deep OFFSET).
- **Search:** Postgres `tsvector` + `pg_trgm` (title/artist fuzzy); category filters via indexed
  equality; spelling synonyms (`mehndi`↔`henna`, `mehendi`, `mehandi`, `mendhi`…). No external
  search engine at ≤100k rows.
- **Security:** Argon2id password hashing; DB-backed server sessions in httpOnly `__Host-`
  cookies; CSRF (SameSite + `Sec-Fetch-Site`/Origin checks + double-submit token); server-side
  ownership checks; strict CSP; sanitize server-side (plain-text comments); rate limits on
  register/login/upload/report; never log or commit secrets.
- **Privacy:** reporter identity never shown to the reported user; rejected-media retained ~30 days.
- **Attribution & law:** imported images carry license metadata; model/personality-rights triage
  on recognizable people; DMCA takedown contact before public UGC launch; `mehndi` canonical.
- **Accessibility & devices:** responsive on mobile and desktop; reserved image dimensions to
  avoid CLS; alt text on design images.

## 7. Solution overview & technical approach

- **Monorepo:** Nx (`apps/web`, `apps/api`, `apps/importer`, `packages/shared`).
- **Frontend:** Next.js (App Router, TypeScript, Tailwind). SSR gallery grid + per-design pages
  (SEO), keyset infinite scroll, URL-driven filters, ISR + `revalidateTag` on approval.
- **Backend:** Express on a **dedicated Node.js server** (TypeScript, Zod at the boundary).
  Browser reaches it **same-site** via a Next.js rewrite (`/api/*` → Express) so cookies stay
  first-party; CORS only if exposed directly.
- **Database:** Neon Postgres + Drizzle ORM. Partial composite indexes for the feed/filters,
  `search_vector` (generated), denormalized `artist_name` + `like_count`/`comment_count`, soft
  deletes, tables for users/sessions/tokens/designs/reports/audit (see research doc for schema).
- **Images:** Cloudinary signed direct uploads; store URL + public id only; `f_auto,q_auto`,
  fixed `srcset`, Strict Transformations, eager grid variants; server-side validation
  (type/≤10 MB/dimensions) after upload.
- **Auth:** email + password; Argon2id; `express-session` on Neon `pg`; email verification gates
  uploads (token table designed now; sending deferred).
- **Moderation:** pre-moderation queue with fixed reason codes; append-only audit log; pHash
  dedup triage; free image-moderation triage routed to the human queue (never auto-reject);
  Cloudflare Turnstile on registration.
- **Importer:** Wikimedia Commons (CC0/PD/CC-BY/CC-BY-SA via `extmetadata`) + curated Pixabay
  + direct artist permission manifests. **Excluded:** Unsplash (hotlink-only, anti-compilation),
  Pexels (bulk import prohibited).
- **Deploy (targets):** Next.js on Vercel; Express on Render/Railway/Fly (Node service); Neon;
  Cloudinary; custom domains before launch.

## 8. Out of scope

- Payments, subscriptions, or commissions (MVP).
- Direct messaging; real-time notifications; AI generation/auto-tagging.
- Social login; full i18n; native mobile apps.
- Email verification/reset delivery (MVP; token mechanism designed). DMCA agent registration
  happens before public UGC launch.
- Deep category taxonomy beyond MVP enums (tag table later if needed).

## 9. Release plan

1. **Setup** — Nx monorepo + apps + shared lib, tooling green (`specs/setup.md`/`specs/plan.md`).
2. **Database** — Drizzle schema + Neon migration, env handling.
3. **Auth** — register/login/logout/sessions, Argon2id, CSRF, rate limits, Turnstile.
4. **Designs** — signed Cloudinary uploads, create/edit/delete, pending status, pHash, attestation.
5. **Admin/moderation** — queue, approve/reject (reason codes), takedown, reports, audit log.
6. **Web** — gallery + search/filters + detail + artist profiles, then auth + upload + "My
   designs" + admin UI (responsive).
7. **Import** — importer + first licensed batch into the collection.
8. *(Phase 2)* Likes/favorites + comments (+ moderation + reporting).
9. *(Follow-ups)* Verification/reset email delivery, DMCA page, automated tests.

## 10. Acceptance criteria

- [ ] Public gallery lists approved designs, newest first, responsive (mobile + desktop).
- [ ] Text search and combined filters return correct results and update the URL.
- [ ] Design detail and public artist profile pages work and are indexed.
- [ ] Register, log in, log out, and persistent sessions work.
- [ ] A logged-in user can upload a design; it is pending and hidden publicly.
- [ ] Owners see statuses, can edit/delete their own designs, and cannot modify others'
      (verified server-side).
- [ ] An admin can approve/reject with a reason and remove published designs; the reason is
      visible to the owner.
- [ ] Visitors can report a design; reports reach the admin privately; "black henna" is not a filter.
- [ ] The importer loads designs (target ≥1,000) with attribution, from re-hostable sources only.
- [ ] Invalid uploads (type/size) show clear errors.
- [ ] Likes/favorites and comments defined for the next phase, out of this MVP.