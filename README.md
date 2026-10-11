# Henna Design Hub

A public gallery for showcasing **1,000+ henna/mehndi designs**, where registered users can
contribute their own designs attributed to their name, and anyone can browse, search, and
discover them. Submissions are reviewed by admins before they appear publicly.

## Status

Spec-driven, pre-build. See:

- [`specs/001-henna-design-hub/spec.md`](specs/001-henna-design-hub/spec.md) — behaviour (the WHAT)
- [`specs/001-henna-design-hub/plan.md`](specs/001-henna-design-hub/plan.md) — technology (the HOW)
- [`docs/research-findings.md`](docs/research-findings.md) — research notes

## Stack

- **Frontend:** Next.js (App Router, TypeScript) + Tailwind CSS
- **API:** Express.js (TypeScript) + Zod
- **Database:** Neon Postgres + Drizzle ORM
- **Images:** Cloudinary (signed direct uploads + CDN)
- **Auth:** Email + password, bcrypt, httpOnly cookie sessions

## Repository layout

```
apps/web          Next.js frontend
apps/api          Express REST API
packages/shared   Shared types + Zod schemas
specs/            Spec and plan
docs/             Research and notes
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
