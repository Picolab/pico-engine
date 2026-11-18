# Pico Engine 1.10 — Secure remote access for agents (design and plan)

**Status:** plan. **§1 implemented** in the working tree (November 15, 2026), including the credential-header strip (§5 H1). **§2 A1–A3 implemented** (November 16, 2026): discovery documents and the MCP `401` challenge. **§2 A5–A6 implemented** (November 16, 2026): PKCE `S256` only, and RFC 8707 resource binding. **§2 A4 and A8 implemented** (November 16, 2026): Client ID Metadata Documents and the approval screen. **§3 implemented** (November 16, 2026): `mcpPolicy` on the channel, default deny. **§8 implemented** (November 16, 2026): `pico-framework` is `packages/pico-framework`. **§2 A7 and §4 implemented** (November 16, 2026): `mesh:read` and `mesh:act` are enforced, and `/mcp/mesh/{eci}` serves the subtree. **§5 H2–H3 implemented** (November 16, 2026): `http:cookie(name)` reads one application cookie; the KRL manual says credential headers do not reach KRL. **§6 implemented** (November 16, 2026): a PDS setting key can be marked secret; `settings` returns `{ secret, set }` and `config_value` returns the value to the owning ruleset. **§7 implemented** (November 16, 2026): `math:timing_safe_equal` compares signatures in constant time, and `event:raw_body()` is the exact body on a channel with `rawBody: true`. A Square-style check is in the docs and the engine tests. **§2 A9 implemented** (November 16, 2026): a public client's access token lasts one hour, each refresh issues a new refresh token, and presenting a rotated refresh token again revokes that grant. The old GitHub repository is not archived yet.
**Driver:** the IIWF CRM's conversational interface (`IIW-Foundation/crm` → `docs/design/iiwf-crm.md` §6.5, §6.10, §8)
**Requires:** the MCP policy dimension in pico-framework (beside event and query policy). In this release pico-framework moves into this repo as `packages/pico-framework` (§8), so no separate framework release is needed.

---

## Theme

Let a standard MCP client (Claude, or any client implementing the MCP authorization spec) connect to a pico mesh the way it connects to any remote MCP server: add a URL and run the OAuth flow. A person signs in with a passkey and approves the client. The client receives a token and then works. And close the internal `/c/` routes to the internet first, because 1.10 invites remote clients in.

```
/c/ hardening  →  MCP authorization (discovery, CIMD, audience)  →  MCP exposure in channel policy  →  whole-mesh MCP endpoint
   (§1, ship                (§2)                                          (§3)                              (§4)
    first; could
    be 1.9.x)

credential headers kept from KRL (§5)   secret settings (§6)                   webhook signatures (§7)
   (independent; small)                   (independent)                          (independent)
```

**Why together:** MCP authorization brings in clients nobody pre-registered. That is only safe if the engine's internal API can't be reached from outside (§1), tokens can't be replayed on endpoints they weren't issued for (§2), and agents reach only channels meant for them (§3). The whole-mesh endpoint (§4) is the first consumer that needs all three. §5–§7 close the matching leaks once outside callers are in: tokens must not flow into KRL, secrets must not be readable through ordinary queries, and machine callers must prove who they are.

---

## Scope

### 1. `/c/` routes are internal only

**Problem.** `/c/*` is the engine's internal API (developer UI, wrangler-adjacent tooling). It is guarded by `requireChannelSession`: a passkey session whose mesh contains the ECI, or, when `allowLocalhostChannelBypass` is on (the default), any request that `isLocalhostRequest` accepts. That check is weaker than "local process":

| Check in `isLocalhostRequest` | Problem |
|-------------------------------|---------|
| `Host` header starts with `localhost:` or `127.0.0.1:` | Client-controlled. A remote request with `Host: localhost:3000` passes, and gets session-less access to every pico |
| `req.ip` / socket address is loopback | Behind a reverse proxy on the same host (nginx → engine), every request arrives from 127.0.0.1. `trust proxy` isn't set and forwarded headers aren't read, so every internet request counts as local |

