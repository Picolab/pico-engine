# Phase 1b manual test checklist

Passkey auth, zero-root boot, and multi-account isolation. Check off items as you go.

## Core flow (you've likely done these)

- [x] Fresh engine (empty `~/.pico-engine`) shows **register only** — no login option
- [x] Register with passkey → root pico appears in mesh UI
- [x] Display name at registration becomes the **root pico name** (not "Pico")
- [x] Change root pico color → persists after reload
- [x] Logout → returns to auth gate
- [x] Register a **second account** → separate root pico
- [x] Log into account 1 → account 1's color/state still intact (tenant isolation)



## Session & persistence

- [x] **Re-login round-trip** — log into each account with its passkey; correct mesh and colors
- [x] **Engine restart** — stop/start engine; roots, names, colors survive; passkey login required again
- [x] **Incognito / fresh browser** — login screen only (no register); passkey picker offers correct accounts
- [x] **Logout clears session** — after logout, in devtools:
  ```js
  fetch('/api/ui-context', { credentials: 'include' }).then(r => r.json()).then(console.log)
  ```
  Expect `session.authenticated === false` and no `eci`



## Tenant isolation (security)

- [ ] **Cross-account ECI blocked** — while logged in as account 2, try account 1's ECI (401 when logged out, 403 when logged in as wrong account)
- [x] **Child pico scoping** — under account 1, create a child pico; log into account 2; child does not appear



## Mesh UI under auth

- [x] **Child pico CRUD** — create, recolor, delete a child under each account; survives engine restart
- [x] **Normal engine ops** — flush ruleset, channel/event actions, sky queries still work via session-gated routes



## Passkey lifecycle (API only — no UI yet)

Endpoints: `POST /auth/credentials/options`, `POST /auth/credentials/verify`, `DELETE /auth/credentials/:id` (requires session cookie).

- [ ] **Second passkey on same account** — login works with either passkey; root count unchanged
- [ ] **Cannot delete last passkey** — with one passkey, delete fails; add second, delete one, still one left



## Config edge (optional)

- [ ] `allowSelfSignup: false` — "Create another account" hidden; second registration blocked; first account can still log in  
  *(CLI: `PICO_ENGINE_ALLOW_SELF_SIGNUP=true` to enable open multi-account.)*

## Invites (Phase 1d)

- [ ] **Create invite** — Settings → "Create invite link" → copy URL
- [ ] **Invite register** — open link in incognito → register form (not login-only); completes with new root
- [ ] **Single-use** — same invite link fails on second use
- [ ] **Expired/invalid invite** — shows warning; register blocked without valid token

## Legacy migration (Phase 1c)

- [ ] **Claim existing mesh** — old `~/.pico-engine` with a root but no auth → shows **Claim with passkey** (not login/register)
- [ ] After claim → same mesh data, one root, passkey login works
- [ ] Register endpoint blocked until claim completes (no accidental second root)

## Known gap (do not expect to work)

- [ ] **Orphan second root** — if register was used on a legacy DB before claim, root #2 may exist; manual cleanup only