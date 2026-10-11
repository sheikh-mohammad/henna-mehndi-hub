# Plan — Workspace & App Scaffold (setup execution)

> Companion to `specs/setup.md`. The setup spec defines what the scaffold must be; this file is
> the ordered HOW. Each step maps to one or more setup requirements (S-#). Spec wins on conflict.

## 0. Ground rules

- Build with the official **Nx 23** tooling so layout matches the current standard.
- The repo already contains committed docs; scaffold generated in a temp dir first, merged in,
  so existing `specs/` and `docs/` are never clobbered.
- Commit + push after each self-contained step. Never commit `.env`.
- Verify vs `specs/setup.md` acceptance criteria before calling a step done.

## 1. Workspace initialization (S-1)

- `create-nx-workspace` with preset `apps` (integrated), npm, eslint, prettier, no Nx Cloud,
  non-interactive.
- Creates: root `nx.json`, `package.json` (npm workspaces `packages/*`), `tsconfig.base.json`,
  `.gitignore`, prettier config, eslint placeholder.
- Extend workspaces to `["apps/*", "packages/*"]` so the apps' dependencies are installed too.
- Set the workspace name to a real scope (e.g. `@henna-hub`) and commit.

## 2. Enable plugins (S-1, S-2, S-3)

- `nx add @nx/next` and `nx add @nx/express` (registers the executors + generators);
  `@nx/js` ships with the template. Add `@nx/node` for the importer CLI.
- Touch `nx.json` to allow the TypeScript/Jest/ESLint plugin wiring; nothing user-facing changes.

## 3. Generate the applications (S-2, S-3, S-4, S-5)

- `nx g @nx/next:app web --directory=apps/web` — Next.js **App Router**, TypeScript, eslint.
- `nx g @nx/express:app api --directory=apps/api` — Express app on a **dedicated Node server**
  (own entrypoint + port), TypeScript.
- `nx g @nx/node:app importer --directory=apps/importer` — TypeScript CLI stub.
- `nx g @nx/js:lib shared --directory=packages/shared` — typed library for later
  schemas/types (S-5); currently exports a placeholder.
- Remove generator boilerplate that would fail lint (e.g., unused default exports) and commit
  the four generated projects as one step, checking `nx show projects` (S-6 gate).

## 4. Wire the root scripts (S-6, S-7)

- `package.json` scripts:
  - `dev` → `nx run-many -t serve --all` (web Next dev + api Node watch; ports 3000 / 4000).
  - `build` → `nx run-many -t build --all`.
  - `lint` → `nx run-many -t lint --all`.
  - `typecheck` → `nx run-many -t typecheck --all`.
  - `db:push` / `db:studio` / `import` → placeholders wired in later phases (S-4 note).
- Add **health endpoint**: `GET /health` on the API returns `{ "status": "ok" }`.
- Commit after the scripts exist and the api serves `/health` locally.

## 5. Hygiene & environment (S-8)

- Root `.env.example` listing `DATABASE_URL`, `SESSION_SECRET`, `CLOUDINARY_*`, `WEB_ORIGIN`,
  `NEXT_PUBLIC_API_URL`, `API_PORT`, `WEB_PORT` with placeholder values (never real secrets).
- `.gitignore` already covers `node_modules`, `dist`, `.nx`; add `.env`, `.env.*`,
  `!.env.example`.
- A `.nvmrc` (or engines field) pinning Node 24 LTS.
- Commit.

## 6. Verification pass (acceptance criteria)

- `npm install` from root succeeds.
- `npm run dev` starts web (`:3000`) and api (`:4000`); api answers `GET /health`.
- `npm run build`, `npm run lint`, `npm run typecheck` all exit 0.
- `nx show projects` lists `web`, `api`, `importer`, `shared`.
- Tick the `specs/setup.md` acceptance checkboxes, commit, push.

## 7. Post-scaffold note

- No product behaviour is implemented here (out of scope per setup spec §5). Product requirements
  and the eventual architecture live in `docs/PRD.md`; auth, designs, moderation, and import are
  separate, spec-checked phases.