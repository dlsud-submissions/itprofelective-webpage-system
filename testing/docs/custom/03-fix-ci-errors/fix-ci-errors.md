# Fix CI errors on the TS-migration / features-layout PR

PR #2 (`test` → `dev`, "refactor(server): migrate to TypeScript and
features layout") was failing 5 of its 6 CI checks: **Client Build**,
**Client Lint**, **Client Tests**, **Server Lint**, **Server Tests**.
Only **Format Check** was passing.

## What changed

The root cause was the same for all 5 checks: `.github/workflows/ci.yml`
runs `npm run build` / `npm run lint` / `npm test` / `npm run test:run`
**directly inside `client/` and `server/`**, but neither package ever had
those plain-named scripts, an ESLint config, a test runner, or any test
files — this was true before the TS/features refactor too (see
`git show 98a4da1:client/package.json` / `server/package.json`), the
refactor just never added them despite `ci.yml` already expecting them.

Added to `client/`:

- `eslint.config.js` — flat config (`typescript-eslint` recommended +
  `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`, mirroring
  the standard Vite React+TS template).
- `package.json`: `build` (`vite build`), `lint` (`eslint .`), `test` /
  `test:run` (`vitest` / `vitest run`) scripts, plus the matching
  devDependencies (`eslint`, `@eslint/js`, `typescript-eslint`,
  `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`,
  `vitest`).
- Two real unit test files (no DOM/RTL needed — both targets are pure
  functions):
  - `src/features/auth/dashboardPath.test.ts` — role → dashboard route.
  - `src/features/auth/validators/auth.validator.test.ts` — the zod
    `signupSchema`/`loginSchema` accept/reject cases.
- One rule turned off in `eslint.config.js`:
  `react-hooks/set-state-in-effect`. `eslint-plugin-react-hooks@7`'s
  `recommended` config bundles the newer React-Compiler lint rules, and
  this one flags the app's standard "fetch on mount, track a loading
  flag" effect (used in `AuthProvider.tsx` and `CatalogPage.tsx`) even
  though the app has no compiler/query-lib and the pattern is correct
  here. Every other rule in the recommended set is left on and passes
  clean.

Added to `server/`:

- `eslint.config.js` — flat config (`typescript-eslint` recommended,
  Node globals). No rule overrides needed — the existing code was
  already clean against it.
- `package.json`: `lint` (`eslint .`), `test` (`vitest run`) scripts,
  plus matching devDependencies (`eslint`, `@eslint/js`,
  `typescript-eslint`, `globals`, `vitest`).
- Two real unit test files for the two pieces of pure, DB-free request
  logic (everything else in `server/` touches Mongoose/MongoDB, which is
  exercised manually per
  [../01-server-ts-migration/server-ts-migration.md](../01-server-ts-migration/server-ts-migration.md)
  rather than mocked):
  - `src/shared/middleware/requireAdmin.test.ts`
  - `src/shared/middleware/requireStaffOrAdmin.test.ts`

The existing underscore-prefixed scripts (`_dev`, `_build`, `_start`,
`_preview`, `_typecheck`) and everything in root `package.json` that
wraps them are untouched — the new scripts sit alongside them
specifically because CI calls the plain names directly inside each
subdirectory.

## Why this approach

- The plain `build`/`lint`/`test`/`test:run` names are what `ci.yml` has
  called since the very first commit (`git log --follow -- .github/workflows/ci.yml`
  shows no changes to the workflow, ever) — adding sibling scripts is the
  minimal fix and doesn't touch the root orchestration that
  `01-server-ts-migration` and `02-client-features-architecture` already
  documented as intentional.
- Real tests over placeholder ones: both packages had zero test
  infrastructure, so "make the Tests job pass" could have meant a fake
  no-op test. Instead each side got tests against real, currently
  untested logic (role-based dashboard routing + signup/login
  validation on the client; the two role-gating middlewares on the
  server) that will actually catch a regression.
- Disabling `react-hooks/set-state-in-effect` project-wide (rather than
  per-line `eslint-disable` comments) was a deliberate call, not a
  reflex: the flagged pattern is used identically in two unrelated files
  and is the correct, idiomatic approach for a plain `useEffect`
  data-fetch without a query library — see the file-level comment in
  `client/eslint.config.js` for the reasoning.

## Verification already performed

- `npm ci && npm run build` in `client/` (with
  `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` placeholder env vars,
  matching `ci.yml`) — succeeds, produces `client/dist/`.
- `npm ci && npm run lint` in `client/` — 0 errors, 0 warnings.
- `npm ci && npm run test:run` in `client/` — 2 test files, 9 tests, all
  passing.
- `npm ci && npm run lint` in `server/` — 0 errors, 0 warnings.
- `npm ci && npm test` in `server/` — 2 test files, 7 tests, all
  passing.
- `npm --prefix server run _typecheck` and
  `npm --prefix client run _typecheck` — both still pass with zero
  errors (unaffected by this change, but re-checked since new `.ts`/
  `.tsx` test files were added to each `tsconfig.json`'s `include`).
- `npm run format:check` from the repo root — passes for every file
  this change added or touched (checked directly with
  `npx prettier --check <files>` since this Windows checkout's
  `core.autocrlf=true` makes the whole-repo `format:check` report
  false CRLF-vs-LF diffs locally on files nobody edited; `git diff`
  confirms those files have no real content changes, and git's own
  autocrlf normalization re-flattens everything to LF on commit, which
  is what CI's Linux runner will see).

## What you need to do to verify locally

1. **Install dependencies** in both packages (picks up the new
   ESLint/Vitest devDependencies):
   ```
   npm --prefix client install
   npm --prefix server install
   ```
2. **Run each check exactly as CI does**, from the repo root:
   ```
   cd client && npm run build && npm run lint && npm run test:run && cd ..
   cd server && npm run lint && npm test && cd ..
   ```
   Expected: the build prints a `dist/` summary with no errors, both
   lint commands print nothing and exit 0, and both test commands report
   all tests passing (9 for client, 7 for server).
3. **Push/re-run the PR** and confirm all 6 checks go green: Client
   Build, Client Lint, Client Tests, Server Lint, Server Tests, Format
   Check.
4. **Spot-check the one intentional lint-rule change**: open
   `client/eslint.config.js` and confirm `react-hooks/set-state-in-effect`
   is the only rule turned off, with the comment explaining why.
