# Issue #9 — feat(catalog): build services schema + routes (public read, staff/admin write)

**Epic:** Sprint 1 — Epic D (new) — M03 Services Catalog (Golden Fur MIS, MongoDB finals variant)
**Branch:** `feat/services-catalog`
**Owner:** Matthew
**Depends on:** #3 merged

## What was built

| File | Purpose |
|---|---|
| `server/models/Service.js` | Mongoose schema: `name` (required), `description`, `price` (required, min 0), `category`, `isActive` (default `true`), `createdAt` (default `Date.now()`). |
| `server/middleware/requireStaffOrAdmin.js` | Runs after `requireAuth`; rejects with `403` unless `req.user.role` is `staff` or `admin`. Shared with Issue #10's product routes — not duplicated. |
| `server/middleware/attachUserIfPresent.js` | Optional-auth middleware for `GET /services`: attaches `req.user` when a valid session is present, but never rejects an anonymous request. Also shared with Issue #10. |
| `server/controllers/serviceController.js` | `listServices` (filters `isActive: true` for anonymous/`user`-role callers; returns everything, including inactive, for `staff`/`admin`), `createService`, `updateService` (edits + the `isActive` toggle used to deactivate/reactivate). |
| `server/routes/serviceRoutes.js` | `GET /services` (public, with optional auth), `POST /services` and `PATCH /services/:id` (both behind `requireAuth` → `requireStaffOrAdmin`). |
| `server/server.js` | Mounts `serviceRoutes` alongside the existing auth/admin routes. |

### Design note: staff/admin see inactive items too (resolved open item)

