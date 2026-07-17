# Issue #11 — feat(catalog): frontend views for services.html, products.html + staff manage controls

**Epic:** Sprint 1 — Epic D (new, shared) — M03/M04 Services & Products Catalog (Golden Fur MIS, MongoDB finals variant)
**Branch:** `feat/catalog-frontend-views`
**Owner:** James
**Depends on:** #9, #10 merged

## Design deviation from the Guide: React pages, not static HTML views

The Sprint1-EpicD-Guide.docx describes this issue as building `views/services.html`, `views/products.html`, `public/css/catalog.css`, and `public/js/catalog.js` — a server-rendered, vanilla-JS frontend. That plan matches the *original* Epic A/B design, but this repo has already diverged from it: Epic A/B/C were actually implemented as a **React + TypeScript SPA** in `client/` (Vite, `react-router`), not server-rendered HTML views. There is no `views/` or `public/js/` directory in this codebase, and no admin panel frontend has been built yet either (Epic C's Issue #6 is backend-only so far). This issue follows the repo's actual convention instead of the superseded doc plan:

| Guide's plan | What was actually built here | Why |
|---|---|---|
| `views/services.html`, `views/products.html` | `client/src/pages/ServicesPage/`, `client/src/pages/ProductsPage/` (React components) | Matches how `LoginPage`/`SignupPage` are already built in this repo. |
| `public/js/catalog.js` (fetch + conditional rendering) | `client/src/shared/catalog/components/CatalogPage/CatalogPage.tsx` — one generic component both pages render, since services and products are identical except for one field (`category` vs. `stock`) | Avoids duplicating the fetch/role-gating/card-grid logic twice for two nearly identical resources. |
| `public/css/catalog.css` | `client/src/shared/catalog/components/CatalogPage/CatalogPage.module.css`, plus new `--color-badge-active/inactive-*` and `--catalog-*` tokens added to `client/src/styles/tokens.css` | Same token values the Sprint1-EpicD-Design.xlsx Styles sheet specifies (`#eaf6eb`/`#2f6f3b` active, `#fde9e6`/`#b42318` inactive, 220px min card width, 16px grid gap). |

### Routing decision: `/catalog/services` and `/catalog/products`, not `/services`/`/products`

The client dev server (`client/vite.config.ts`) proxies `/services` and `/products` straight to the Express API (needed for the pages' own `fetch()` calls to reach Issues #9/#10's routes without CORS). If the React *pages* were also registered at those exact same paths, a direct browser navigation or page refresh at `http://localhost:5173/services` would be swallowed by the proxy and return raw JSON instead of loading the app — this was caught during manual verification below. The pages are registered at `/catalog/services` and `/catalog/products` instead, so the two path spaces never collide.

## What was built

| File | Purpose |
|---|---|
| `client/src/shared/catalog/api/catalogClient.ts` | Generic `fetch()` wrapper (list/create/update) shared by both resources, mirroring the existing `shared/auth/api/auth.api.ts` pattern. |
| `client/src/shared/catalog/api/services.api.ts`, `products.api.ts` | Per-resource typed wrappers (`Service`/`Product` interfaces) around the generic client. |
| `client/src/shared/catalog/components/CatalogPage/CatalogPage.tsx` (+ `.module.css`) | Shared grid view: renders active items to everyone; adds a create form and per-card Edit/Deactivate-or-Reactivate controls only when the logged-in user's role is `staff` or `admin` (read from `useAuth()`, the same context Epic A's login already populates). Also shows an Active/Inactive status pill, but **only in the staff/admin view** — matching the Design doc's note that the badge is "staff/admin view only." A deactivated item stays in the staff/admin grid (dimmed, `Inactive` badge, button relabeled `Reactivate`) rather than disappearing — this relies on Issues #9/#10's `attachUserIfPresent` middleware, which lets an authenticated staff/admin `GET` request see inactive items too. |
| `client/src/pages/ServicesPage/ServicesPage.tsx` | Thin wrapper: renders `CatalogPage` configured for `/services`, with `category` as the extra field. |
| `client/src/pages/ProductsPage/ProductsPage.tsx` | Thin wrapper: renders `CatalogPage` configured for `/products`, with `stock` as the extra field. |
| `client/src/App.tsx` | Adds the `/catalog/services` and `/catalog/products` routes. |
| `client/vite.config.ts` | Adds `/services` and `/products` to the dev-server proxy list (needed for the pages' `fetch()` calls; see the routing note above for why the page routes themselves are not at these paths). |
| `client/src/styles/tokens.css` | Adds the Epic D badge and catalog-grid design tokens. |

## Acceptance criteria

| # | Criterion |
|---|---|
| AC-1 | `services.html`/`products.html` (here: the `ServicesPage`/`ProductsPage` React views) list every active item for any visitor, logged in or not. |
| AC-2 | Staff/admin see create/edit/deactivate controls when logged in with sufficient role. A deactivated item stays visible to them (dimmed, marked `Inactive`) with the same button now offering `Reactivate`. |
| AC-3 | Basic CSS is applied to both views (`catalog.css` — here: `CatalogPage.module.css` plus the new design tokens). |

## Prerequisites

- Issues #9 and #10 merged (`GET`/`POST`/`PATCH` working for both `/services` and `/products` — see their own verification docs).
- MongoDB running (see Step 1 of [Issue #9's doc](../9-services-catalog/services-catalog.md)).

## Verification steps

### Step 1 — Start the full app (client + server together)

1. Open PowerShell in the repo root.
2. Run:
   ```powershell
   cd C:\Users\Matthew\source\repos\itprofelective-webpage-system
   if (-not (Test-Path server\.env)) { Copy-Item server\.env.example server\.env }
   npm install
   npm run install:all
   npm run dev
   ```
3. Pass: the terminal shows both processes starting, including:
   ```text
   [db] Connected to MongoDB (golden_fur_mongo)
   [server] Golden Fur MIS (Mongo finals variant) listening on port 4321
   ```
   and a Vite line like `Local: http://localhost:5173/`.
4. Leave this terminal running.

### Step 2 — Confirm the public view (AC-1)

1. Open a browser to `http://localhost:5173/` and confirm the landing page loads.
2. Type `http://localhost:5173/catalog/services` directly into the address bar and press Enter.
3. Pass: the "Our Services" page loads (not raw JSON, not an error page) with no create form and no status pills — this is what any not-logged-in visitor sees.
4. Repeat for `http://localhost:5173/catalog/products` ("Our Products" page).
5. If either page currently has no items, it shows "No services available yet." / "No products available yet." — this is expected on a clean database and is not a failure.

### Step 3 — Create a staff test account

If you already have a `role: "staff"` or `role: "admin"` account from a previous issue's verification, skip to Step 4 and use that account instead.

1. In the browser, go to `http://localhost:5173/` and click **Sign In** → **Create Account**, or navigate to `http://localhost:5173/signup` directly (this path has no proxy collision, unlike `/login`).
2. Register with any name/email/password (e.g. `catalog-frontend-staff@example.com`).
3. Open PowerShell and promote the new account:
   ```powershell
   mongosh "mongodb://127.0.0.1:27017/golden_fur_mongo"
   ```
   ```js
   db.users.updateOne(
     { email: "catalog-frontend-staff@example.com" },
     { $set: { role: "staff", isBanned: false } }
   )
   ```
4. Pass: `matchedCount: 1`. Type `exit`.

### Step 4 — Confirm the staff manage view (AC-2, AC-3)

1. Back in the browser, click **Sign In** from the landing page (do **not** type `/login` directly into the address bar — see Troubleshooting) and log in with the staff account.
2. Navigate to `http://localhost:5173/catalog/services`.
3. Pass:
   - An "Add a new service" form is visible with Name/Description/Price/Category fields and an **Add service** button (AC-2, AC-3 — the card grid and form are visibly styled, not unstyled HTML).
   - Any existing service card now shows an **Active**/**Inactive** status pill (green/red), which was not visible to the logged-out visitor in Step 2.
4. Fill in the form (e.g. Name: `Full Groom Package`, Price: `45`, Category: `Grooming`) and click **Add service**.
5. Pass: the new card appears immediately at the top of the grid with an **Active** pill.
6. Click **Edit** on that card, change the price, click **Save**.
7. Pass: the card updates in place with the new price.
8. Click **Deactivate** on that card.
9. Pass:
   - The card stays in the grid — it does **not** disappear (deactivating is not deleting).
   - The card is visibly dimmed, its badge switches from **Active** to **Inactive**, and its button relabels from **Deactivate** to **Reactivate**.
10. Click **Reactivate** on the same card.
11. Pass: the badge switches back to **Active**, the dimming clears, and the button relabels back to **Deactivate**.
12. Repeat steps 2–11 at `http://localhost:5173/catalog/products`, using the Stock field in place of Category.

### Step 5 — Confirm the public view never shows a deactivated item

1. Deactivate the card again (repeat step 8) so there is something to check.
2. Open a new private/incognito browser window (so you're logged out) to `http://localhost:5173/catalog/services`.
3. Pass: the item deactivated in step 1 does not appear at all, and no create form or status pills are shown — this is the anonymous/public view, which is unaffected by the staff-side reactivate control (Issues #9/#10's AC-2: `GET /services` only ever returns active items to anonymous callers).
4. Back in the staff window, click **Reactivate** to restore the item for future test runs.

## Troubleshooting

- **Direct navigation to `/login` shows "Cannot GET /login"**: this is a pre-existing issue in this repo's `vite.config.ts` dev proxy (it forwards *all* methods for `/login`, including a plain page `GET`, straight to the Express API, which only handles `POST /login`). It affects Epic A/C's login page, not anything built in this issue — always reach `/login` by clicking the **Sign In** link from the landing page (a client-side route change, which the proxy never sees) rather than typing the URL directly.
- **`/catalog/services` or `/catalog/products` return raw JSON or 404 instead of the page**: confirm you're using the `/catalog/...` prefix and not `/services`/`/products` directly — the latter are claimed by the API proxy (see the Design deviation section above).
- **No manage controls appear even when logged in**: confirm the account's `role` is `staff` or `admin` in MongoDB (`db.users.findOne({ email: "..." }, { role: 1 })`), and that you logged in *after* the role was changed (the role is read fresh from `/me` on each page load, so logging out and back in — or just refreshing — picks up a DB change made while already logged in).

## Verification record

Manually verified in a real browser (Chromium via Playwright) on 2026-07-17: the public view rendered active items with no manage controls; after logging in as a `staff` test account, the create form, Active/Inactive pills, and Edit/Deactivate controls all appeared and worked as described above for both Services and Products.

Re-verified on 2026-07-17 after fixing an early bug where "Deactivate" behaved like a delete (the card was removed from local state, not just marked inactive, and the backend's `GET /services`/`GET /products` had no way for staff/admin to see inactive items at all). Confirmed via Playwright: deactivating a card keeps it in the staff grid (dimmed, `Inactive` badge, button relabeled `Reactivate`), a logged-out visitor never sees it, and clicking `Reactivate` restores it to `Active`. Same result confirmed for Products via direct API calls.
