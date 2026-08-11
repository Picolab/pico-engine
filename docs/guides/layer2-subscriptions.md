# Layer 2 subscriptions and identity (1.6)

Guide for operators and ruleset authors: how picos get **did:webvh** identity, form **Layer 2** subscriptions with **did:peer** crypto, and communicate within or across engines.

**Related design docs:** [`docs/design/pico-identity-layer2-work.md`](../design/pico-identity-layer2-work.md) · [`docs/design/sky-didcomm-protocol.md`](../design/sky-didcomm-protocol.md)

---

## Concepts

| Term | Meaning |
|------|---------|
| **did:webvh** | Portable identity for every pico (actor, VC subject, public intro target). Served at `/picos/{picoId}/did.jsonl`. |
| **did:peer** | Pairwise subscription identity (num_algo **2** in 1.6). Used for DIDComm after intro. |
| **Layer 2 subscription** | Subscription formed via SKY intro (`layer2: true`, `target_did`). Stores `Tx_did` / `Rx_did` instead of legacy Tx/Rx ECIs for remote traffic. |
| **Legacy subscription** | Classic ECI handshake via `wellKnown_Tx` → `wellKnown_Rx`. Still supported. |
| **Intra-mesh** | Caller and recipient share the same mesh root on one engine → **verified local dispatch** (no DIDComm HTTP). |
| **Cross-mesh / cross-engine** | Different mesh roots or different engines → **SKY over DIDComm** (encrypted JWE to ingress). |
| **publicIntro** | Root picos default `true`; child picos default `false`. When `true`, unsolicited SKY intro to this pico's did:webvh is accepted. |

---

## Channel and transport matrix

| Relationship | Subscription type | Remote query/event transport | Policy enforcement |
|--------------|-------------------|------------------------------|-------------------|
| Parent → child (family) | None (family channel) | Local `ctx:query` / events only | Family channel owner |
| Same mesh, same engine | Layer 2 or legacy | Local dispatch when intra-mesh | Subscription **Rx** channel |
| Cross-mesh, same engine | Layer 2 | DIDComm → ingress | Subscription **Rx** channel |
| Cross-engine | Layer 2 | DIDComm → peer's ingress URL | Subscription **Rx** channel |
| Legacy ECI sub, same engine | Legacy | HTTP/event:send to **Tx** ECI | Tx/Rx channel policies |
| OAuth integrator | N/A | HTTP `/sky/*` + Bearer | Channel policy on target ECI |

**Edit Rx policy:** Developer UI → **Channels** tab, or Subscriptions tab → link to Channels (`?focus=<rxEci>`).

---

## What to use when creating a subscription

| Field | Layer 2 | Legacy |
|-------|---------|--------|
| **`target_did`** | Recipient's **did:webvh** (`wrangler:myDid`, Identity panel) | *Do not use* |
| **`wellKnown_Tx`** | *Do not use* | Recipient's **wellKnown_Rx ECI** (Channels / Identity panel) |
| **`name`** | Human label stored on the bus (also names the internal Rx channel) | Same |
| **Peer DID (`did:peer:…`)** | *Not at create time* — minted during SKY intro after approval | N/A |

**Same engine, Layer 2:** paste the other pico's **did:webvh**, not its peer DID and not its wellKnown ECI. The engine resolves did:webvh locally and runs the SKY intro without HTTP when both picos share this engine.

---

## Layer 2 subscription (same engine)

1. **Initiator** raises `wrangler:subscription` with:
   - `layer2: true`
   - `target_did`: recipient's **did:webvh** (from `wrangler:myDid` or UI — **not** did:peer, **not** wellKnown_Rx)
   - `name`, `Tx_role`, `Rx_role`, `channel_type` (usually `Tx_Rx`)
2. Engine sends **SKY intro** (local dispatch if target is on this engine).
3. **Recipient** approves (`wrangler:pending_subscription_approval`) if not auto-accept.
4. Both sides show **established** with `layer2: true`, `Tx_did`, `Rx_did` (no remote **Tx** ECI).

**Query remote pico:**

```javascript
// From KRL via subscription ruleset queryOnSub, or wrangler:picoQuery with did:
wrangler:picoQuery(<did_or_peer>, "io.picolabs.wrangler", "id", {})
```

**Send event:**

```krl
event:send({
  "did": "<peer did or webvh did>",
  "domain": "wrangler",
  "type": "ping",
  "attrs": {}
})
```

Or `wrangler:send_event_on_subs` with subscription Id (UI: Subscriptions tab → Test send).

---

## Legacy ECI subscription (unchanged)

1. Recipient must expose **wellKnown_Rx** (created on engine start).
2. Initiator raises `wrangler:subscription` with **`wellKnown_Tx`** = recipient's wellKnown_Rx ECI (not `layer2`).
3. Classic `new_subscription_request` / approval flow.
4. Established bus has **Tx** / **Rx** ECIs; `layer2` is false.

