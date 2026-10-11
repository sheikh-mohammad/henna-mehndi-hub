# Plan — Henna Design Hub (the HOW)

> Companion to `spec.md`. The spec defines behaviour; this file defines the technology and
> structure. If the two disagree, the spec wins and this file is corrected.

## 1. Stack

| Concern      | Choice                                                       |
| ------------ | ------------------------------------------------------------ |
| Monorepo     | **Nx**                                                        |
| Frontend     | Next.js (App Router, TypeScript), Tailwind CSS                |
| Backend      | **Express.js on a dedicated Node.js server** (TypeScript), Zod |
| Database     | **Neon Postgres** + Drizzle ORM                               |
| Images       | Cloudinary (signed direct uploads + CDN transforms)           |
| Auth         | Email + password; hash with **Argon2id**; DB-backed sessions in httpOnly cookie |
| Deploy       | Next.js on Vercel; Express on Render/Railway/Fly (Node, not serverless wrappers); Neon; Cloudinary |

## 2. Architecture

- Express is a dedicated Node server, independently deployable. The browser reaches it
  **same-site** via a **Next.js rewrite proxy** (`/api/*` → Express) so auth cookies are
  first-party and never rely on cross-site Cookies (`SameSite=None`), which Safari/Firefox block.
  A custom subdomain for the API can be exposed later for non-browser clients.
- Cloudinary stores/serves images; the API issues upload signatures and stores URLs + public ids.
- Neon Postgres stores all structured data.

```
browser ──▶ Next.js (/api/* rewrite) ──▶ Express (dedicated Node server) ──▶ Neon Postgres
                                    │                          └──▶ Cloudinary (sign + metadata)
                                    └──────────────────────────────▶ Cloudinary CDN (image bytes)
```

## 3. Repository layout (Nx)

```
apps/web            Next.js frontend
apps/api            Express API (dedicated server)
apps/importer       Bulk-import CLI/script
packages/shared     Shared types + Zod schemas (+ Drizzle schema)
specs/              Spec, plan
docs/               Research findings
```

Nx tasks: `dev`, `build`, `lint`, `typecheck`, plus `db:push`/`db:studio`/`import`.

## 4. Data model (Drizzle)

**users** — `id`, `email` (unique), `passwordHash` (argon2id), `displayName`, `role`
(`user`|`admin`), `emailVerifiedAt`, `createdAt`
**sessions** — `id`, `userId`, `expiresAt` (managed via `express-session` + Neon `pg` pool;
the store owns its `session` table — excluded from Drizzle migrations)
**tokens** — `id`, `userId`, `tokenHash` (SHA-256, unique), `purpose`
(`verify_email`|`reset_password`), `expiresAt`, `consumedAt`, `createdAt`
**designs** — `id`, `ownerId` (nullable → imported), `title`, `description`, `imageUrl`,
`imagePublicId`, `phash` (perceptual hash for dedup), `style`, `placement`, `occasion`,
`difficulty`, `color`, `coverage`, `era`, `status` (`pending`|`approved`|`rejected`),
`rejectionReason`, `sourceUrl`, `sourceAuthor`, `sourceLicense`, `licenseVerified`,
`approvedAt`, `createdAt`, `updatedAt`, `deletedAt` (soft delete),
denormalized `artistName`, `likeCount`, `commentCount`, and generated `searchVector`
**reports** — `id`, `reporterId`, `targetType` (`design`|`comment`), `targetId`, `reason`
(enumerated), `context`, `status`, `createdAt`, `resolvedAt`, unique `(reporterId, targetId, day)`
**auditLog** — `id`, `actorId`, `action`, `targetType`, `targetId`, `reasonCode`, `note`,
`beforeSnapshot`, `afterSnapshot`, `createdAt` (append-only)
**likes** *(phase 2)* — `userId`, `designId`, unique pair + `likeCount` maintained atomically
**comments** *(phase 2)* — `id`, `userId`, `designId`, `body` (plain-text), `status`, `createdAt`

### Category enums (from research; stored as Postgres enums, MVP)

