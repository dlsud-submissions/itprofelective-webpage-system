# Issue #2 — chore(scaffold): remove or archive unused module folders/routes (M03–M14)

**Epic:** Sprint 1 — Epic A — M01 User Registration & Authentication (Golden Fur MIS, MongoDB finals variant)
**Branch:** `chore/remove-unused-modules`
**Owner:** James
**Depends on:** #1 merged

## Scope decision (read this first)

Same as [Issue #1](../1-strip-supabase-oauth/strip-supabase-oauth.md): this epic is built in a brand-new `golden-fur-mongo/` folder rather than by deleting anything from the existing `client/`/`server/` course project. There were never any M03–M14 folders in `golden-fur-mongo/` to remove — Issue #2's intent (only M01/M02-relevant code is wired into `server.js`, no dead modules) is satisfied by construction: the scaffold was never given routes/views/models for Appointment & Booking, Grooming, Pet Hotel, Daycare, Health & Veterinary, Sales & Billing, Policy Enforcement, Credit Balance, Notification, Discount Management, Maintenance, or Report Management (the 12 modules listed as deferred in `Sprint1-EpicStructure.xlsx` → "Out of Scope").

## What exists after this issue

`golden-fur-mongo/server.js` mounts exactly one router: `routes/authRoutes.js` (M01, added in Issue #4). M02 (Staff Admin Panel) is Epic B and is not part of this repo yet.

## Acceptance criteria verification

| #    | Criterion                                                                     | How to verify |
| ---- | ----------------------------------------------------------------------------- | ------------- |
| AC-1 | Only routes/views/models needed for M01 and M02 remain wired into `server.js` | Step 1 below  |
| AC-2 | Removed folders do not break the app on startup                               | Step 2 below  |

### Step 1 — Confirm only M01 is wired into `server.js`

1. Open [`golden-fur-mongo/server.js`](../../../../golden-fur-mongo/server.js) in your editor.
2. Confirm the only route mount is:
   ```js
   app.use('/', authRoutes);
   ```
3. Confirm `golden-fur-mongo/routes/` contains exactly one file: `authRoutes.js`.
4. **Pass:** no other module's routes (booking, grooming, billing, etc.) are present or mounted.

### Step 2 — Confirm the app starts cleanly with only M01 present

See [`testing/docs/issues/4-register-login-routes/register-login-routes.md`](../4-register-login-routes/register-login-routes.md), Step 1 — the same live boot check documents this. It was run during development on 2026-07-15 and the server started with no errors:

```
[db] Connected to MongoDB (golden_fur_mongo)
[server] Golden Fur MIS (Mongo finals variant) listening on port 4321
```
