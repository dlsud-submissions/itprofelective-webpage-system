# Issue #4 — feat(auth): build register/login routes with bcrypt hashing and auth middleware

**Epic:** Sprint 1 — Epic A — M01 User Registration & Authentication (Golden Fur MIS, MongoDB finals variant)
**Branch:** `feat/register-login-routes`
**Owner:** Matthew, Alarie
**Depends on:** #3 merged

## What was built

| File                                                                                                                                                            | Purpose                                                                                                                                                                                                                            |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`golden-fur-mongo/controllers/authController.js`](../../../../golden-fur-mongo/controllers/authController.js)                                                  | `register` (bcrypt-hashes the password, rejects duplicate emails with a clean message, defaults `role: 'user'`), `login` (verifies credentials, checks `isBanned` **after** password verification, issues a JWT), `logout`.        |
| [`golden-fur-mongo/routes/authRoutes.js`](../../../../golden-fur-mongo/routes/authRoutes.js)                                                                    | `GET/POST /register`, `GET/POST /login`, `POST /logout`, and `GET /me` (a small protected route added purely to demonstrate `requireAuth` works and is reusable — Epic B's admin routes will sit behind the same middleware).      |
| [`golden-fur-mongo/middleware/requireAuth.js`](../../../../golden-fur-mongo/middleware/requireAuth.js)                                                          | Verifies the JWT (from the `token` cookie or an `Authorization: Bearer` header), loads the user, attaches `req.user`, or rejects with `401`.                                                                                       |
| [`golden-fur-mongo/views/register.html`](../../../../golden-fur-mongo/views/register.html), [`views/login.html`](../../../../golden-fur-mongo/views/login.html) | Plain, unstyled HTML forms (native `<form method="POST">` submission). Styling and JS-enhanced `fetch()` submission are out of scope for this issue — they belong to the later Epic C issue that also builds the admin panel view. |

### Design decision: JWT, not sessions

The Guide left the JWT-vs-`express-session`+`connect-mongo` choice open for team confirmation. This implementation uses a **stateless JWT**, stored in an `httpOnly` cookie (`token`) and also returned in the JSON response body for Postman/API convenience. This is the simpler of the two documented options and matches the DB Design sheet's note that the `sessions` collection is _"not created at all if JWT is chosen."_ No `sessions` collection exists in this database. If the team prefers `express-session` + `connect-mongo` instead, `authController.js`/`requireAuth.js` are the only two files that would need to change — the route surface (`POST /register`, `POST /login`, `GET /me`) would stay identical.

### Design decision: bcryptjs, not bcrypt

The Guide's Development Notes say "hashed with bcrypt." This implementation uses the **`bcryptjs`** npm package (a pure-JavaScript implementation of the same bcrypt algorithm) instead of the native `bcrypt` package, to avoid requiring a native build toolchain on this Windows dev machine. It produces the same `$2a$`/`$2b$`-prefixed hash format and is a drop-in-compatible choice for the finals scope.

## Prerequisites to verify this issue

- MongoDB running locally (see [Issue #3's doc](../3-mongo-users-schema/mongo-users-schema.md) — already confirmed running as a Windows service on this machine).
- [Postman](https://www.postman.com/downloads/) installed, **or** just a browser + PowerShell (both paths are given below).
- The `golden-fur-mongo` dependencies installed (`npm install` — already done during development; re-run it if `node_modules` is missing).

## Acceptance criteria verification

| #    | Criterion                                                                                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------ |
| AC-1 | `POST /register` creates a user with a hashed password and default `role=user`                                                       |
| AC-2 | A duplicate registration attempt (same email) is rejected with a clear error                                                         |
| AC-3 | `POST /login` validates credentials and issues a session/JWT on success                                                              |
| AC-4 | A banned account (`isBanned: true`) is blocked at login with an explicit "account banned" message, even when the password is correct |
| AC-5 | `middleware/requireAuth.js` protects any route that needs a logged-in user and is reusable by Epic B                                 |

### Step 1 — Start the server

1. Open PowerShell in the repo root.
2. ```powershell
   cd golden-fur-mongo
   if (-not (Test-Path .env)) { Copy-Item .env.example .env }
   npm install
   npm start
   ```
3. **Pass (this also verifies Issue #1 AC-3 and Issue #2 AC-2 — the app boots with no dead-module or Supabase wiring):**
   ```
   [db] Connected to MongoDB (golden_fur_mongo)
   [server] Golden Fur MIS (Mongo finals variant) listening on port 4000
   ```
4. Leave this terminal running for the rest of the steps below.

### Step 2 — Run the Postman collection (covers AC-1, AC-2, AC-3, AC-5)

1. Open Postman.
2. Click **Import** (top left) → **Files** → select [`register-login-routes.postman_collection.json`](./register-login-routes.postman_collection.json) from this folder → **Import**.
3. You'll see a new collection: **"Issue #4 - Register/Login Routes (golden-fur-mongo)"** in the left sidebar.
4. Click the collection name, then the **Variables** tab, and confirm `baseUrl` is `http://127.0.0.1:4000` (matches `PORT` in your `.env` — change it here if you edited the port).
5. Click the collection's **⋮** menu → **Run collection** (or the "Run" button). In the Collection Runner, click **Run "Issue #4..."**.
6. **Pass:** all 8 requests should show a green passing test:
   - `GET /register` → 200
   - `POST /register` (new user) → 201, `role: "user"`, no `passwordHash` in the response
   - `POST /register` (duplicate email) → 409 with a clear message (not a raw Mongo `E11000` error) — **this is AC-2**
   - `POST /login` (wrong password) → 401, generic "Invalid email or password."
   - `POST /login` (correct creds) → 200, response includes a `token` — **this is AC-3**
   - `GET /me` (authenticated) → 200, returns the logged-in user — **this is AC-5, requireAuth allows a valid session through**
   - `POST /logout` → 200
   - `GET /me` (no session) → 401 — **this is AC-5, requireAuth rejects a request with no/invalid token**
7. If you don't have Postman, you can run the same checks from PowerShell instead — see the Appendix below for equivalent commands.

### Step 3 — Confirm the banned-account block (AC-4)

There is no ban/unban route yet (that's Epic B, Issue #5) — so this step flips `isBanned` directly in the database, the way an admin route will later.

1. With the server still running from Step 1, open a second PowerShell terminal.
2. Connect to the database and ban the test account created in Step 2 (`postman-test@example.com`):
   ```powershell
   mongosh "mongodb://127.0.0.1:27017/golden_fur_mongo"
   ```
   Then inside the `mongosh` prompt:
   ```js
   db.users.updateOne(
     { email: 'postman-test@example.com' },
     { $set: { isBanned: true } }
   );
   exit;
   ```
3. Back in Postman, re-run just the **"5. POST /login (correct creds, AC-3)"** request (same correct password as before).
4. **Pass:** the response is now `403` with body:
   ```json
   { "error": "This account has been banned." }
   ```
   — note the password was correct (this proves `isBanned` is checked **after** password verification, per the Guide's Development Notes), and the message is explicit, not the generic "Invalid email or password." from a wrong password.
5. Unban the account when you're done testing, so Step 2 stays repeatable next time:
   ```powershell
   mongosh "mongodb://127.0.0.1:27017/golden_fur_mongo" --eval "db.users.updateOne({email:'postman-test@example.com'},{$set:{isBanned:false}})"
   ```
   (If this inline form errors on quoting in your shell, just repeat the `mongosh` interactive steps from sub-step 2 with `isBanned: false`.)

### Step 4 — Clean up the test account (optional)

Once you're satisfied all checks pass, you can remove the Postman test user so re-running the collection from a clean slate doesn't hit the duplicate-email check on request 2:

```powershell
mongosh "mongodb://127.0.0.1:27017/golden_fur_mongo"
```

```js
db.users.deleteOne({ email: 'postman-test@example.com' });
exit;
```

---

## Appendix — verifying without Postman (PowerShell only)

If you'd rather not install Postman, the same checks can be run directly:

```powershell
$base = "http://127.0.0.1:4000"

# AC-1: register a new user
$body = @{ name = "PS Test"; email = "ps-test@example.com"; password = "correcthorse123" } | ConvertTo-Json
Invoke-WebRequest -Uri "$base/register" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing

# AC-2: duplicate email is rejected
try {
  Invoke-WebRequest -Uri "$base/register" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
} catch { $_.Exception.Response.StatusCode.value__; $_.ErrorDetails.Message }

# AC-3: login issues a session/JWT, and requireAuth accepts it
$loginBody = @{ email = "ps-test@example.com"; password = "correcthorse123" } | ConvertTo-Json
Invoke-WebRequest -Uri "$base/login" -Method POST -ContentType "application/json" -Body $loginBody -SessionVariable sess -UseBasicParsing
Invoke-WebRequest -Uri "$base/me" -Method GET -WebSession $sess -UseBasicParsing
```

This was run during development on 2026-07-15 against a live server and MongoDB instance; all responses matched the "Pass" expectations above (register → 201, duplicate → 409, wrong password → 401, correct login → 200 with a JWT, `/me` with the session cookie → 200, `/me` with no cookie → 401, and a banned account with the correct password → 403 with the explicit banned message).
