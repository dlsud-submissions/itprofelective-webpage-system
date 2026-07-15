# Issue #5 - feat(admin): admin routes - list/ban/unban/role change

**Epic:** Sprint 1 - Epic B - M02 Staff Admin Panel (User Management)
**Branch:** `feat/admin-routes`

## What was built

| File | Purpose |
|---|---|
| `server/middleware/requireAdmin.js` | Rejects authenticated users unless their current MongoDB role is `admin`. |
| `server/controllers/adminController.js` | Lists users, updates `isBanned`, updates `role`, validates ids/roles, and blocks admin self-ban. |
| `server/routes/adminRoutes.js` | Adds `GET /admin/users`, `PATCH /admin/users/:id/ban`, and `PATCH /admin/users/:id/role` behind `requireAuth` and `requireAdmin`. |
| `server/server.js` | Mounts existing auth routes and the new admin routes into the Express server. |

## Acceptance criteria

| # | Criterion |
|---|---|
| AC-1 | `GET /admin/users` returns all users with `name`, `email`, `role`, `isBanned`, and `createdAt`. |
| AC-2 | `PATCH /admin/users/:id/ban` can ban/unban a target user. |
| AC-3 | `PATCH /admin/users/:id/role` sets `role` to `user`, `staff`, or `admin`. |
| AC-4 | Non-admin requests to `/admin/*` are rejected before any user data is returned. |
| AC-5 | An admin cannot ban their own account. |

## Verification steps

### Step 1 - Start MongoDB

1. Press the Windows key, search **Services**, and open it.
2. In the Services list, look for **MongoDB Server**.
3. If the Status column is not **Running**, right-click it and choose **Start**.
4. Keep Services open until you confirm it is running.

### Step 2 - Start the API server

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

### Step 3 - Import the Postman collection

1. Open Postman.
2. Click **Import** in the top-left.
3. Choose **Files**.
4. Select `testing/docs/issues/5-admin-routes/admin-routes.postman_collection.json`.
5. Click **Import**.
6. Open the imported collection named **Issue #5 - Admin Routes**.
7. Open the **Variables** tab and confirm `baseUrl` is `http://127.0.0.1:4321`. If your server printed a different port, change `baseUrl` to match it and click **Save**.

### Step 4 - Create the two test accounts in Postman

1. In Postman, click the collection name **Issue #5 - Admin Routes**.
2. Click **Run**.
3. In the runner window, uncheck every request except:
   - **1. Register regular target user**
   - **2. Register admin test user**
4. Click **Run Issue #5 - Admin Routes**.
5. Pass: both requests are green. A fresh database returns `201`; if you already ran this before, `409` is also accepted because the duplicate-email error is clean.

### Step 5 - Promote the admin test user in MongoDB

1. Open a second PowerShell window.
2. Run:
   ```powershell
   mongosh "mongodb://127.0.0.1:27017/golden_fur_mongo"
   ```
3. Inside the `mongosh` prompt, run:
   ```js
   db.users.updateOne(
     { email: "admin-routes-admin@example.com" },
     { $set: { role: "admin", isBanned: false } }
   )

   db.users.updateOne(
     { email: "admin-routes-user@example.com" },
     { $set: { role: "user", isBanned: false } }
   )
   ```
4. Pass:
   - both commands show `acknowledged: true`.
   - the admin update shows `matchedCount: 1`.
5. Type `exit` and press Enter.

### Step 6 - Run the admin route checks in Postman

1. Return to Postman.
2. Click **Run** on the collection again.
3. This time, uncheck requests **1** and **2** and run requests **3** through **11**.
4. Pass: every request in the runner is green:
   - non-admin `GET /admin/users` returns `403`
   - admin login returns `200` and stores the token
   - admin `GET /admin/users` returns users without `passwordHash`
   - role change sets the target user to `staff`
   - ban sets `isBanned` to `true`
   - banned user login returns `403`
   - unban sets `isBanned` to `false`
   - self-ban attempt returns `400`

### Step 7 - Confirm MongoDB changed

1. Open a second PowerShell window again.
2. Run:
   ```powershell
   mongosh "mongodb://127.0.0.1:27017/golden_fur_mongo"
   ```
3. Inside the `mongosh` prompt, run:
   ```js
   db.users.find(
     { email: { $in: ["admin-routes-admin@example.com", "admin-routes-user@example.com"] } },
     { name: 1, email: 1, role: 1, isBanned: 1, createdAt: 1 }
   )
   ```
4. Pass:
   - `admin-routes-admin@example.com` has `role: "admin"`.
   - `admin-routes-user@example.com` has `role: "staff"` after the role-change request.
   - `admin-routes-user@example.com` has `isBanned: false` after the final unban request.
5. Type `exit` and press Enter.

### Step 8 - Optional cleanup

Run this only after you are done taking screenshots or recording evidence:

```powershell
mongosh "mongodb://127.0.0.1:27017/golden_fur_mongo" --eval "db.users.deleteMany({email:{$in:['admin-routes-admin@example.com','admin-routes-user@example.com']}})"
```

## Troubleshooting

- If Postman says it cannot connect, make sure the server terminal is still running and `baseUrl` matches the printed port.
- If the admin requests return `401`, re-run the collection from the first request so Postman gets a fresh login token.
- If the admin requests return `403`, repeat Step 5 and make sure `admin-routes-admin@example.com` has `role: "admin"` in MongoDB.
