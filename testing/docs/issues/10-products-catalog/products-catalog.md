# Issue #10 — feat(catalog): build products schema + routes (public read, staff/admin write)

**Epic:** Sprint 1 — Epic D (new) — M04 Products Catalog (Golden Fur MIS, MongoDB finals variant)
**Branch:** `feat/products-catalog`
**Owner:** Alarie
**Depends on:** #3 merged

## What was built

| File                                      | Purpose                                                                                                                                                                                                                                   |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server/models/Product.js`                | Mongoose schema: `name` (required), `description`, `price` (required, min 0), `stock` (required, min 0, default `0`), `isActive` (default `true`), `createdAt` (default `Date.now()`).                                                    |
| `server/controllers/productController.js` | `listProducts` (filters `isActive: true` for anonymous/`user`-role callers; returns everything, including inactive, for `staff`/`admin`), `createProduct`, `updateProduct` (edits + the `isActive` toggle used to deactivate/reactivate). |
| `server/routes/productRoutes.js`          | `GET /products` (public, with optional auth), `POST /products` and `PATCH /products/:id` (both behind `requireAuth` → `requireStaffOrAdmin`).                                                                                             |
| `server/server.js`                        | Mounts `productRoutes` alongside the existing auth/admin/service routes.                                                                                                                                                                  |

`middleware/requireStaffOrAdmin.js` and `middleware/attachUserIfPresent.js` already exist from Issue #9 (services) and are reused here rather than duplicated — see [Issue #9's doc](../9-services-catalog/services-catalog.md).

### Design note: `stock` is a bare count only

Per the Guide, there is no decrement-on-purchase logic in this epic — no order/checkout flow exists yet to trigger it (that's the deferred Sales & Billing module). `stock` on `PATCH /products/:id` is edited the same way any other field is; nothing else in the system reads or writes it automatically.

### Design note: staff/admin see inactive items too (resolved open item)

Same resolved behavior as Issue #9's services (see [its doc](../9-services-catalog/services-catalog.md#design-note-staffadmin-see-inactive-items-too-resolved-open-item) for the full explanation): `GET /products` uses the shared `attachUserIfPresent` middleware, and `listProducts` returns every document (including `isActive: false`) to an authenticated `staff`/`admin` caller, while anonymous/`user`-role callers still only ever see active products.

## Acceptance criteria

| #    | Criterion                                                                                                                                                                                |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1 | `models/Product.js` defines `name`/`description`/`price`/`stock`/`isActive`/`createdAt`.                                                                                                 |
| AC-2 | `GET /products` returns only documents where `isActive: true` for anonymous callers and logged-in `user`-role callers.                                                                   |
| AC-3 | `POST /products` and `PATCH /products/:id` require `role: "staff"` or `role: "admin"`.                                                                                                   |
| AC-4 | No hard-delete route exists on this collection — deactivation happens via `isActive: false` on the same `PATCH` route used for edits, and the same route reverses it (`isActive: true`). |
| AC-5 | An authenticated `staff`/`admin` caller's `GET /products` includes `isActive: false` documents too, so they have a way to find and reactivate what they deactivated.                     |

## Verification steps

### Step 1 — Start MongoDB

1. Press the Windows key, search **Services**, and open it.
2. In the Services list, look for **MongoDB Server**.
3. If the Status column is not **Running**, right-click it and choose **Start**.
4. Keep Services open until you confirm it is running.

### Step 2 — Start the API server

1. Open PowerShell in the repo root.
2. Run:
   ```powershell
   cd C:\Users\Matthew\source\repos\itprofelective-webpage-system
   if (-not (Test-Path server\.env)) { Copy-Item server\.env.example server\.env }
   npm install
   npm --prefix server install
   npm run server
   ```
3. Pass: the terminal shows both of these:
   ```text
   [db] Connected to MongoDB (golden_fur_mongo)
   [server] Golden Fur MIS (Mongo finals variant) listening on port 4321
   ```
4. Leave this terminal running.

### Step 3 — Import the Postman collection

1. Open Postman.
2. Click **Import** in the top-left.
3. Choose **Files**.
4. Select `testing/docs/issues/10-products-catalog/products-catalog.postman_collection.json`.
5. Click **Import**.
6. Open the imported collection named **Issue #10 - Products Catalog**.
7. Open the **Variables** tab and confirm `baseUrl` is `http://127.0.0.1:4321`. If your server printed a different port, change `baseUrl` to match it and click **Save**.

### Step 4 — Create the two test accounts in Postman

