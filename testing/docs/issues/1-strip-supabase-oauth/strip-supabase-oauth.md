# Issue #1 — chore(scaffold): strip Supabase client, env vars, and OAuth code

**Epic:** Sprint 1 — Epic A — M01 User Registration & Authentication (Golden Fur MIS, MongoDB finals variant)
**Branch:** `chore/strip-supabase-oauth`
**Owner:** Matthew, Alarie

## Scope decision (read this first)

This repo (`itprofelective-webpage-system`) is the **Supabase-based course project** and is still in active use — the `client/`, `server/`, and `supabase/` folders belong to that other course's project and were **not touched**.

The MongoDB finals variant lives entirely in a new top-level folder, **`golden-fur-mongo/`**, built from scratch as a self-contained Node/Express/Mongoose app. Because it's new, there was no literal Supabase client or OAuth code to delete — Issue #1's intent (a codebase with zero Supabase/OAuth traces before any MongoDB code is written) is satisfied by construction: `golden-fur-mongo/` never imports `@supabase/supabase-js`, never references a Supabase env var, and contains no `GoogleOAuthButton` / `FacebookOAuthButton` / `SocialAuthButtons` / `OAuthCallbackPage` equivalents.

## What exists after this issue

```
golden-fur-mongo/
├── package.json       (dependencies: express, mongoose, bcryptjs, jsonwebtoken, cookie-parser, dotenv — no Supabase, no OAuth libs)
├── .env.example        (PORT, MONGODB_URI, JWT_SECRET, JWT_EXPIRES_IN — no Supabase keys)
└── server.js            (boots Express + Mongoose only)
```

`database/`, `models/`, `middleware/`, `controllers/`, `routes/`, `views/` are added in Issues #3 and #4 (see their own verification docs in this `testing/docs/issues/` tree).

## Acceptance criteria verification

| #    | Criterion                                                                                                         | How to verify                                                                                                                  |
| ---- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| AC-1 | No Supabase client import or `.env` key remains anywhere in the codebase                                          | Step 1 below                                                                                                                   |
| AC-2 | `GoogleOAuthButton`, `FacebookOAuthButton`, `SocialAuthButtons`, `OAuthCallbackPage` (or equivalents) are removed | Step 2 below                                                                                                                   |
| AC-3 | The repo still starts without errors after removal                                                                | Step 3 below (covered fully by Issue #4's doc, since `golden-fur-mongo/` only becomes runnable once Issue #3/#4's files exist) |

### Step 1 — Confirm no Supabase references in `golden-fur-mongo/`

1. Open a terminal in the repo root (`itprofelective-webpage-system`).
2. Run:
   ```powershell
   Select-String -Path golden-fur-mongo\**\* -Pattern "supabase" -SimpleMatch -CaseSensitive:$false
   ```
3. **Pass:** no output (no matches). This confirms the new scaffold has zero Supabase references.

### Step 2 — Confirm no OAuth components exist

1. Run:
   ```powershell
   Select-String -Path golden-fur-mongo\**\* -Pattern "OAuth" -SimpleMatch
   ```
2. **Pass:** no output. `golden-fur-mongo/` is email+password only — there is no Google/Facebook OAuth button or callback page anywhere in this new app.

### Step 3 — Confirm the app boots without errors

See **`testing/docs/issues/4-register-login-routes/register-login-routes.md`**, Step 1 ("Start the server") — since `server.js` only becomes fully wired once the Issue #3/#4 files are in place, that's where the live "starts without errors" check is performed and documented.
