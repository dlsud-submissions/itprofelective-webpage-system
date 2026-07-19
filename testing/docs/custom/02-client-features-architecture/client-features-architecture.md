# Client: features-based architecture (features/ + shared/)

## What changed

`client/` was already TypeScript, so this is a **pure file-move +
import-path fix** — no logic, markup, styling, or behavior changed.
`client/src/pages/`, `client/src/shared/{auth,catalog,dashboard}/`, and
`client/src/modules/validators/` were reorganized into one consistent
`features/` + `shared/` tree, matching the structure just given to
`server/` (see
[../01-server-ts-migration/server-ts-migration.md](../01-server-ts-migration/server-ts-migration.md)).

Old layout → new layout:

```
src/pages/LandingPage/**                          -> src/features/landing/pages/LandingPage/**
src/assets/**                                     -> src/features/landing/assets/**   (only LandingPage used these)

src/shared/auth/**                                -> src/features/auth/**
src/modules/validators/auth.validator.ts          -> src/features/auth/validators/auth.validator.ts
src/pages/LoginPage/**                             -> src/features/auth/pages/LoginPage/**
src/pages/SignupPage/**                            -> src/features/auth/pages/SignupPage/**

src/shared/catalog/**                              -> src/features/catalog/**
src/pages/ProductsPage/**                          -> src/features/catalog/pages/ProductsPage/**
src/pages/ServicesPage/**                          -> src/features/catalog/pages/ServicesPage/**

src/shared/dashboard/**                            -> src/features/dashboard/**
src/pages/AdminDashboardPage/**                    -> src/features/dashboard/pages/AdminDashboardPage/**
src/pages/CustomerDashboardPage/**                 -> src/features/dashboard/pages/CustomerDashboardPage/**
src/pages/StaffDashboardPage/**                    -> src/features/dashboard/pages/StaffDashboardPage/**

src/styles/**                                      -> src/shared/styles/**
```

Result:

```
client/src/
  App.tsx, main.tsx                # composition root, unchanged behavior
  features/
    auth/
      AuthContext.ts, AuthProvider.tsx, RequireRole.tsx,
      useAuth.ts, dashboardPath.ts
      api/auth.api.ts
      validators/auth.validator.ts
      pages/LoginPage/**, pages/SignupPage/**
    catalog/
      api/{catalogClient,products.api,services.api}.ts
      components/CatalogPage/**
      pages/ProductsPage/**, pages/ServicesPage/**
    dashboard/
      components/DashboardPage/**
      pages/AdminDashboardPage/**, CustomerDashboardPage/**, StaffDashboardPage/**
    landing/
      assets/**  (all the .png/.gif files — only ever used by LandingPage)
      pages/LandingPage/**
  shared/
    styles/**   # the only genuinely cross-feature code (global CSS, tokens, reset)
```

Every domain (`auth`, `catalog`, `dashboard`, `landing`) now owns its own
pages, components, and API client together, instead of splitting
"page shell" (`pages/`) from "everything else" (`shared/<domain>/`).
`shared/` is now reserved for what's truly cross-feature — currently just
the global stylesheet (`shared/styles/`), which every feature's pages pull
in indirectly via `main.tsx`.

## Why this structure

- Mirrors the `features/` + `shared/` split now used on `server/` (see the
  linked doc above) so both halves of the repo read the same way.
- The old `shared/auth`, `shared/catalog`, `shared/dashboard` folders
  weren't actually shared infrastructure — each one belonged entirely to
  one feature (nothing in `shared/catalog` was ever imported by anything
  outside the catalog pages, etc.). Moving them under `features/<name>`
  makes that ownership explicit and leaves `shared/` for code that's
  genuinely used everywhere.
- `LandingPage` was the only consumer of every file in `src/assets/`, so
  those images moved with it into `features/landing/assets/` rather than
  staying in a generic top-level `assets/` folder implying broader reuse.

## Verification already performed

- `npm --prefix client run _typecheck` (`tsc --noEmit`) passes with zero
  errors.
- `npx vite build` (production build) completed successfully, correctly
  bundling every relocated asset and CSS module.
- Booted the real Vite dev server and requested every relocated module
  path directly (`/src/App.tsx`, `/src/features/landing/pages/LandingPage/LandingPage.tsx`,
  `/src/features/auth/pages/LoginPage/components/LoginForm/LoginForm.tsx`,
  `/src/features/catalog/components/CatalogPage/CatalogPage.tsx`,
  `/src/features/dashboard/components/DashboardPage/DashboardPage.tsx`)
  — all returned `200` with a clean esbuild/React-refresh transform (no
  unresolved-import errors), confirming every corrected relative import
  (`useAuth`, `api/auth.api`, `dashboardPath`, `validators/auth.validator`,
  etc.) resolves correctly.
- Grepped the whole `client/src` tree for any leftover reference to the
  old paths (`shared/auth`, `shared/catalog`, `shared/dashboard`,
  `modules/validators`, `pages/<Name>Page`) — none remain.

## What you need to do to verify locally

1. **Install client dependencies** if you haven't already:

   ```
   npm --prefix client install
   ```

2. **Typecheck the client** (should print nothing and exit 0):

   ```
   npm run typecheck:client
   ```

   (or `npm run typecheck` for both client and server.)

3. **Start the app and click through it** — this is a pure refactor, so
   the goal is confirming nothing visually or functionally changed:

   ```
   npm run dev
   ```

   Then open the Vite URL printed in the terminal (typically
   `http://localhost:5173`) and check:
   1. **Landing page (`/`)** — hero image, mascot GIF, and the 4 feature
      strip images all load (these are the assets that moved into
      `features/landing/assets/`).
   2. **Sign up (`/signup`)** → create an account → should redirect to
      `/dashboard/customer`.
   3. **Log out**, then **Log in (`/login`)** with the same account →
      should redirect back to `/dashboard/customer`.
   4. From the customer dashboard, click **Browse Services** /
      **Browse Products** (`/catalog/services`, `/catalog/products`) —
      catalog list should load (requires the server running too — see
      [../01-server-ts-migration/server-ts-migration.md](../01-server-ts-migration/server-ts-migration.md)
      for backend setup).
   5. If you have (or seed) a `staff`/`admin` account, sign in as that
      role and confirm `/dashboard/staff` or `/dashboard/admin` renders
      and the "Manage Services"/"Manage Products" links work, and that the
      catalog pages show the create/edit/deactivate form for that role.

4. **Build check**:
   ```
   npm run build
   ```
   Should complete with no errors and produce `client/dist/`.
