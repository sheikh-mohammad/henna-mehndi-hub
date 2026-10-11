# Setup Spec — Initial Monorepo & App Scaffold

> A "build" milestone under the Henna Design Hub spec. As the course says: this work is
> multi-file and maintained, so it earns the full loop — agreed in words before the tree changes.
> The **product** behaviour lives in `spec.md`; this document only defines the **scaffold** the
> product phases will grow into.

## 1. Goal

Turn the empty repo into a working Nx monorepo so later phases can build the Henna Design Hub
incrementally. At the end of this step: `apps/web` (Next.js) and `apps/api` (Express on a
dedicated Node server) run locally, share a `packages/shared` library, pass lint + typecheck,
and every change is committed and pushed.

## 2. User scenarios (developer-facing)

- When a developer runs `npm install`, the whole workspace installs with one command.
- When a developer runs `npm run dev`, the Next.js web app and the Express API both start in
  watch mode together.
- When a developer opens `http://localhost:3000`, they see the Next.js welcome page.
- When a developer hits `http://localhost:4200/api/health` (or the API's port), they get a JSON
  `{ "status": "ok" }` response.
- When a developer runs `npm run build`, `npm run lint`, and `npm run typecheck`, all three pass
  with no errors.
- When a developer adds code, an editor understands the shared `packages/shared` types via
  workspace project references.

## 3. Functional requirements

- **S-1** The workspace root is an **Nx** monorepo with a root `nx.json`, a root
  `package.json` of npm scripts, and a shared root TypeScript config.
- **S-2** `apps/web` is a **Next.js (App Router, TypeScript)** application, created under
  `apps/web` with Nx project configuration.
- **S-3** `apps/api` is an **Express (TypeScript)** application on a **dedicated Node server**
  (a plain Node process, not a serverless wrapper), with its own entrypoint and port.
- **S-4** `apps/importer` is a TypeScript CLI stub (the bulk-import tooling grows here later).
- **S-5** `packages/shared` is a TypeScript library the apps can import; it exports types
  (schema details land in a later phase).
- **S-6** `npm run dev` starts both `apps/web` and `apps/api` in watch mode.
- **S-7** `npm run build`, `npm run lint`, `npm run typecheck` run across all workspaces.
- **S-8** A `.env.example` documents every required variable (no real secrets), and `.gitignore`
  excludes `.env`, `node_modules`, and build output.
- **S-9** Existing files (`specs/`, `docs/`, `README.md`, `AGENTS.md`) are preserved and the
  docs still match the scaffold (README reflects Nx + the two apps).

## 4. Edge cases & rules

- The repo root already is a git repo with committed docs; the scaffold must not delete or
  rewrite specs/docs unless the change is intended and committed separately.
- No `.env` or secrets are committed; only `.env.example`.
- Node version is pinned or documented (Node 24 LTS is present locally).
- TypeScript strict mode is on for all workspaces.
- The scaffold adds only tooling/dependencies needed to make the workspace build — no product
  features (no auth, designs, database, or Cloudinary wiring in this step).
- If the Nx generator cannot run inside the non-empty repo, the workspace is scaffolded in a
  temp directory and merged carefully, keeping existing files.
- Ports: web and api must not collide (e.g., 3000 / 4200 or 3000 / 4000).

## 5. Out of scope (this setup step)

- Any product feature from `spec.md` (auth, designs, uploads, moderation, gallery).
- Database schema, Drizzle migrations, or Neon connection (phase 2).
- Cloudinary integration or real uploads.
- CI/CD pipelines and deploy configuration (documented only).
- Docker setups.
- Tests (lint + typecheck only; test frameworks are a later phase).

## 6. Acceptance criteria

- [ ] `npm install` succeeds from the repo root.
- [ ] `npm run dev` starts both apps; web renders and the API answers `GET /health` with `200`.
- [ ] `npm run build` completes with zero errors across all workspaces.
- [ ] `npm run lint` and `npm run typecheck` pass with zero errors.
- [ ] The Nx task graph runs web, api, importer, and shared (`nx show projects` lists them).
- [ ] `apps/web`, `apps/api`, `apps/importer`, and `packages/shared` exist and are typed.
- [ ] `.env.example` exists, `.env` is gitignored, and no secrets are in the repo.
- [ ] Existing `specs/` and `docs/` are untouched and still consistent with the docs.
- [ ] The finished scaffold is committed and pushed to `origin/main`.