**Who uses the bypass.** The dev MCP server's `engineClient` (`/c/{eci}/query/…`, `/c/{eci}/event-wait/…`, plus `/api/dev/local`, `/api/ui-context`, `/api/try-it`). No KRL in the engine, manifold-api, or sensor-network posts to `/c/` (checked 2026-11-15).

**Changes**

| # | Change |
|---|--------|
| C1 | Remove the `Host` header check from `isLocalhostRequest` |
| C2 | A request carrying `X-Forwarded-For`, `X-Real-IP`, or `Forwarded` is never local, whatever its socket address |
| C3 | Replace the localhost bypass with an **internal token**: at startup the engine writes a random secret to `PICO_ENGINE_HOME/internal-token` (mode 0600); `engineClient` reads it and sends `X-Pico-Internal: <token>`; `requireChannelSession` accepts a constant-time match. Local tools work; remote callers can't forge it |
| C4 | `allowLocalhostChannelBypass` defaults to **false**; it remains as an explicit opt-in for development, and only for direct loopback connections (C1, C2) |
| C5 | Same review for the other session-or-localhost routes (`/api/dev/*`, `/api/ui-context`, `/api/try-it`) |

**Mitigation until released:** engines still running a build from before this change need `PICO_ENGINE_ALLOW_LOCALHOST_C=0` (picos.windley.net included). After this ships, that is the default, and `=1` is the opt-in for a direct loopback connection.

This part can ship alone as 1.9.x if 1.10 takes longer than a few weeks.

### 2. MCP authorization (spec-conformant discovery)

The OAuth server exists (authorization code + PKCE, `/oauth/authorize`, `/oauth/token`, approval screen, `/oauth/apps` pre-registration). A token is tied to the pico where `io.picolabs.oauth` is installed (`rootPicoId`) and is valid for channels in that pico's subtree. Missing is the discovery layer the MCP authorization spec (2025-11-25; 2026-07-28 current) requires.

