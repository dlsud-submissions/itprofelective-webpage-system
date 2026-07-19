# Issue #3 - feat(auth): set up MongoDB connection and users schema (Mongoose)

**Epic:** Sprint 1 - Epic A - M01 User Registration & Authentication (Golden Fur MIS, MongoDB finals variant)
**Branch:** `feat/mongo-users-schema`
**Owner:** Matthew
**Depends on:** #2 merged

## What was built

| File                                                         | Purpose                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`server/database/db.js`](../../../../server/database/db.js) | Connects to MongoDB via Mongoose on server start. Logs a clear error and calls `process.exit(1)` if `MONGODB_URI` is missing or the connection fails, so the server never runs "half-alive".                                                                                    |
| [`server/models/User.js`](../../../../server/models/User.js) | The `users` collection schema: `name`, `email` (required, unique), `passwordHash` (required, `select: false` so it is never returned by a plain query), `role` (enum `user`/`staff`/`admin`, default `'user'`), `isBanned` (default `false`), `createdAt` (default `Date.now`). |

This is the single source of truth for the schema. Epic B (M02 Staff Admin Panel) will import this model rather than redefining fields.

## MongoDB setup from zero

This project expects MongoDB to run on your own computer at:

```text
mongodb://127.0.0.1:27017/golden_fur_mongo
```

That connection string means:

| Part               | Meaning                                                                               |
| ------------------ | ------------------------------------------------------------------------------------- |
| `127.0.0.1`        | Your own computer.                                                                    |
| `27017`            | MongoDB's default local port.                                                         |
| `golden_fur_mongo` | The database name this app uses. MongoDB creates it when the first document is saved. |

### Install MongoDB

1. Install **MongoDB Community Server** from the MongoDB website.
2. During installation, keep the option to run MongoDB as a **Windows Service**.
3. Install **MongoDB Shell (`mongosh`)** too. This is the command-line tool used to inspect the database.
4. Open PowerShell.
5. Check whether MongoDB is running:
   ```powershell
   Get-Service MongoDB
   ```
6. **Pass:** the `Status` column says `Running`.
7. If the status says `Stopped`, start it:
   ```powershell
   Start-Service MongoDB
   ```
8. If PowerShell says access is denied, open PowerShell as Administrator and run `Start-Service MongoDB` again.

### Create the project env file

1. Open PowerShell in the repo root.
2. Copy the example environment file if `server\.env` does not exist yet:
   ```powershell
   if (-not (Test-Path server\.env)) { Copy-Item server\.env.example server\.env }
   ```
3. Open `server\.env` and confirm it contains:
   ```text
   PORT=4321
   MONGODB_URI=mongodb://127.0.0.1:27017/golden_fur_mongo
   JWT_SECRET=replace-with-a-long-random-string
   JWT_EXPIRES_IN=1d
   ```

### Navigate MongoDB with mongosh

1. Open a new PowerShell terminal.
2. Connect to the app database:
   ```powershell
   mongosh "mongodb://127.0.0.1:27017/golden_fur_mongo"
   ```
3. **Pass:** the prompt changes to something like:
   ```text
   golden_fur_mongo>
   ```
4. Use these commands inside `mongosh`:
   ```js
   db
   show dbs
   show collections
   db.users.find()
   db.users.find().pretty()
   exit
   ```

What those commands mean:

| Command                    | What it does                                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------------------- |
| `db`                       | Shows the database you are currently using.                                                        |
| `show dbs`                 | Lists databases MongoDB knows about. `golden_fur_mongo` may not appear until a user is registered. |
| `show collections`         | Lists collection names inside the current database. Collections are similar to tables.             |
| `db.users.find()`          | Shows documents in the `users` collection.                                                         |
| `db.users.find().pretty()` | Shows users in a more readable layout.                                                             |
| `exit`                     | Leaves the MongoDB shell.                                                                          |

## Acceptance criteria verification

| #    | Criterion                                                                                                                                        | How to verify |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| AC-1 | `server/database/db.js` connects to MongoDB on server start                                                                                      | Step 1 below  |
| AC-2 | `server/models/User.js` defines `name`/`email`/`passwordHash`/`role`/`isBanned`/`createdAt` with the constraints/defaults in the DB Design sheet | Step 2 below  |
| AC-3 | Connection errors are logged clearly, not silently swallowed                                                                                     | Step 3 below  |

### Step 1 - Confirm the server connects to MongoDB on startup

1. Open a PowerShell terminal in the repo root.
2. Install dependencies if needed:
   ```powershell
   npm run install:all
   ```
3. Start only the backend API:
   ```powershell
   npm run mongo:start
   ```
4. **Pass:** within a second or two you should see:
   ```text
   [db] Connected to MongoDB (golden_fur_mongo)
   [server] Golden Fur MIS (Mongo finals variant) listening on port 4321
   ```
5. Press `Ctrl+C` to stop the server when done, or leave it running for Issue #4's register/login checks.

### Step 2 - Confirm the schema shape and defaults directly in the database

This is easiest to observe after registering a user, because registration creates a real MongoDB document. If you have not registered a test user yet, follow Issue #4 Step 2 first.

1. With the server running, open a second PowerShell terminal.
2. Connect to the database:
   ```powershell
   mongosh "mongodb://127.0.0.1:27017/golden_fur_mongo"
   ```
3. Inspect a user document:
   ```js
   db.users.findOne({ email: 'your-test-email@example.com' });
   ```
4. **Pass:** the returned document has `_id`, `name`, `email`, `passwordHash`, `role`, `isBanned`, `createdAt`, and `__v`.
5. **Pass:** `passwordHash` starts with `$2a$` or `$2b$`. It should never be the plaintext password you typed.
6. **Pass:** `role` is `"user"` unless you intentionally changed it.
7. **Pass:** `isBanned` is `false` unless you intentionally changed it.
8. Check that no user has an invalid role:
   ```js
   db.users.find({ role: { $nin: ['user', 'staff', 'admin'] } }).count();
   ```
9. **Pass:** this returns `0`.
10. Leave `mongosh`:
    ```js
    exit;
    ```

### Step 3 - Confirm connection errors are logged clearly, not swallowed

1. Stop the server if it is running (`Ctrl+C` in its terminal).
2. Temporarily point the server to a bad MongoDB port:
   ```powershell
   $env:MONGODB_URI = "mongodb://127.0.0.1:27099/golden_fur_mongo"
   npm run mongo:start
   ```
3. **Pass:** within a few seconds you should see a clear error like:
   ```text
   [db] Failed to connect to MongoDB: connect ECONNREFUSED 127.0.0.1:27099
   ```
4. **Pass:** the process exits and returns to the prompt. It should not keep the server running with a broken database layer.
5. Clear the temporary override:
   ```powershell
   Remove-Item Env:\MONGODB_URI
   ```
6. Confirm normal startup still works:
   ```powershell
   npm run mongo:start
   ```
7. **Pass:** you see the normal `[db] Connected to MongoDB (golden_fur_mongo)` message again.