1. In Postman, click the collection name **Issue #10 - Products Catalog**.
2. Click **Run**.
3. In the runner window, uncheck every request except:
   - **1. Register staff-to-be test user**
   - **2. Register plain (non-staff) test user**
4. Click **Run Issue #10 - Products Catalog**.
5. Pass: both requests are green. A fresh database returns `201`; if you already ran this before, `409` is also accepted because the duplicate-email error is clean.

### Step 5 — Promote the staff test user in MongoDB

1. Open a second PowerShell window.
2. Run:
   ```powershell
   mongosh "mongodb://127.0.0.1:27017/golden_fur_mongo"
   ```
3. Inside the `mongosh` prompt, run:
   ```js
   db.users.updateOne(
     { email: 'products-catalog-staff@example.com' },
     { $set: { role: 'staff', isBanned: false } }
   );
   ```
4. Pass: `acknowledged: true` and `matchedCount: 1`.
5. Type `exit` and press Enter.

### Step 6 — Run the products route checks in Postman

1. Return to Postman.
2. Click **Run** on the collection again.
3. This time, uncheck requests **1** and **2** and run requests **3** through **16**.
4. Pass: every request in the runner is green:
   - `POST /products` with the plain user's token → `403` (AC-3)
   - staff login succeeds and confirms `role: "staff"`
   - a `logout` request clears the staff session cookie (see Issue #9's Troubleshooting section for why this step is required before testing the non-staff rejection)
   - `POST /products` with a missing `name`/`price` → `400`
   - staff `POST /products` → `201` with `name`/`price`/`stock`/`isActive: true` (AC-1)
   - public `GET /products` includes the new product, `isActive: true` (AC-2)
   - staff `PATCH /products/:id` edits `stock` → `200`
   - the same edit with the plain user's token → `403` (AC-3)
   - staff `PATCH /products/:id` with `{ isActive: false }` → `200`, `isActive: false` — this is the "deactivate" action (AC-4)
   - staff (authenticated) `GET /products` still includes the deactivated item, `isActive: false` (AC-5)
   - public `GET /products` no longer includes the deactivated product (AC-2)
   - `PATCH /products/not-a-valid-object-id` → `400`
   - staff `PATCH /products/:id` with `{ isActive: true }` → `200` — the "reactivate" action (AC-4)

### Step 7 — Confirm MongoDB changed

1. Open a second PowerShell window again.
2. Run:
   ```powershell
   mongosh "mongodb://127.0.0.1:27017/golden_fur_mongo"
   ```
3. Inside the `mongosh` prompt, run:
   ```js
   db.products.find(
     { name: 'Postman Test Dog Food' },
     { name: 1, price: 1, stock: 1, isActive: 1 }
   );
   ```
4. Pass: one document, `stock: 12`, `isActive: true` (the collection run deactivates it and then reactivates it again as its last step, so the end state is active).
5. Type `exit` and press Enter.

### Step 8 — Optional cleanup

Run this only after you are done taking screenshots or recording evidence:

```powershell
mongosh "mongodb://127.0.0.1:27017/golden_fur_mongo" --eval "db.users.deleteMany({email:{$in:['products-catalog-staff@example.com','products-catalog-user@example.com']}}); db.products.deleteMany({name:'Postman Test Dog Food'})"
```

## Troubleshooting

- If Postman says it cannot connect, make sure the server terminal is still running and `baseUrl` matches the printed port.
- If request 11 ("Non-staff cannot edit the product") unexpectedly returns `200` instead of `403`, request 6 ("Logout to clear the staff session cookie") was skipped or failed — see [Issue #9's Troubleshooting section](../9-services-catalog/services-catalog.md#troubleshooting) for the full explanation.
- If the staff requests return `403`, repeat Step 5 and make sure `products-catalog-staff@example.com` has `role: "staff"` in MongoDB.
- If request 13 ("Staff GET /products still includes the deactivated item") comes back without the item, confirm `attachUserIfPresent` is wired into `productRoutes.js` ahead of `productController.listProducts` and that the `Authorization` header on that request actually carries `{{staffToken}}`.

## Verification record

Run on 2026-07-17 against a live server and MongoDB instance via Newman (Postman's CLI runner): all 16 requests / 26 assertions passed. Also manually verified end-to-end via curl against a real staff session: deactivating a product still returns it on a staff-authenticated `GET /products` (marked `isActive: false`) while it's absent from an anonymous `GET /products`, and reactivating restores it for both.