The Guide originally flagged this as an **open item for adviser confirmation**: whether staff/admin should see `isActive: false` items so they have a way back to reactivate them. That's now resolved — `GET /services` uses the new `attachUserIfPresent` middleware (optional auth: attaches `req.user` if a valid session is present, but never rejects the request if not). `listServices` then checks `req.user?.role`: anonymous callers and logged-in `user`-role callers still only ever see `isActive: true` (AC-2 unchanged for them), but an authenticated `staff`/`admin` caller gets every document. This is what makes the frontend's "Deactivate"/"Reactivate" toggle (Issue #11) work — a deactivated item stays visible to the staff/admin who can act on it, dimmed with an "Inactive" badge, instead of disappearing as if it had been deleted.

## Acceptance criteria

| # | Criterion |
|---|---|
| AC-1 | `models/Service.js` defines `name`/`description`/`price`/`category`/`isActive`/`createdAt`. |
| AC-2 | `GET /services` returns only documents where `isActive: true` for anonymous callers and logged-in `user`-role callers. |
| AC-3 | `POST /services` and `PATCH /services/:id` require `role: "staff"` or `role: "admin"`. |
| AC-4 | No hard-delete route exists on this collection — deactivation happens via `isActive: false` on the same `PATCH` route used for edits, and the same route reverses it (`isActive: true`). |
| AC-5 | An authenticated `staff`/`admin` caller's `GET /services` includes `isActive: false` documents too, so they have a way to find and reactivate what they deactivated. |

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
4. Select `testing/docs/issues/9-services-catalog/services-catalog.postman_collection.json`.
5. Click **Import**.
6. Open the imported collection named **Issue #9 - Services Catalog**.
7. Open the **Variables** tab and confirm `baseUrl` is `http://127.0.0.1:4321`. If your server printed a different port, change `baseUrl` to match it and click **Save**.

### Step 4 — Create the two test accounts in Postman

1. In Postman, click the collection name **Issue #9 - Services Catalog**.
2. Click **Run**.
3. In the runner window, uncheck every request except:
   - **1. Register staff-to-be test user**
   - **2. Register plain (non-staff) test user**
4. Click **Run Issue #9 - Services Catalog**.
5. Pass: both requests are green. A fresh database returns `201`; if you already ran this before, `409` is also accepted because the duplicate-email error is clean.

### Step 5 — Promote the staff test user in MongoDB

There is no in-app way to become staff yet (that's Epic B's admin panel, and its frontend isn't wired up in this repo yet either) — so this step flips `role` directly in the database, matching how Issue #5's admin-routes doc verifies its own role changes.

1. Open a second PowerShell window.
2. Run:
   ```powershell
   mongosh "mongodb://127.0.0.1:27017/golden_fur_mongo"
   ```
3. Inside the `mongosh` prompt, run:
   ```js
   db.users.updateOne(
     { email: "services-catalog-staff@example.com" },
     { $set: { role: "staff", isBanned: false } }
   )
   ```
4. Pass: `acknowledged: true` and `matchedCount: 1`.
5. Type `exit` and press Enter.

### Step 6 — Run the services route checks in Postman

1. Return to Postman.
2. Click **Run** on the collection again.
3. This time, uncheck requests **1** and **2** and run requests **3** through **16**.
4. Pass: every request in the runner is green:
   - `POST /services` with the plain user's token → `403` (AC-3)
   - staff login succeeds and confirms `role: "staff"`
   - a `logout` request clears the staff session cookie — **this step matters**: without it, Postman's cookie jar keeps sending the staff session cookie on later requests and would silently make the "non-staff" checks below pass for the wrong reason (see Troubleshooting)
   - `POST /services` with a missing `name`/`price` → `400`
   - staff `POST /services` → `201` with `name`/`price`/`category`/`isActive: true` (AC-1)
   - public `GET /services` includes the new service, `isActive: true` (AC-2)
   - staff `PATCH /services/:id` edits the price → `200`
   - the same edit with the plain user's token → `403` (AC-3)
   - staff `PATCH /services/:id` with `{ isActive: false }` → `200`, `isActive: false` — this is the "deactivate" action (AC-4)
   - staff (authenticated) `GET /services` still includes the deactivated item, `isActive: false` (AC-5)
   - public `GET /services` no longer includes the deactivated service (AC-2)
   - `PATCH /services/not-a-valid-object-id` → `400`
   - staff `PATCH /services/:id` with `{ isActive: true }` → `200` — the "reactivate" action (AC-4)

### Step 7 — Confirm MongoDB changed

1. Open a second PowerShell window again.
2. Run:
   ```powershell
   mongosh "mongodb://127.0.0.1:27017/golden_fur_mongo"
   ```
3. Inside the `mongosh` prompt, run:
   ```js
   db.services.find({ name: "Postman Test Grooming Package" }, { name: 1, price: 1, category: 1, isActive: 1 })
   ```
4. Pass: one document, `price: 50`, `category: "Grooming"`, `isActive: true` (the collection run deactivates it and then reactivates it again as its last step, so the end state is active).
5. Type `exit` and press Enter.

### Step 8 — Optional cleanup

Run this only after you are done taking screenshots or recording evidence:

```powershell
mongosh "mongodb://127.0.0.1:27017/golden_fur_mongo" --eval "db.users.deleteMany({email:{$in:['services-catalog-staff@example.com','services-catalog-user@example.com']}}); db.services.deleteMany({name:'Postman Test Grooming Package'})"
```

## Troubleshooting

- If Postman says it cannot connect, make sure the server terminal is still running and `baseUrl` matches the printed port.
- If request 11 ("Non-staff cannot edit the service") unexpectedly returns `200` instead of `403`, request 6 ("Logout to clear the staff session cookie") was skipped or failed. `requireAuth` checks the `token` cookie **before** the `Authorization: Bearer` header, so a leftover staff cookie from an earlier login silently outranks whatever Bearer token a later request sends. This was caught during development (Newman run on 2026-07-17) and fixed by adding the explicit logout step — it isn't an API bug, it's specific to how Postman/Newman persist cookies across requests in one collection run.
- If the staff requests return `403`, repeat Step 5 and make sure `services-catalog-staff@example.com` has `role: "staff"` in MongoDB.
- If request 13 ("Staff GET /services still includes the deactivated item") comes back without the item, confirm `attachUserIfPresent` is wired into `serviceRoutes.js` ahead of `serviceController.listServices` and that the `Authorization` header on that request actually carries `{{staffToken}}`.

## Verification record

Run on 2026-07-17 against a live server and MongoDB instance via Newman (Postman's CLI runner): all 16 requests / 26 assertions passed on the final run. Also manually verified in a real browser: a staff user deactivating a service in the UI sees it stay in the grid, dimmed, with its badge switching to "Inactive" and its button switching to "Reactivate" (no more disappearing as if deleted), while a logged-out visitor never sees it at all.
