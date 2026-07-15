# Issue #3 — feat(auth): set up MongoDB connection and users schema (Mongoose)

**Epic:** Sprint 1 — Epic A — M01 User Registration & Authentication (Golden Fur MIS, MongoDB finals variant)
**Branch:** `feat/mongo-users-schema`
**Owner:** Matthew
**Depends on:** #2 merged

## What was built

| File | Purpose |
|---|---|
| [`golden-fur-mongo/database/db.js`](../../../../golden-fur-mongo/database/db.js) | Connects to MongoDB via Mongoose on server start. Logs a clear error and calls `process.exit(1)` if `MONGODB_URI` is missing or the connection fails — the server never runs "half-alive". |
| [`golden-fur-mongo/models/User.js`](../../../../golden-fur-mongo/models/User.js) | The `users` collection schema: `name`, `email` (required, unique), `passwordHash` (required, `select: false` so it's never returned by a plain query), `role` (enum `user`/`staff`/`admin`, default `'user'`), `isBanned` (default `false`), `createdAt` (default `Date.now`). |

This is the single source of truth for the schema — Epic B (M02 Staff Admin Panel) will import this model rather than redefining fields.

## Prerequisites to verify this issue

You need a MongoDB server reachable locally. This machine already has one installed as a Windows service (`MongoDB`, checked running on 2026-07-15). If it's ever stopped, start it from an elevated PowerShell with:
```powershell
Start-Service MongoDB
```

You also need [MongoDB Shell (`mongosh`)](https://www.mongodb.com/try/download/shell) to inspect the database directly — it was already installed on this machine (`mongosh 2.9.2`).

## Acceptance criteria verification

| # | Criterion | How to verify |
|---|---|---|
| AC-1 | `database/db.js` connects to MongoDB on server start | Step 1 below |
| AC-2 | `models/User.js` defines `name`/`email`/`passwordHash`/`role`/`isBanned`/`createdAt` with the constraints/defaults in the DB Design sheet | Step 2 below |
| AC-3 | Connection errors are logged clearly, not silently swallowed | Step 3 below |

### Step 1 — Confirm the server connects to MongoDB on startup

1. Open a PowerShell terminal in the repo root.
2. Run:
   ```powershell
   cd golden-fur-mongo
   if (-not (Test-Path .env)) { Copy-Item .env.example .env }
   npm install
   npm start
   ```
3. **Pass:** within a second or two you should see:
   ```
   [db] Connected to MongoDB (golden_fur_mongo)
   [server] Golden Fur MIS (Mongo finals variant) listening on port 4000
   ```
4. Press `Ctrl+C` to stop the server when done (or leave it running — Issue #4's doc uses it for the register/login checks).

### Step 2 — Confirm the schema shape and defaults directly in the database

This is easiest to observe by registering a user (Issue #4's flow creates a real document) and then inspecting it with `mongosh`. If you've already run the Issue #4 verification steps and have a test account, skip to sub-step 2; otherwise register one first via Issue #4 Step 2.

1. With the server running (Step 1), open a **second** PowerShell terminal and connect to the database:
   ```powershell
   mongosh "mongodb://127.0.0.1:27017/golden_fur_mongo"
   ```
2. Inspect the user document, explicitly requesting the normally-hidden `passwordHash` field to confirm it's stored as a bcrypt hash (not plaintext):
   ```js
   db.users.findOne({ email: "your-test-email@example.com" })
   ```
3. **Pass:** the returned document has exactly `_id`, `name`, `email`, `passwordHash` (a `$2a$...`/`$2b$...` bcrypt string, never the plaintext password you typed), `role` (`"user"` unless you changed it), `isBanned` (`false`), `createdAt` (a real timestamp), and `__v`.
4. Confirm the `role` default and enum by trying to insert an invalid role directly — this should be rejected by Mongoose validation, not silently accepted:
   ```js
   db.users.find({ role: { $nin: ["user", "staff", "admin"] } }).count()
   ```
   **Pass:** returns `0` — no document can exist with a role outside the three allowed values, because every write goes through the Mongoose model (Issue #4's controller), never a raw insert.
5. Type `exit` to leave the `mongosh` shell.

### Step 3 — Confirm connection errors are logged clearly, not swallowed

1. Stop the server if it's running (`Ctrl+C` in its terminal).
2. Temporarily break the connection string:
   ```powershell
   cd golden-fur-mongo
   $env:MONGODB_URI = "mongodb://127.0.0.1:27099/golden_fur_mongo"
   node server.js
   ```
   (port `27099` has nothing listening on it, so this simulates an unreachable database.)
3. **Pass:** within a few seconds you should see a clear, actionable error and the process should exit — for example:
   ```
   [db] Failed to connect to MongoDB: connect ECONNREFUSED 127.0.0.1:27099
   ```
   and the terminal returns to the prompt (the process exited; it did not hang or keep the server "up" with a broken DB layer).
4. Clear the override and confirm normal startup still works:
   ```powershell
   Remove-Item Env:\MONGODB_URI
   node server.js
   ```
   **Pass:** back to the `[db] Connected to MongoDB (golden_fur_mongo)` message from Step 1.
