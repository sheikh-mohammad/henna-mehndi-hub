# AGENTS.md — Henna Design Hub

Guidance for agentic coding tools working in this repository.

## Project

A public gallery of 1,000+ henna/mehndi designs. Registered users contribute designs attributed
to their name; admins approve submissions before they appear publicly.

## Spec-driven development (this project)

The spec is the source of truth; code is a build output. Follow the loop:

1. **Research** — investigate before writing. Findings go in `docs/`.
2. **Specify** — `specs/001-henna-design-hub/spec.md` is technology-free (the WHAT). Never put
   framework/database/layout choices in the spec.
3. **Clarify** — interview the user; fold answers into the spec before building.
4. **Plan** — `specs/001-henna-design-hub/plan.md` holds the HOW (Next.js + Express + Neon + Cloudinary).
5. **Build** — small, verifiable steps.

Rules:

- A behaviour change starts in the spec. Spec diff and code diff ship in the **same commit**.
- If a gap appears mid-build: stop, fix the spec, then continue.
- If spec and plan disagree, the spec wins and the plan is corrected.
- Update the acceptance criteria in the spec as they are met.

## Commits and pushes

- **Commit and push after every small, self-contained change.** Do not batch unrelated work.
- Before committing: `git status`, `git diff`, and `git log --oneline -10`.
- Write concise commit messages in the imperative mood (e.g. `Add design upload endpoint`).
- Never commit secrets or `.env` files. Do not amend or force-push unless explicitly asked.

## Stack & architecture

- **Monorepo (Nx):** `apps/web` (Next.js), `apps/api` (Express on a dedicated Node server),
  `apps/importer` (bulk-import CLI), `packages/shared` (types, Zod schemas, Drizzle schema).
- The frontend never talks to the database directly; it calls the Express API.
- Shared request/response schemas live in `packages/shared` to prevent drift.
- Auth: Argon2id password hashing, DB-backed server sessions via `express-session` + Neon (pg),
  httpOnly cookies, CSRF (SameSite + Fetch-Metadata/Origin checks + double-submit token).
- The browser reaches the API same-site through a Next.js rewrite (`/api/*` → Express); CORS is
  only needed if the API is ever exposed directly (exact allowlist, credentials, `Vary: Origin`).

## Conventions

- TypeScript everywhere; strict mode.
- No comments unless they explain non-obvious intent.
- Validation with Zod at the API boundary; never trust the client for auth or ownership.
- Server-side authorization checks on every mutating route (role + ownership).
- Category values are enums for MVP (style, body part, occasion, difficulty); see the plan for values.
- Images go to Cloudinary; store only URL + public id in Postgres.
- Imported designs come only from sources that permit self-hosting; record source, author, and license.

## Commands (planned)

| Command             | Purpose                             |
| ------------------- | ----------------------------------- |
| `npm run dev`       | Run frontend + API in watch mode    |
| `npm run build`     | Build both apps                     |
| `npm run lint`      | Lint all workspaces                 |
| `npm run typecheck` | Type-check all workspaces           |
| `npm run db:push`   | Push Drizzle schema to the database |
| `npm run import`    | Run the bulk design importer        |

Always run `npm run lint` and `npm run typecheck` before considering a task complete.

## Security

- Never log or commit secrets. Use environment variables.
- Validate file uploads: allowed types `image/jpeg|png|webp`, max 10 MB.
- Rate-limit registration and upload routes.
- Soft-delete designs so likes/comments/audit history survive.
