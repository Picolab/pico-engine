# pico-engine-ui

React UI for pico-engine (developer canvas, passkey sign-in, Settings, Channels).

## Build

```sh
npm run build
```

Compiles TypeScript, bundles with Vite, and copies `pico-engine-ui.*` into `../pico-engine/public/` for the engine to serve.

The repo root `npm run build` does **not** include this step — run it here after UI changes.

## Dev

```sh
npm run dev
```

Runs TypeScript watch + Vite dev server. For full-stack work, also run `npm start` in `packages/pico-engine`.

After UI changes without the Vite dev server, run `npm run build` and restart the engine so it serves the updated bundle from `../pico-engine/public/`.

## Auth URL cleanup

After passkey registration, claim, or login, auth-related query params (`invite`, `oauth_return`) are removed from both the location search string and hash routes (e.g. `#/?invite=…`), so the address bar stays clean on the main canvas.

## Bootstrap picos

If a bootstrap ruleset creates child picos asynchronously after registration, the canvas re-fetches the pico tree at 500ms, 1.5s, and 3s so late-arriving picos (e.g. owner, manifold) show up without a manual browser refresh.

## Settings

The Settings modal (gear icon) includes collapsible sections:

- **Passkeys** — list, add, remove
- **Invite someone** — when self-signup is disabled
- **OAuth apps** — register Authorization Code clients (`app_…`) for mesh-wide access; requires `io.picolabs.oauth` on the root pico

See [packages/pico-engine README](../pico-engine/README.md#oauth) for the OAuth flow.