- **style:** `indian, pakistani, arabic, indo_arabic, gulf_khaleeji, moroccan, african,
  turkish, persian, modern_fusion`
- **placement:** `palm, back_of_hand, fingers, wrist, forearm, upper_arm, full_arm, foot,
  toes, ankle, calf, back, shoulder, chest, neck, belly, scalp_crown, full_body, multiple`
- **occasion:** `bridal, mehndi_night, engagement, wedding_guest, eid, ramadan, diwali,
  karva_chauth, teej, navratri, raksha_bandhan, party, festival, baby_shower, birthday,
  casual, graduation, corporate, henna_crown, everyday`
- **difficulty:** `easy, medium, hard`
- **color:** `natural, jagua, white_bodypaint, glitter, gold, red_alta`
- **coverage:** `single_motif, finger, half_hand, full_hand, hand_and_wrist, hand_to_forearm,
  half_sleeve, full_arm, foot_only, to_ankle, to_calf, full_leg`
- **era:** `traditional, contemporary, fusion`

`black_henna` is **never** an enum value — spec FR-13.

### Indexes (keyset + partial; avoid N+1)

- Partial `(created_at DESC, id DESC) WHERE status='approved' AND deleted_at IS NULL` (feed).
- Composite `(style, created_at DESC, id DESC)` same partial predicate (single-filter listings); a
  matching composite per frequently filtered column.
- `(owner_id, created_at DESC)` (artist pages, My designs).
- Partial `(created_at DESC) WHERE status='pending'` (moderation queue).
- GIN `search_vector`; GIN `(title gin_trgm_ops)`, `(artist_name gin_trgm_ops)` (fuzzy search).
- Index every FK; unique on `reports(reporterId,targetId,date)`; unique on `tokens(tokenHash)`.

## 5. API surface (Express)

- `POST /auth/register` · `POST /auth/login` · `POST /auth/logout` · `GET /auth/me`
- `POST /uploads/sign` (auth) → Cloudinary signature (locked-down preset, user-scoped)
- `GET /designs` (search, filters, keyset pagination) · `GET /designs/:id`
- `POST /designs` (auth, multipart, attestation required) → creates `pending`
- `PATCH /designs/:id` · `DELETE /designs/:id` (owner only → soft delete)
- `POST /designs/:id/report`
- `GET /users/:id` (public profile + approved designs)
- `GET /admin/designs?status=pending` · `POST /admin/designs/:id/approve` · `POST /admin/designs/:id/reject`
- `POST /admin/designs/:id/takedown` · `GET /admin/reports` · `POST /admin/reports/:id/resolve`
- `GET /meta` → category options
- *(phase 2)* `POST /designs/:id/like` · `GET/POST /designs/:id/comments`

## 6. Security & validation

- **Argon2id** password hashing (OWASP 2026 first choice), generically worded auth errors,
  `argon2.needsRehash()` upgrade path.
- **Sessions:** `express-session` + Neon `pg` pool, httpOnly `__Host-` cookie, regenerate on
  login, destroy on logout, revoke all on password reset. Use the **pooled** Neon connection string.
- **CSRF:** `SameSite=Lax` + `Sec-Fetch-Site`/`Origin` middleware failing closed on unsafe methods
  + signed double-submit token on auth/post routes (`csrf-csrf`).
- **Topology:** Next.js rewrite to a fixed API host (never built from request input); CORS only
  if the API is ever exposed directly (exact allowlist, credentials, `Vary: Origin`).
- **Rate limits** (express-rate-limit v8): login 5/15 min `skipSuccessfulRequests`; register 3–5/hr
  (+ Cloudflare Turnstile verification); upload ~20/hr keyed by user id; reports ≤5/day. Shared
  store if multi-instance.
- **Email verification** gates uploads; token table designed now (hashed, single-use, expiring),
  sending/deferring per MVP.
- **Upload validation:** after Cloudinary upload, verify `resource_type`, format ∈
  `jpg|jpeg|png|webp`, bytes ≤ 10 MB, 400–6000 px; reject + destroy otherwise. Perceived-hash
  (pHash) on ingest; owned by the authenticated user from the session.
