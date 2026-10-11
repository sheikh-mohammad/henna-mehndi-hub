# Plan — Henna Design Hub (the HOW)

> Companion to `spec.md`. The spec defines behaviour; this file defines the technology and
> structure. If the two disagree, the spec wins and this file is corrected.

## 1. Stack

| Concern      | Choice                                                       |
| ------------ | ------------------------------------------------------------ |
| Frontend     | Next.js (App Router, TypeScript), Tailwind CSS               |
| API          | Express.js REST API (TypeScript), Zod validation             |
| Database     | Neon Postgres + Drizzle ORM                                  |
| Images       | Cloudinary (signed direct uploads + CDN transforms)          |
| Auth         | Email + password; hash with bcrypt; httpOnly cookie session  |
| Deploy       | Next.js on Vercel; Express on Render/Railway/Fly; Neon; Cloudinary |

## 2. Architecture

- The **Next.js** app renders the UI (SSR/RSC) and calls the **Express API** for all data.
- The **Express API** owns auth, designs, uploads, moderation, and the importer.
- **Cloudinary** stores/serves images; the API only issues upload signatures and stores URLs.
- **Neon Postgres** stores structured data via Drizzle.

```
browser ──▶ Next.js (UI, SSR) ──▶ Express API ──▶ Neon Postgres
                    │                   └──────▶ Cloudinary (signature + metadata)
                    └──────────────────────────▶ Cloudinary CDN (image bytes)
```

Cross-service auth uses an **httpOnly session cookie** issued by the API. CORS is restricted to
the web origin with credentials enabled.

## 3. Repository layout (monorepo)

```
/apps/web            Next.js frontend
/apps/api            Express API
/packages/shared     Shared TypeScript types + Zod schemas
/specs               Spec, plan, research
/docs                Research findings
```

npm workspaces. Shared validation schemas prevent frontend/backend drift.

## 4. Data model (Drizzle)

**users** — `id`, `email` (unique), `passwordHash`, `displayName`, `role` (`user`|`admin`), `createdAt`
**sessions** — `id`, `userId`, `expiresAt` (server-side sessions, revocable)
**designs** — `id`, `ownerId` (nullable → imported), `title`, `description`, `imageUrl`,
`imagePublicId`, `style`, `bodyPart`, `occasion`, `difficulty`, `status`
(`pending`|`approved`|`rejected`), `rejectionReason`, `sourceAttribution`, `sourceUrl`,
`sourceLicense`, `createdAt`, `updatedAt`, `deletedAt` (soft delete)
**likes** *(phase 2)* — `userId`, `designId`, unique pair
**comments** *(phase 2)* — `id`, `userId`, `designId`, `body`, `status`, `createdAt`

Category values are Postgres enums for MVP (replaceable by a tag table later without changing
user-visible behaviour):

- **style:** Arabic, Indian, Pakistani, Moroccan, Indo-Arabic, Floral, Minimal, Bridal
- **bodyPart:** Hand (palm), Hand (back), Wrist, Forearm, Foot, Ankle, Arm
- **occasion:** Bridal, Eid, Diwali, Festival, Party, Casual
- **difficulty:** Easy, Medium, Hard

## 5. API surface (Express)

- `POST /auth/register` · `POST /auth/login` · `POST /auth/logout` · `GET /auth/me`
- `GET /designs` (search, filters, pagination) · `GET /designs/:id`
- `POST /designs` (auth, multipart) → creates `pending`
- `PATCH /designs/:id` · `DELETE /designs/:id` (owner only → soft delete)
- `GET /users/:id` (public profile + approved designs)
- `GET /uploads/sign` (auth) → Cloudinary signature
- `GET /admin/designs?status=pending` · `PATCH /admin/designs/:id/approve` · `PATCH /admin/designs/:id/reject`
- `GET /meta` → category options for filter UI
- *(phase 2)* `POST /designs/:id/like` · `POST /designs/:id/comments`

## 6. Security & validation

- Passwords hashed with bcrypt (cost ≥ 12). Generic auth error messages.
- Server-side ownership/role checks on every mutating route.
- Zod schemas for all request bodies; shared with the frontend.
- Upload guard: allowed types `image/jpeg|png|webp`, max 10 MB, verified via Cloudinary.
- Rate limiting on `/auth/register` and `POST /designs`.
- httpOnly + Secure + SameSite cookies; CORS allowlist; Helmet.

## 7. Importer

- A script in `apps/api` that pulls from **licensed sources** (Pexels / Pixabay / Unsplash /
  Wikimedia Commons) via their APIs, downloading images, uploading to Cloudinary, and inserting
  designs with full attribution (`author`, `license`, `sourceUrl`).
- Imported designs are inserted as **approved** with `ownerId = null`.
- Target: ≥ 1,000 designs. Idempotent by source URL to allow safe re-runs.

## 8. Build phases (each = spec-checked, committed, pushed)

1. Monorepo scaffold, shared types, Drizzle schema, migrations.
2. Express auth (register/login/logout/session).
3. Express designs CRUD + Cloudinary signed upload + admin moderation.
4. Next.js gallery + search/filters + design detail + artist profiles.
5. Next.js auth pages + upload flow + "My designs" + admin moderation UI.
6. Importer + seed ≥ 1,000 licensed designs.
7. *(later)* Likes/favorites and comments.

## 9. Deferred / follow-ups

- Email verification, password reset, and email delivery.
- Social login.
- Automated tests per layer (target: API route tests + a few end-to-end flows).
- Replace enum categories with a managed tag table if flexibility is needed.