Regression-tested in `test/epic9Matrix.ts` and `test/helpers/legacySub.ts`.

---

## Cross-engine subscription

Requirements:

1. Each engine has a stable, **peer-reachable** `PICO_ENGINE_BASE_URL` (embedded in did:webvh).
2. Recipient root (or target pico) has **`publicIntro: true`** (default for roots).
3. Initiator uses `target_did` = recipient's did:webvh.

Flow matches same-engine Layer 2, but intro/response/traffic uses **DIDComm** to `{base}/sky/event/{ingressEci}/none/dido/didcomm_message`.

Automated test: `npm run test:cross-engine` (two isolated engines in one Node process).

---

## Cross-engine on one machine (recommended demo)

Run two engine processes with separate homes and ports. Each engine uses the default `PICO_ENGINE_BASE_URL` (`http://localhost:$PORT`), so passkeys and cross-engine DIDComm both work — the same setup as `npm run test:cross-engine`.

```sh
# terminal 1 (repo root)
PICO_ENGINE_HOME=/tmp/pico-engine-a PORT=3001 npm start

# terminal 2
PICO_ENGINE_HOME=/tmp/pico-engine-b PORT=3002 npm start
```

| Engine | UI | Data |
|--------|-----|------|
| A | http://localhost:3001 | `/tmp/pico-engine-a` |
| B | http://localhost:3002 | `/tmp/pico-engine-b` |

### Manual demo checklist

1. **Register** a passkey on **both** UIs (each engine is a separate mesh).
2. On **engine B**, open a channel → query `wrangler:myDid` → copy the **did:webvh** string.
3. On **engine A**, **Subscriptions** tab → Layer 2 create → paste B's did → submit.
4. On **engine B**, **Subscriptions** → inbound → **Approve**.
5. On **engine A**, confirm **established** shows `Tx_did`, `Rx_did`, `Tx_host` pointing at B.
6. **Test query:** from A, `wrangler:picoQuery` to B's did or use Subscriptions test send.

### Troubleshooting

| Symptom | Check |
|---------|--------|
| Intro never arrives | B `publicIntro`; B listening on 3002; firewall |
| DID resolution failed | Fetch `http://localhost:3002/picos/{rootId}/did.jsonl`; verify SCID |
| 401 on DIDComm ingress | Ingress ECI provisioned; JWE keys match (re-approve sub) |

**Note:** DIDs embed the base URL from pico creation time. For a clean demo, remove and recreate the home dirs (`rm -rf /tmp/pico-engine-a /tmp/pico-engine-b`).

### Docker (optional, not recommended for cross-engine)

Bridge-network Docker containers cannot reach each other via `localhost` URLs embedded in DIDs. Prefer two host processes above. `docker-compose.cross-engine.yml` exists for experiments only.

---

## Developer UI (1.6)

**Subscriptions tab:**

- Identity panel: `myDid`, `publicIntro`, legacy `wellKnown_Rx`
- Layer 2 create: paste recipient **did:webvh** as `target_did` (+ optional **name**, roles)
- Legacy tab: recipient **wellKnown_Rx ECI** as `wellKnown_Tx`
- Established / inbound / outbound lists show **name** (when set) with subscription Id; expand for `Tx_did` / `Rx_did` and Rx policy preview
- Link to **Channels** tab for Rx policy editing

Rebuild UI after engine changes: `cd packages/pico-engine-ui && npm run build`

---

## KRL / wrangler surface

| API | Purpose |
|-----|---------|
| `wrangler:myDid()` | Caller's did:webvh |
| `wrangler:publicIntro()` / `set_public_intro` | Public intro toggle |
| `wrangler:subscription` + `layer2`, `target_did` | Start Layer 2 sub |
| `wrangler:subscription` + `wellKnown_Tx` | Start legacy sub |
| `wrangler:picoQuery(eci, mod, func, params)` | Query; `eci` may be did:webvh or did:peer |
| `event:send({ did: ... })` | Event to remote pico by DID |
| `dido:crossPicoQuery` / ingress | Engine-internal; rulesets use wrangler/subscription |

**Deprecated:** `io.picolabs.did-o` ruleset; `dido:prepareQuery`. Use `event:send` and `wrangler:picoQuery` with DIDs.

---

## Testing

```sh
cd packages/pico-engine
npm run test:epic9          # release regression matrix
npm run test:cross-engine   # two engines, intro + query + event
npm run test:layer2-wrangler
npm run test:layer2-policy
npm run test:webvh
npm run test:sky-intro
npm run test:didcomm
```

---

## Not in 1.6

- **did:peer:4** (using num_algo 2)
- **Pico move** / did:webvh rotation (`docs/design/pico-move.md`)
- **Legacy subscription migration** (new Layer 2 subs only; legacy path unchanged)
- **VC authorization** (Phase 5)