- **Moderation triage:** store Cloudinary moderation / optional free OpenAI
  `omni-moderation-latest` score as `high-risk` triage → human queue; never auto-reject on the
  model alone (false positives on bare skin). Fixed rejection reason codes.
- **XSS:** comments plain-text (or server-side parsed Markdown + DOMPurify allowlist); sanitize
  server-side; strict CSP; never `dangerouslySetInnerHTML`.
- **Privacy:** report identity never shown to the reported user; rejected-media retention ~30 days.

## 7. Importer (apps/importer)

- Sources **limited to those that permit self-hosting and re-hosting** and whose terms allow it:
  1. **Wikimedia Commons** — primary; per-file CC0/Public Domain/CC-BY/CC-BY-SA filter via
     `extmetadata`, store author + license + source URL, flag recognizable people for review.
  2. **Pixabay** — curated, rate-limited, modest pull (respect 100 req/60 s, mandatory caching);
     re-host locally to Cloudinary. Attribution included even though not required.
  3. **Direct artist permissions** — written permission imported via a manifest (CSV/JSON), the
     strongest way to close the gap to a quality 1,000.
- **Excluded:** Unsplash (hotlink-only, anti-compilation), Pexels (bulk import prohibited, keys
  paused), Flickr-Common (wrong subject matter).
- Idempotent by `sourceUrl`; imported designs `status = approved`, `ownerId = null`, full
  attribution; normalized to ~2048 px long edge before Cloudinary upload.
- Imported images are stored **on Cloudinary** (self-hosted bytes), never hotlinked.

## 8. Search, pagination & caching

- **Search:** generated `searchVector` (weighted title/artist/description) + GIN for prose;
  `pg_trgm` GIN on title + artist name for fuzzy/typo; `websearch_to_tsquery` on raw input;
  category filters are indexed equality. Synonyms: `mehndi ↔ henna`, `mehendi, mehandi, mendhi, mendi`.
- **Pagination:** keyset on `(created_at, id)`, opaque base64 cursor, `LIMIT n+1` → `has_more`.
  Offset only for the bounded admin queue.
- **Caching:** ISR (`revalidate=3600`) + `revalidateTag('designs')`/`revalidatePath` triggered by
  approval/reject/takedown through a shared-secret revalidation route; CDN-cache public GETs
  (`public, s-maxage=60, stale-while-revalidate=300`); never cache authenticated responses.
- **Images:** `c_fill` + `f_auto,q_auto`; fixed 4-breakpoint `srcset`; Strict Transformations;
  eager-generate only grid variants; LQIP for above-the-fold, dominant-color below; width/height
  reserved to avoid CLS.

## 9. Build phases (each = spec-checked, committed, pushed)

1. Nx monorepo scaffold (`apps/web`, `apps/api`, `apps/importer`, `packages/shared`), shared
   schema + enums, tooling (dev/build/lint/typecheck).
2. Drizzle schema + Neon migration, env template, CI-style checks.
3. Express auth: register/login/logout/session, Argon2id, CSRF, rate limits, Turnstile hook.
4. Express designs: signed Cloudinary uploads, create/edit/delete (pending), ownership checks,
   pHash, attestation.
5. Express admin: moderation queue, approve/reject (reason codes), takedown, reports,
   audit log.
6. Next.js gallery: grid + keyset infinite scroll, search, filters (URL state), detail pages,
   artist profiles.
7. Next.js auth + upload + "My designs" + admin UI (responsive).
8. Importer (Commons + Pixabay + permission manifest) + first licensed import batch.
9. *(phase 2)* Likes/favorites + comments (+ comment moderation/reporting).
10. *(follow-ups)* Email verification + password reset delivery, DMCA/D&I pages, automated tests.

## 10. Deferred / follow-ups

- Email delivery for verification/reset; DMCA agent registration and `/dmca` page before public
  UGC launch.
- Redis sessions + shared rate-limit store if traffic demands multi-instance.
- Automated tests per layer (start: API route tests during build).
- Motif/tag table and multi-select filters if taxonomy flexibility is needed.
- Transparency report / appeal flow for EU users if the site grows.