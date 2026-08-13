# pico-engine

[![Node version](https://img.shields.io/node/v/pico-engine.svg)](https://nodejs.org/en/download/)

An implementation of the [pico-engine](http://www.windley.com/archives/2016/03/rebuilding_krl.shtml) hosted on node.js

## Getting Started

### Installing

You'll need [node.js](https://nodejs.org/) LTS or Current (we recommend LTS).

- Windows - use the installer at [nodejs.org](https://nodejs.org/en/download/)
- Mac - use the installer at [nodejs.org](https://nodejs.org/en/download/) or use [n bash script](https://github.com/tj/n) (n makes it easy to switch between node versions)
- Linux - we recommend the [n bash script](https://github.com/tj/n) which will allow you to easily install and switch between node versions.

Once you have node installed, use npm to install the `pico-engine`;

```sh
$ npm install -g pico-engine
```

Now your system has a new command called `pico-engine`.

To start the engine simply run this command

```sh
$ pico-engine
```

Visit the url `http://localhost:3000` in a browser to use the developer UI (described below).

#### Troubleshooting

###### If install fails and you see `gyp ERR! ...` in the output:

pico-engine uses [leveldb](http://leveldb.org) to store data. It's a C++ library which is prebuilt for most systems. However, if the prebuilt binary is not available for your combination of operating system and node.js version, npm will compile it for you using [node-gyp](https://github.com/nodejs/node-gyp#installation). However, `node-gyp` assumes your system will have python 2 and a c++ compiler available.

**Windows**

Open command prompt as Administrator then run `npm install --global --production windows-build-tools` That will configure python and c++ compiler for npm.

We have had reports that the `pico-engine` command stops working with earlier versions of `node.js`, so update to the latest version.

**Mac / Linux**

Be sure you have python 2.7 installed. If python 3 is the system default, all you need to do is configure npm to use python 2.7 like so `npm config set python /path/to/executable/python2.7`

To setup C++

```sh
# Mac
xcode-select --install
# Ubuntu
sudo apt-get install build-essential
# AWS Linux
sudo yum groupinstall "Development Tools"
```

For more help, see [node-gyp](https://github.com/nodejs/node-gyp#installation).

##### Folder problems

When you run the `npm install` command, if you are in a folder which contains a folder named `pico-engine`, the command can fail in various ways.
Otherwise it doesn't matter which folder you are in, since you are doing a global install.

##### If these steps don't help

Open an [issue](https://github.com/picolab/pico-engine/issues/new) and tag @farskipper. Please include your operating system, node.js version (`node -v`), and a copy of the error output.

### Bootstrap

The first time you run the system it will create a root Pico with three rulesets installed.

There are three rulesets used by all Picos:

- `io.picolabs.wrangler` is used by each Pico to keep track of itself and its children
- `io.picolabs.pico-engine-ui` is used by each Pico to keep track of its rectangle in the developer UI
- `io.picolabs.subscription` is used by each Pico to keep track of its subscriptions to other picos

### Using the developer UI

With the rulesets installed, you can drag the rectangle representing your Pico and drop it
wherever you want it. In its "About" tab (click on it to reveal the tabs) you can change its
display name and color.

Also in the "About" tab, you can add and delete child Picos.

In the "Rulesets" tab you can see the rulesets installed in your Pico.
By clicking on a ruleset id,
you will see the location of its source code.

To make your own ruleset, use an editor to write its KRL code.
Enter the URL of that file in the "Rulesets" tab and click on the "Install" button.

### Updating/downgrading

Heads up! Especially when downgrading there may be a risk of data loss. It's recommended you backup your pico-engine home folder first. By default the folder is located `~/.pico-engine/` it contains your database.

```sh
# to view your current version
$ pico-engine --version

# to view what npm has installed globally, including current version
$ npm ls -g --depth 0 pico-engine

# to view available versions
$ npm view pico-engine versions

# to install a specific version i.e. `0.41.0`
$ npm install -g pico-engine@0.41.0
```

## CLI

### Configuration

The server is configured via some environment variables.

- `PORT` - The port the http server should listen on. By default it's `3000`
- `PICO_ENGINE_HOME` - Where the database and other files should be stored. By default it's `~/.pico-engine/`
- `PICO_ENGINE_BASE_URL` - The public url prefix to reach this engine. By default it's `"http://localhost:3000"`
- `PICO_ENGINE_ALLOW_SELF_SIGNUP` - Set to `"true"` or `"1"` to allow open registration after bootstrap (default: off; bootstrap and invite still work)
- `PICO_ENGINE_ALLOW_LOCALHOST_C` - Set to `"0"` to require passkey session on `/c/*` even from localhost (default: allow localhost without session for in-engine HTTP loops). Full registry: repo `MEMORY.md` § Engine environment variables.

The `PORT` is the only value used in setting up the engine’s [nodejs http server](https://nodejs.org/api/net.html#net_server_listen_port_host_backlog_callback). We only specify the `port` so it listens listens to all traffic on that port, it will not filter by host.

For example, say you want to have your engine running with SSL on a custom domain i.e. `https://example.com` Starting the engine like this `PICO_ENGINE_BASE_URL=https://example.com pico-engine` is not enough. You will need to use a reverse proxy server like nginx to handle the SSL termination, and then forward the traffic to your private port that is running the engine.

## Authentication

The developer UI uses **passkeys** (WebAuthn). On first visit you register a passkey, which creates your account and root pico. Sign in again with the same passkey; add more passkeys or invite others from **Settings** (gear icon).

When self-signup is disabled, **Settings → Invite someone** can include an optional **bootstrap ruleset URL** (`file://` or `https://`). The engine validates the URL when the invite is created; when the invitee registers, that ruleset is installed on their new root after the base OS rulesets (e.g. a Manifold bootstrap KRL). The invite **label** pre-fills the invitee's mesh name (editable before registering). WebAuthn `user.name` is set to the mesh name so password managers (e.g. 1Password) show it alongside the site hostname.

- **`/c/*`** — internal/UI API; requires a passkey session cookie (localhost bypass is on by default for in-engine KRL HTTP loops; set `PICO_ENGINE_ALLOW_LOCALHOST_C=0` to disable).
- **`/auth/*`** — registration, login, session management.

## OAuth

OAuth protects external access to the mesh on **`/sky/*`**. The UI and in-engine loops continue to use passkey sessions on **`/c/*`**.

Two grant types can coexist in the same mesh:

| Grant | Use case | Client ID | Scope |
|-------|----------|-----------|-------|
| **Client Credentials** | Inbound webhooks (Stripe, GitHub, …) | Channel **ECI** | Single channel only |
| **Authorization Code + PKCE** | Apps like Home Assistant | `app_…` | Whole mesh (root + descendants) |

### Mesh lock

Install the optional ruleset **`io.picolabs.oauth`** on the **root pico** to require a Bearer token on all **`/sky/*`** requests for that mesh. Without it, open channels work as before (channel policy only); channels tagged **`oauth-webhook`** always require Bearer.

From the Rulesets tab, install `io.picolabs.oauth` (KRL source: `packages/pico-engine/krl/io.picolabs.oauth.krl`). Removing the ruleset unlocks the mesh again.

Ruleset queries (install `io.picolabs.oauth` on the root): `meshEnabled()`, `meshRequiresOAuth(eci)`, `channelStatus(eci)`, `createChannelSecret(eci)`, … — see `krl/io.picolabs.oauth.krl`.

### Webhook credentials (Client Credentials)

For channels tagged **`oauth-webhook`** at creation time:

1. Open the channel in the **Channels** tab.
2. **Create credentials** — `client_id` is the channel ECI; copy the `client_secret` (shown once).
3. Mint a test token in the UI, or call `POST /oauth/token`:

```http
POST /oauth/token
Content-Type: application/json

{
  "grant_type": "client_credentials",
  "client_id": "<channel-eci>",
  "client_secret": "<secret>"
}
```

The returned **`oat_…`** access token works only on **`/sky/*`** URLs for **that ECI**.

Family, subscription, and system channels are not eligible.

### OAuth apps (Authorization Code)

For integrators that need access across the mesh (e.g. Home Assistant):

1. Install **`io.picolabs.oauth`** on the root pico (mesh lock).
2. **Settings → OAuth apps** — register an app (name, redirect URIs, public vs confidential client). The **client ID** (`app_…`) is not secret; a confidential client’s **secret** is shown once.
3. The app sends the user to authorize; after passkey consent, the app exchanges the code for tokens.

**Authorize** (browser; user must be signed in):

```http
GET /oauth/authorize?client_id=app_…&redirect_uri=…&response_type=code&code_challenge=…&code_challenge_method=S256&scope=mesh
```

Unauthenticated users are redirected to sign in and then returned to authorize (`/?oauth_return=…`).

**Token exchange** (must be **POST**, not a browser GET with query params):

```http
POST /oauth/token
Content-Type: application/json

{
  "grant_type": "authorization_code",
  "code": "oac_…",
  "redirect_uri": "…",
  "client_id": "app_…",
  "code_verifier": "…"
}
```

For manual testing with plain PKCE, use `code_challenge_method=plain` and set `code_challenge` and `code_verifier` to the same string.

**Refresh:**

```http
POST /oauth/token
Content-Type: application/json

{
  "grant_type": "refresh_token",
  "refresh_token": "ort_…",
  "client_id": "app_…"
}
```

**Use the access token** on any channel ECI in the mesh:

```http
GET /sky/query/<eci>/io.picolabs.wrangler/name
Authorization: Bearer oat_…
```

### Token prefixes

| Prefix | Meaning |
|--------|---------|
| `oac_` | Authorization code (single-use, ~10 min) — exchange at `/oauth/token`, not a Bearer token |
| `oat_` | Access token — use on **`/sky/*`** |
| `ort_` | Refresh token — use at `/oauth/token` only |

### OAuth HTTP endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/oauth/token` | Public | Client credentials, authorization code, refresh token |
| `GET` | `/oauth/token` | Public | Dev-friendly alias (query params); prefer POST |
| `GET` | `/oauth/authorize` | Passkey session | Authorization code + PKCE; consent page |
| `POST` | `/oauth/approve` | Passkey session | Consent form handler |
| `GET/POST/DELETE` | `/oauth/apps` | Passkey session | Register/list/revoke OAuth apps |
| `GET/POST/DELETE` | `/oauth/channels/:eci/*` | Passkey session | Webhook credential management |

### Building the UI

The root `npm run build` compiles the engine only. To pick up UI changes (Settings, Channels OAuth panels, etc.):

```sh
cd packages/pico-engine-ui && npm run build
```

That copies the bundle into `packages/pico-engine/public/`. Restart the engine and hard-refresh the browser.

For UI development, run the engine and `npm run dev` in `packages/pico-engine-ui` in separate terminals.

### OAuth tests

```sh
cd packages/pico-engine
npm run test:oauth    # webhook Client Credentials
npm run test:acg      # authorization code + refresh
npm run test:http     # /c/* vs /sky/* surface + mesh lock
npm run test:auth     # passkeys
```

Tests use isolated temp homes and ephemeral ports; they do not require stopping a running engine.

## Layer 2 identity and relationships (1.6)

Every pico has a portable **did:webvh** identity. **DID-based relationships** (Layer 2) use **`layer2: true`** and a **`target_did`** (did:webvh) instead of the legacy **`wellKnown_Tx`** ECI handshake. After intro, remote traffic uses **did:peer** DIDs and SKY over **DIDComm** when picos are on different meshes or engines. Prefer **`wrangler:relationship`** and **`use module io.picolabs.subscription alias relationship`** in new rulesets; legacy *subscription* event names remain supported.

- **Same engine:** intra-mesh queries/events stay local when roots share a mesh.
- **Cross-engine:** set a peer-reachable **`PICO_ENGINE_BASE_URL`** on each engine (for local demos, two processes on `localhost:3001` and `:3002` — see below).
- **Developer UI:** **Relationships** tab (DID-based create, inbound approval, established relationships with `Tx_did` / `Rx_did`). A pico cannot target itself (`target_did` / `wellKnown_Tx` checks).
- **Legacy ECI relationships** are unchanged.

**Deprecated:** `io.picolabs.did-o` and `dido:prepareQuery` — use **`wrangler:picoQuery`** and **`event:send({ did: … })`**.

Full guide: [docs/guides/layer2-subscriptions.md](../../docs/guides/layer2-subscriptions.md) · Release notes: [docs/release/1.6.md](../../docs/release/1.6.md) · [CHANGELOG.md](../../CHANGELOG.md) (1.6.2 relationships rename, 1.6.3 fixes)

**Dependency:** pico-engine 1.6 requires **pico-framework `^0.8.1`** (npm). When developing engine + framework together, use `npm run link-framework` from the repo root.

### Layer 2 tests

```sh
cd packages/pico-engine
npm run test:epic9          # release regression matrix
npm run test:cross-engine   # two engines, intro + query + event
npm run test:layer2-wrangler
npm run test:layer2-policy
```

### Cross-engine demo (two processes on one machine)

Use separate data directories and ports so each engine is an independent mesh. `PICO_ENGINE_BASE_URL` defaults to `http://localhost:$PORT`, which works for passkeys and for peer DID fetch (same as `npm run test:cross-engine`).

```sh
# terminal 1
PICO_ENGINE_HOME=/tmp/pico-engine-a PORT=3001 npm start

# terminal 2 (from repo root)
PICO_ENGINE_HOME=/tmp/pico-engine-b PORT=3002 npm start
```

Open http://localhost:3001 and http://localhost:3002 — register on both, then form a Layer 2 relationship A→B. See [docs/guides/layer2-subscriptions.md](../../docs/guides/layer2-subscriptions.md). Test/demo homes live under **`/tmp`** (not `~/.pico-engine`).

## Contributing

See the repository [root readme](https://github.com/Picolab/pico-engine#readme)

## Changelog

To view details about versions: [CHANGELOG.md](https://github.com/Picolab/pico-engine/blob/master/CHANGELOG.md)

## License

MIT
