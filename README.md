# Henna Design Hub

A public gallery for showcasing **1,000+ henna/mehndi designs**, where registered users can
contribute their own designs attributed to their name, and anyone can browse, search, and
discover them. Submissions are reviewed by admins before they appear publicly.

## Status

Spec-driven, pre-build. See:

- [`docs/PRD.md`](docs/PRD.md) — product requirements (the WHAT)
- [`specs/setup/plan.md`](specs/setup/plan.md) — how the current step is built (the HOW)
- [`specs/setup/spec.md`](specs/setup/spec.md) — the current setup milestone
- [`docs/research-findings.md`](docs/research-findings.md) — research notes

## Stack

- **Monorepo:** Nx
- **Frontend:** Next.js (App Router, TypeScript) + Tailwind CSS
- **API:** Express.js on a dedicated Node.js server (TypeScript) + Zod
- **Database:** Neon Postgres + Drizzle ORM
- **Images:** Cloudinary (signed direct uploads + CDN)
- **Auth:** Email + password, Argon2id, DB-backed httpOnly cookie sessions

## Repository layout

```
apps/web          Next.js frontend
apps/api          Express REST API (dedicated Node server)
apps/importer     Bulk-import CLI for licensed design sources
packages/shared   Shared types, Zod schemas, Drizzle schema
specs/            Per-milestone docs: specs/setup/ holds the current setup spec + plan
docs/             Product requirements (PRD) and research notes
```

## Getting started

> The app is not scaffolded yet. Planned setup:

```bash
npm install

# environment (fill with your own credentials)
cp .env.example .env

# database
npm run db:push

# run both apps in development
npm run dev
```

### Environment variables

| Variable                | Used by | Description                                  |
| ----------------------- | ------- | -------------------------------------------- |
| `DATABASE_URL`          | api     | Neon Postgres connection string              |
| `SESSION_SECRET`        | api     | Secret for signing session cookies           |
| `CLOUDINARY_CLOUD_NAME` | api     | Cloudinary cloud name                        |
| `CLOUDINARY_API_KEY`    | api     | Cloudinary API key                           |
| `CLOUDINARY_API_SECRET` | api     | Cloudinary API secret                        |
| `WEB_ORIGIN`            | api     | Allowed CORS origin (the Next.js app)        |
| `NEXT_PUBLIC_API_URL`   | web     | Base URL of the Express API                  |

## Scripts (planned)

| Command             | Purpose                              |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Run frontend + API in watch mode     |
| `npm run build`     | Build both apps                      |
| `npm run lint`      | Lint all workspaces                  |
| `npm run typecheck` | Type-check all workspaces            |
| `npm run db:push`   | Push Drizzle schema to the database  |
| `npm run db:studio` | Open Drizzle Studio                  |
| `npm run import`    | Run the bulk design importer         |

## Contributing

This project follows spec-driven development; see [`AGENTS.md`](AGENTS.md). Behaviour changes
start in the spec, and spec + code ship in the same commit.
