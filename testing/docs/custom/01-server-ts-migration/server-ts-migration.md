# Server: JS → TS migration + feature-based architecture

## What changed

`server/` was a flat, plain-JavaScript CommonJS Express app (`controllers/`,
`middleware/`, `models/`, `routes/`, `database/`, `scripts/`, `server.js`).
It has been rewritten in TypeScript and reorganized to mirror the
`features/` + `shared/` layout already used by `client/src/`.

New layout:

```
server/
  tsconfig.json          # mirrors client/tsconfig.json (strict, noEmit)
  package.json            # "type": "module"; tsx for dev/start, tsc --noEmit for typecheck
  scripts/                 # one-off DB tooling, run via tsx (not part of the app runtime)
    dbReset.ts
    dbSchema.ts
    dbSeed.ts
  src/
    app.ts                 # express app + middleware + route mounting (was server.js body)
    server.ts               # entrypoint: connect DB, app.listen (was server.js bootstrap)
    features/
      auth/
        auth.controller.ts
        auth.routes.ts
      admin/
        admin.controller.ts
        admin.routes.ts
      products/
        product.model.ts
        products.controller.ts
        products.routes.ts
      services/
        service.model.ts
        services.controller.ts
        services.routes.ts
    shared/
      database/db.ts
      middleware/
        requireAuth.ts
        requireAdmin.ts
        requireStaffOrAdmin.ts
        attachUserIfPresent.ts
      models/user.model.ts   # shared by auth + admin features
      types/express.d.ts     # augments Express.Request with `user`
```

No behavior changed. Every route, status code, validation rule, and
response shape is identical to the old JS — this was a structure +
type-safety migration only, not a feature change.

## Why this structure

- `client/` already uses `features`/`shared` conventions (e.g.
  `client/src/features/auth`, `client/src/features/catalog` — see
  [../02-client-features-architecture/client-features-architecture.md](../02-client-features-architecture/client-features-architecture.md)
  for that migration). `server/` now follows the same idea: code that
  belongs to one route group lives under
  `features/<name>`, code shared across route groups (DB connection, auth
  middleware, the `User` model used by both the auth and admin features)
  lives under `shared/`.
- `server/tsconfig.json` mirrors `client/tsconfig.json` (`strict`,
  `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`,
  `noEmit`) so both halves of the app are held to the same bar.
- `server/package.json` scripts mirror `client/package.json`'s
  underscore-prefixed convention (`_dev`, `_start`, `_typecheck`) so the
  root `package.json` orchestration (`npm run dev`, `npm run typecheck`)
  needed no structural changes — only the file extensions in the
  `db:reset` / `db:schema` / `db:seed` script commands were updated.
- Dev and prod both run directly off the `.ts` sources via `tsx` (no
  separate compiled `dist/` step) to keep the day-to-day workflow as
  simple as the original `node server.js` was.

## Verification already performed

- `npm --prefix server run _typecheck` (`tsc --noEmit`) passes with zero
  errors.
- Booted the real server (`tsx src/server.ts`) against a temporary local
  MongoDB instance and exercised every route with `curl`:
  - `POST /register`, `POST /login`, `GET /me`, `POST /logout`
  - `GET /services`, `GET /products` (anonymous — inactive items hidden)
  - `POST /products` as admin (201) and as a plain `user` (403, correctly
    blocked by `requireStaffOrAdmin`)
  - `GET /admin/users` as admin (200) and as a plain `user` (403, blocked
    by `requireAdmin`)
  - `PATCH /admin/users/:id/ban` then confirmed the banned account is
    rejected on the next `POST /login` with the same "account has been
    banned" message as before
  - Ran `scripts/dbSeed.ts` end-to-end (admin/staff accounts + sample
    services/products created) against the same temp database.
- All responses/status codes matched the pre-migration JS behavior
  exactly.

## What you need to do to verify locally

1. **Install the updated server dependencies** (new TS tooling was added
   to `server/package.json`):

   ```
   npm --prefix server install
   ```

   If you haven't run the top-level install before, also run
   `npm install` in the repo root (needed for `tsx`, used by the
   `db:reset`/`db:schema`/`db:seed` root scripts).

2. **Make sure `server/.env` exists and points at a running MongoDB.**
   If you don't have one yet, copy the example and edit it:

   ```
   cp server/.env.example server/.env
   ```

   Then edit `MONGODB_URI` to point at your MongoDB (local `mongod` or an
   Atlas connection string), and set a real `JWT_SECRET`.

3. **Apply the DB schema and seed sample data** (same as before, just now
   pointed at the `.ts` files):

   ```
   npm run db:schema
   npm run db:seed
   ```

   You should see `[db:schema] ...` and `[db:seed] ...` log lines ending
   in `Done.`, including the seeded admin/staff email + password printed
   to the console.

4. **Typecheck the server** (should print nothing and exit 0):

   ```
   npm run typecheck:server
   ```

   (or `npm run typecheck` to check both `client` and `server`.)

5. **Start the app** (same command as before):

   ```
   npm run dev
   ```

   This starts both `client` (Vite) and `server` (now `tsx watch
src/server.ts` instead of `node --watch server.js`) concurrently.
   Confirm in the terminal you see:

   ```
   [db] Connected to MongoDB (...)
   [server] Golden Fur MIS (Mongo finals variant) listening on port 4321
   ```

6. **Exercise the API** using the Postman collection in this folder
   (`server-ts-migration.postman_collection.json`) — see below — or by
   using the actual client UI at the Vite dev URL (registration, login,
   admin dashboard user list, ban/role actions, services/products pages).

## Using the Postman collection

1. Open Postman → **Import** → select
   `testing/docs/custom/01-server-ts-migration/server-ts-migration.postman_collection.json`.
2. The collection uses a `baseUrl` variable defaulting to
   `http://localhost:4321` — change it in the collection's **Variables**
   tab if your server runs on a different port.
3. Run requests top-to-bottom inside the same Postman session (cookies
   are shared automatically by Postman's cookie jar per domain):
   1. `Register` → creates a normal `user` account.
   2. `Login (new user)` → sets the `token` cookie for that user.
   3. `Me` → confirms the cookie authenticates the new user.
   4. `Login (seeded admin)` → run `npm run db:seed` first so
      `admin@goldenfur.local` / `ChangeMe123!` exists; this overwrites the
      session cookie with the admin's.
   5. `Admin: List Users` → should return all seeded + registered users.
   6. `Admin: Ban User` → edit the URL's `:id` to the `id` of the user
      created in step 1 (copy it from the `Register` or `Admin: List
Users` response), body `{ "isBanned": true }`.
   7. `Login (new user) — expect banned` → re-run request #2; should now
      return `403 { "error": "This account has been banned." }`.
   8. `Services: List` / `Products: List` → public, no auth needed.
   9. `Products: Create (admin)` → should return `201` while logged in as
      admin/staff, and `403` if you swap the cookie back to a plain user.
   10. `Logout` → clears the cookie.