| # | Change | Spec |
|---|--------|------|
| A1 | `401` from MCP endpoints carries `WWW-Authenticate: Bearer resource_metadata="<url>", scope="…"` | MCP authorization; RFC 6750 |
| A2 | Protected Resource Metadata for each MCP URL, path-suffixed: `/.well-known/oauth-protected-resource/mcp/{eci}` and `…/mcp/mesh/{eci}`, with `resource`, `authorization_servers` (this engine), `scopes_supported`, `bearer_methods_supported` | RFC 9728 (MUST) |
| A3 | Authorization server metadata at `/.well-known/oauth-authorization-server`: `issuer`, `authorization_endpoint`, `token_endpoint`, `code_challenge_methods_supported: ["S256"]`, `scopes_supported`, `client_id_metadata_document_supported: true`, `grant_types_supported` | RFC 8414 (MUST provide this or OIDC Discovery) |
| A4 | **Client ID Metadata Documents:** a `client_id` that is an HTTPS URL is fetched and validated (`client_id` in the document equals the URL; `redirect_uris` contains the request's `redirect_uri` exactly; size limit ~5 KB; 5 s timeout; no redirects to private address ranges; cache per HTTP caching headers with a ceiling). Pre-registered clients keep working. No DCR | draft-ietf-oauth-client-id-metadata-document (SHOULD); DCR deprecated |
| A5 | PKCE: `S256` only; refuse `plain` | OAuth 2.1 / MCP |
| A6 | **Resource indicators:** `resource` accepted on authorize and token requests and recorded on the token. MCP endpoints accept only tokens whose resource is that MCP URL; **Sky routes accept only tokens whose resource is a Sky resource**, so a token issued for MCP can't be replayed on `/sky/*` to skip §3 | RFC 8707 |
| A7 | Scopes: `mesh:read` (tree, schemas, queries), `mesh:act` (events), `mesh:admin` (reserved for lifecycle, §4). A missing scope → `403` with `WWW-Authenticate: … error="insufficient_scope"` | MCP authorization |
| A8 | Approval screen shows the client's `client_name`, `logo_uri`, and `client_uri` from its metadata document, the client_id host, the mesh, and the scopes requested. With CIMD anyone can be a client; this screen is the person's protection | — |
| A9 | Token lifetimes and refresh tokens reviewed for public clients (rotation on use). **Done:** public-client access tokens last one hour (a shorter configured TTL still wins). Every refresh returns a new refresh token and deletes the old one. Presenting that old token again revokes the current access token and refresh token for the grant. Confidential apps keep the 24-hour access token. Refresh tokens last 90 days from each successful refresh | OAuth 2.1 |

### 3. MCP exposure in channel policy

Channel policy today has two dimensions, event and query. Add a third: whether the channel can be reached through MCP at all. **Default deny.**

**Why.** An OAuth token covers a subtree, so without a per-channel rule a token works on every channel in it: the person's approver channel as well as their agent channel, plus webhook, UI, family, and relationship channels whose policies were written for other callers. Agents are a different risk (autonomous, injectable) from the people and machines those channels serve.

**Proposed shape**

```json
"mcpPolicy": { "allow": [ { "surface": "channel" }, { "surface": "mesh" } ], "deny": [] }
```

| Surface | Meaning |
|---------|---------|
| `channel` | The channel can serve `/mcp/{eci}` |
| `mesh` | The channel is visible to and callable from the whole-mesh endpoint (§4) |
| `*` | Both |

Evaluation is 1.8's: deny overrides permit, and the pico's policy ceiling can deny MCP for the whole pico. An empty or missing `mcpPolicy` denies. It is only exposure: what an MCP caller may do is still the channel's event and query policy. A narrower agent gets a narrower channel, as today.

| Area | Change |
|------|--------|
| pico-framework | Store and evaluate `mcpPolicy` beside event/query policy, under the ceiling (decide: framework or engine-side) |
| Wrangler | `createChannel` / `newPolicy` accept `mcpPolicy`; annotations updated |
| Engine | `/mcp/{eci}` refuses a channel without `channel`; §4 filters by `mesh` |
| Developer UI | Channels tab shows and edits MCP exposure |
| Manifold / apps | Channels stay closed unless a ruleset opts in (e.g. the CRM client's agent channel) |

**Migration.** In 1.8–1.9 any channel can serve `/mcp/{eci}`. Release notes call this out; the developer UI flags channels that served MCP recently (from logs) with a one-click "allow MCP".

### 4. Whole-mesh MCP endpoint

`/mcp/mesh/{eci}`: one connector for an administrator to work across the OAuth-protected subtree that contains `{eci}`.

| Tool | Scope | Notes |
|------|-------|-------|
| `pico_tree` | `mesh:read` | Children, names, and installed rulesets for the subtree |
| `pico_channels(pico)` | `mesh:read` | Channels with `mesh` exposure, tags, and their `channelSchema` |
| `query(eci, rid, name, args)` | `mesh:read` | On a `mesh`-exposed channel; query policy applies |
| `raise_event(eci, domain, type, attrs)` | `mesh:act` | On a `mesh`-exposed channel; event policy applies |

**Decided (2026-11-15):**
- **No wrangler lifecycle in 1.10.** Navigate, query, and event only; `mesh:admin` is reserved. Creating children or installing rulesets conversationally waits for 1.11, after use shows what's needed.
- **Engine code**, beside `/mcp/:eci` in `mcp/`, rather than a shipped ruleset: MCP is already engine code, the tools are generic, and the security checks (audience, scopes, exposure) belong with the other MCP checks.

### 5. Credential headers never reach KRL

**Problem.** Every Sky event and query receives `_headers: req.headers` (`mergeGetPost` in `server.ts`), so `event:attr("_headers")` contains `Authorization` (OAuth bearer tokens) and `Cookie` (the passkey session). Logs already strip `_headers` (`logTransactions.ts`, `modules/event.ts`), but KRL does not: a rule that forwards `event:attrs` with `event:send`, stores them in an entity variable, or returns them from a query leaks the credential.

| # | Change |
|---|--------|
| H1 | Remove `authorization`, `proxy-authorization`, `cookie`, and `x-pico-internal` from `_headers` before the event or query reaches KRL, on every route that adds `_headers` |
| H2 | Keep the engine's own `_cookie` / `_redirect` directives and PLAN-style cookie reading working: a ruleset that needs a specific cookie reads it through a narrow accessor (for example `http:cookie(name)`) rather than the raw header; decide whether anything in the tree still needs this |
| H3 | Document the rule in the KRL manual: request headers reach KRL minus credentials |

**Decided (2026-11-16):** Nothing the engine installs reads `Cookie`. The only reader was `legacy/krl/io.picolabs.cookies.krl`, which is not loaded, and that function now finds an empty header. `_cookie` and `_redirect` still set the response. `http:cookie(name)` returns one application cookie from the HTTP event or query that is running, or `null`. `pico-session` and `pico-ceremony`, including the port-scoped names, are never returned. The map rides on the event or query as an engine-only property, not in the attributes, so sending `event:attrs` cannot leak it. A rule that raises another event in the same transaction can still read it. `event:send` and a scheduled event do not carry it.

### 6. Secret settings

**Problem.** PDS settings are where a ruleset keeps its configuration, and apps (the IIWF CRM's Square, Eventbrite, and Google connectors) will keep credentials there. `pds:config_value` is scoped to the calling ruleset (`meta:callingRID()`), but PDS also shares a `settings` query that returns **every** ruleset's settings, values included, to any channel whose query policy allows `io.picolabs.pds:settings`.

**Design: mark a setting secret, and mask it.**

| # | Change |
|---|--------|
| S1 | A settings data key can be marked secret when written (`pds add_settings` with `"secret": ["apiKey", …]`, or a `secret` flag per key); the mark is stored with the setting's schema |
| S2 | The `settings` query (and `get_setting_data_value`, `settings_names` where relevant) returns secret values masked: `{"secret": true, "set": true}`, never the value, whoever asks |
| S3 | `config_value` and `get_config_value` (the calling ruleset reading its own settings) return the real value, unchanged |
| S4 | Secret values never appear in logs, the transaction inspector, portable exports' human-readable views, or MCP resources; a portable export carries them only inside the encrypted pico state that moves with the pico |
| S5 | The developer UI shows a secret setting as set / not set, with a "replace" control and no "show" |
| S6 | PDS also shares `getChannelEci()`, which returns the ECI of the `pds` channel PDS creates on every pico; that channel allows **all** `pds` events (including `clear_all_data`) and all PDS queries. Any channel allowed to call PDS queries can therefore get an ECI that can rewrite or erase all PDS data. Stop sharing `getChannelEci` (provide it to rulesets on the same pico only), or narrow the `pds` channel's event policy |

**Debugging** secret values is out of scope for 1.10; a ruleset-level `meta { debug on }` switch is in the deferred work below.

### 7. Webhook signature verification

**Problem.** Payment and integration webhooks (Square in the IIWF CRM) arrive on Sky event channels with no way for KRL to check they came from the sender: there is no HMAC in `krl-stdlib`, and the raw request body is gone by the time KRL runs, so a signature over it can't be recomputed.

| # | Change |
|---|--------|
| W1 | `math:hmac(algorithm, key, message)` in `krl-stdlib` (`sha256`, `sha1` for legacy senders), returning hex or base64 |
| W2 | A constant-time comparison (`math:timing_safe_equal(a, b)`) so KRL comparisons don't leak through timing |
| W3 | The raw body available to rules on channels that opt in (a channel setting, so ordinary channels don't keep a copy): `event:raw_body()` |
| W4 | A worked example in the docs (Square: HMAC-SHA256 over notification URL + raw body, `x-square-hmacsha256-signature` header) and a test ruleset |
| W5 | Signing keys kept as secret settings (§6) |

### 8. pico-framework moves into the monorepo

**Why.** pico-framework is the pico runtime without KRL: picos and the parent/child tree, channels and their policy (including 1.8's ceiling and 1.10's `mcpPolicy`), persistence, and event and query scheduling. It has lived in its own repo (`Picolab/pico-framework`), published to npm and consumed by `krl-stdlib`, `pico-engine-core`, and `pico-engine` at `^0.8.x`.

| The separate repo gave | It cost |
|------------------------|---------|
| A clean boundary: the runtime knows nothing of KRL or HTTP and can be tested alone | Every change to channels, policy, or roots spans two repos: a PR, an npm publish, then version bumps in three `package.json` files (1.8 needed 0.8.2 first; multi-root needed 0.8.0; §3 needed it again) |
| Independent versions | No atomic change or single test run across the boundary; the engine tests against a compiled copy in `node_modules`, which can drift from the sibling's source |
| | Agents (and people) need two repos and the publish order |

The only consumers are this repo's packages, so the boundary is worth keeping as a **package**, not as a **repo**.

| # | Step |
|---|------|
| F1 | **Done.** npm lists three dependents, and a GitHub search of `package.json` finds only `krl-stdlib`, `pico-engine-core`, and `pico-engine` in this repo. It stays a published lerna package at the engine's version, because those three import it at runtime. Deprecating it would warn every `npm install pico-engine` |
| F2 | **Done.** `mcpPolicy` was committed in the framework repo, then `git subtree add --prefix=packages/pico-framework` brought the history into this repo |
| F3 | **Done.** Package name stays `pico-framework`, version `1.9.5` with the engine. The three dependents require `^1.9.5`. `npm run build` compiles it with the other packages, and lerna's topological order builds it before `pico-engine-core` |
| F4 | **Done.** `npm test` runs its ava suite; `npm run test:framework` runs only that suite |
| F5 | **Done.** `packages/pico-framework/test/layering.ts` fails if `src` imports another package from this repo, or a relative path that leaves the package. A fixture import of `pico-engine-core` is asserted to fail |
| F6 | Archive `Picolab/pico-framework` with a README pointing here. Not done: that is a change on GitHub, and the sibling checkout on disk was left in place |
| F7 | **Done.** `CLAUDE.md`, `MEMORY.md`, the engine README, and the local Docker build no longer use the sibling checkout |
| F8 | Decide whether `select-when` (event-expression matching, also a separate dependency) follows the same path; not required for 1.10 |

---

## Implementation order

1. §1 C1–C5 + tests (spoofed `Host`, forwarded headers, internal token) — **done** in the working tree. §5 H1 (strip `authorization`, `proxy-authorization`, `cookie`, `x-pico-internal` before KRL) landed with it so the token cannot be stored from `event:attrs`
2. §2 A3, A2, A1 (discovery documents and challenge) — **done** in the working tree. `client_id_metadata_document_supported` is advertised; fetching a Client ID Metadata Document landed in step 4
3. §2 A5, A6 (S256 only; resource binding on token, MCP, and Sky) — **done** in the working tree. The Sky audience is `{base}/sky`. A token with no resource is a legacy Sky token. A client-credentials token may name `{base}/sky` or `{base}/mcp/{its own eci}`. An authorization-code token may name `{base}/sky` or `{base}/mcp/{eci}` for a channel in that mesh. The token request and each refresh must repeat that resource. `/mcp/mesh/…` is not an audience until the mesh endpoint exists. Scope enforcement is step 6
4. §2 A4, A8 (CIMD validation; approval screen) — **done** in the working tree. An https `client_id` is fetched (5 KB, 5 s, at most 5 redirects). Every hop must be public https; a private address, `.local`, `.internal`, or localhost name is refused. The document's `client_id` must equal that URL and `redirect_uris` must contain the request's redirect exactly. `token_endpoint_auth_method` must be `none` when present. Caching follows `max-age` or `Expires`, ignores `no-store` and `no-cache`, and stops at one hour. The approval screen shows `client_name`, a safe https `logo_uri` and `client_uri`, the client host, the account's mesh name, and the requested scopes. Pre-registered `app_…` clients are unchanged
5. §3 policy dimension (framework → wrangler → engine → UI) + migration notes — **done** in the working tree. `mcpPolicy` is stored on the channel next to event and query policy. A missing or empty policy denies both surfaces. `/mcp/{eci}` returns 403 for a valid token when `channel` is not allowed. A pico ceiling constrains MCP only when that ceiling has its own `mcpPolicy`; ceilings from 1.8–1.9 do not, so an owner can expose one channel without first editing the ceiling. The channels tab has the two checkboxes. Flagging channels from past MCP logs is left for the release notes. Manifold rulesets are not opted in here
6. §2 A7 scopes; §4 mesh endpoint — **done** in the working tree. `mesh:read` is required for schemas and queries, `mesh:act` for events. A missing scope is `403` with `error="insufficient_scope"`. `mesh:admin` is still unused. `/mcp/mesh/{eci}` is an authorization-code audience. Its tools are `pico_tree`, `pico_channels`, `query`, and `raise_event`. Channels appear there only when `mcpPolicy` allows `mesh`. A client-credentials token cannot name that audience; a channel MCP token that omits scope receives `mesh:read` and `mesh:act`
7. §5 H2–H3 — **done** in the working tree. Shipped rulesets do not read cookies. `http:cookie(name)` returns one application cookie for the current HTTP request and never returns `pico-session` or `pico-ceremony`. The raw `Cookie` header stays out of `_headers`. The KRL manual, the event and query pages, and the cookies-and-redirects page say so. H1 is done with §1
8. §6 secret settings — **done** in the working tree. `pds:add_settings` accepts `secret: true` or a list of key names, and a schema entry with `secret: true` marks that key. `settings` and `get_setting_data_value` return `{ "secret": true, "set": true|false }`. `config_value` uses `meta:callingRID()` and returns the value to the owning ruleset. Logs drop the value. `getChannelEci` is provided to rulesets on the pico and is not shared. The `pds` channel denies `clear_all_data`. The About tab shows set / not set and a replace field
9. §7 HMAC, constant-time compare, raw body, Square example — **done** in the working tree. `math:hmac` was already in the math library. `math:timing_safe_equal(a, b)` returns true only for two equal strings. A channel with `rawBody: true` keeps the exact HTTP body for `event:raw_body()`; other channels do not. The Square check is HMAC-SHA256 of the notification URL plus that body, base64, compared with `timing_safe_equal` to `x-square-hmacsha256-signature`. The signing key is a secret PDS setting. The write-up is `docs/developing/webhook-signatures.md`
10. §8 pico-framework into the monorepo (F1–F7) — **done** in the working tree, except archiving `Picolab/pico-framework` (F6). History is imported under `packages/pico-framework`. The package version is the engine's (1.9.5). One `lerna publish` ships it with `krl-stdlib`, `pico-engine-core`, and `pico-engine`
11. Compliance run, release notes ([`1.10.0.md`](../release/1.10.0.md)), docs — **done** in the working tree except an external MCP OAuth conformance tester and a Claude connector pass. `node tools/generate-llms-text.js` writes `docs/llms.txt` and `docs/llms-full.txt`. The KRL library pages cover `http:cookie`, `meta:callingRID`, `math:hmac`, `math:timing_safe_equal`, and `event:raw_body`. Ruleset API pages are regenerated from the annotations. Package versions stay 1.9.5 until publish. Archiving `Picolab/pico-framework` is still open

## Exit criteria

| # | Check |
|---|-------|
| 1 | A request to `/c/{eci}/query/…` with `Host: localhost:3000` from a non-loopback address gets `401`; behind nginx on the same host, an unauthenticated `/c/` request gets `401`; the dev MCP over stdio still works using the internal token |
| 2 | Adding `https://<engine>/mcp/{eci}` as a connector in Claude, with no client set up on the engine, leads to the OAuth flow: the person signs in with a passkey, the approval screen names the client, and the client then has working tools |
| 3 | An MCP OAuth compliance tester passes RFC 9728, RFC 8414, CIMD, S256, and RFC 8707 checks against the engine |
| 4 | A token issued for `/mcp/{eci}` is rejected at `/sky/query/{eci}/…` and at `/mcp/{other-eci}`; a token without `mesh:act` can't raise events |
| 5 | A channel without MCP exposure is refused at `/mcp/{eci}` and invisible at `/mcp/mesh/…`; a ceiling denying MCP on a pico overrides a channel allow |
| 6 | Through `/mcp/mesh/{eci}` on a test Manifold mesh, an agent lists the tree, reads a thing's schema, runs a query, and raises an event on exposed channels only |
| 7 | A rule that stores `event:attrs` from a Sky request carrying a bearer token and a session cookie stores neither |
| 8a | A channel that allows `io.picolabs.pds` queries cannot obtain the `pds` channel ECI |
| 8 | A secret setting written by ruleset A: `settings` returns it masked to every caller; A's `config_value` returns the value; no log line, transaction-inspector entry, or MCP resource contains the value |
| 9 | A test ruleset accepts a correctly signed Square-style webhook and rejects one with a tampered body or signature |
| 10 | `packages/pico-framework` builds and tests under the root `npm test`; `krl-stdlib`, `pico-engine-core`, and `pico-engine` use the in-repo framework; the layering check fails on a deliberate bad import; nothing in the repo references the sibling clone |

## Open questions

| Question | Notes |
|----------|-------|
| `mcpPolicy` in pico-framework or engine-side metadata | **Decided:** on the channel in pico-framework, beside event and query policy. A ceiling constrains it only when the ceiling has `mcpPolicy`. |
| Surfaces as list entries vs. two booleans | List entries match event/query policy and the ceiling's deny semantics |
| Secret mark: per key in settings, or a separate secrets area in PDS | Per-key marks keep one settings model; a separate area is harder to misuse |
| Per-person identity on mesh-endpoint calls | Calls carry the token's subject; record it in logs as the actor (feeds the CRM's attribution) |

## Deferred (TODO)

| Item | Notes |
|------|-------|
| `meta { debug on\|off }` | Per-ruleset debugging switch: unmask that ruleset's own secret settings in the `settings` query, and log in more detail (attributes minus credential headers, `pre` bindings, condition results, actions, entity writes). Guard rails worked out in review: a new keyword rather than reviving the deprecated `logging` (old rulesets still carrying `logging on` would otherwise unmask secrets unasked); an engine switch (`PICO_ENGINE_ALLOW_RULESET_DEBUG`, on only for localhost base URLs) so `debug on` deployed by accident is ignored on public engines; logs never contain secret values even with debug on; warning badge in the developer UI, `krl check` warning, and a log line at install and flush |

---

## References

- MCP authorization specification, 2025-11-25 and 2026-07-28 revisions (modelcontextprotocol.io)
- RFC 9728 (Protected Resource Metadata), RFC 8414 (AS Metadata), RFC 8707 (Resource Indicators), draft-ietf-oauth-client-id-metadata-document
- [`channel-policy-1.8.md`](channel-policy-1.8.md); [`1.8.md`](../release/1.8.md) §3 (mesh MCP); `MEMORY.md` → engine environment variables (`PICO_ENGINE_ALLOW_LOCALHOST_C`)
- Code: `src/server.ts` (`isLocalhostRequest`, `requireChannelSession`, `mergeGetPost`, `/oauth/*`), `src/oauth/`, `mcp/meshHttp.js`, `mcp/engineClient.js`, `krl/io.picolabs.pds.krl` (`settings`, `config_value`), `krl-parser` meta `logging`, `pico-engine-core/src/logTransactions.ts`
