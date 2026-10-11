# Research Findings — Henna Design Hub

> Purpose: investigate the problem space before writing the spec. No design, no code.
> Date: 2026-10-11

## 1. What is being asked

A public website that:

1. Showcases **1,000+ henna/mehndi designs** in a browsable gallery.
2. Lets **any registered user add their own design**, attributed to their name.
3. Lets everyone **see other people's designs**.
4. Keeps the public gallery clean via **approval before publishing**.

Confirmed decisions from the interview:

| Decision        | Choice                                                    |
| --------------- | --------------------------------------------------------- |
| Contribution    | Full-stack app with a database                            |
| Identity        | Real accounts (email + password)                          |
| Moderation      | Approve before publishing                                 |
| Seed content    | Import 1,000+ designs from the web (licensed sources)     |
| Browsing        | Search + category/tag filters, likes, comments, profiles  |
| MVP scope       | Gallery + auth + upload + admin moderation (extras later) |
| Stack           | Next.js + Express + Neon Postgres + Cloudinary            |
| Architecture    | Next.js frontend + separate Express REST API              |

## 2. How this is usually done

### Contribution / content model

- **Curated gallery** — one team uploads; visitors browse. Lowest risk, no user identity.
- **User-generated gallery with moderation** — accounts + upload + approval queue. Standard for Pinterest-style or community art sites. Matches the request.
- **Fully open posting** — instant publish. High spam/abuse risk; rejected.

### Identity & sessions

- Email + password needs **password hashing** (bcrypt/argon2) and a **session mechanism**.
- Because the frontend and backend are separate services, a **cookie-based session/JWT issued by the Express API** is simpler than Auth.js (which is tightly coupled to Next.js route handlers).
- HTTP-only, Secure, SameSite cookies avoid exposing tokens to JS.

### Image handling

- Web galleries must not store originals in the app server. **Object/media storage + CDN** (Cloudinary, S3, R2) is standard.
- **Signed uploads** let the browser upload directly to storage; the server only signs the request. Avoids proxying large files.
- Store the returned URL + public id in the database; keep the binary out of Postgres.

### Bulk import

- "Scrape anything" is legally unsafe and technically brittle.
- Safe approach: import from **explicitly licensed sources** with attribution:
  - **Pexels / Pixabay / Unsplash** — free licenses, large henna/mehndi collections (Pexels ~12.4K henna photos, Pixabay 700+, Unsplash ~1.4K).
  - **Wikimedia Commons** — public-domain / CC images.
- Importer should record **source, author, license, and source URL** per design.

### Database schema essentials

- Users, designs, tags/categories, likes, comments.
- Designs need a **status** (`pending` / `approved` / `rejected`) and an optional **rejection reason**.
- Imported designs may have **no owner account** → owner column must be nullable, with an attribution label fallback.

## 3. Existing project fit

- Repo is **empty** (only a README and one initial commit). No existing conventions, framework, or code to respect.
- Greenfield: we choose conventions and record them in `AGENTS.md`.

## 4. Failure modes & edge cases to design for

- Duplicate email on signup; weak passwords; wrong-password enumeration.
- Non-image / oversized / corrupt uploads; enormous images.
- Unauthenticated upload attempts; users editing/deleting **others'** designs (authorization must be server-side, not UI-only).
- Rejected designs must show a reason; deleted designs must 404 for non-owners.
- Empty search results; special characters; pagination past the end.
- Spam/abuse → rate limiting on register + upload.
- Attribution/licensing mistakes in the importer.
- Impersonation (name collisions) — mitigated by real accounts; display names need not be unique.

## 5. Trade-offs recorded

- **Express vs Next.js route handlers:** chose Express for a clean, independently deployable API and because the user requested it. Cost: two deployables + CORS/session coordination.
- **Enums vs tag tables:** MVP uses fixed enum categories for speed; a tag table can replace them later without changing the spec's user-visible behaviour.
- **Server sessions vs JWT:** server-side sessions are simpler to revoke; JWT is simpler across services. Plan picks a cookie session issued by the API.
- **Soft-delete vs hard-delete:** prefer soft-delete/hide so likes/comments and audit history survive.

## 6. Open questions deferred to the spec/clarify step

- Exact filter taxonomy (styles, body parts, occasions, difficulty levels).
- Max upload size and allowed formats.
- Whether imported designs are auto-approved.
- Whether email verification is required for MVP.
