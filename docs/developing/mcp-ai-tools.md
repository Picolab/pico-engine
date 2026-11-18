# AI tools over MCP

An MCP client such as Claude can call a pico the same way it calls any remote MCP server: add a URL and run an OAuth flow. A person signs in with a passkey and approves that client. The client receives a token and then uses the tools. The engine also has a separate local MCP server for coding agents on the same machine. That one is `pico-engine mcp --stdio` and does not use this flow. This page is the remote connection.

## Which URL

| You want | URL | Tools |
|----------|-----|--------|
| One channel | `https://<engine>/mcp/<eci>` | That channel's events and queries, one tool each |
| The mesh under a channel | `https://<engine>/mcp/mesh/<eci>` | `pico_tree`, `pico_channels`, `query`, `raise_event` |

No trailing slash. An ECI is a channel id from the Channels tab.

`mesh:read` covers schemas, lists, and queries. `mesh:act` covers events. `mesh:admin` is reserved and unlocks nothing. A sign-in that does not name a narrower scope receives both `mesh:read` and `mesh:act`.

A channel is not exposed until you allow it. On the Channels tab, check the channel surface for `/mcp/<eci>`, or the mesh surface for a channel that should appear in `/mcp/mesh/…`. The channel you name in the mesh URL does not itself need the mesh checkbox. A missing or empty policy denies both surfaces. A pico ceiling from an older engine does not block this. A ceiling that has its own `mcpPolicy` does.

On a channel endpoint, that channel's event and query policies decide which calls succeed. The tools are the events and queries those policies allow. A mesh endpoint is not bound to the policies of the channel in the URL. `pico_tree` and `pico_channels` list the subtree. `query` and `raise_event` name some other channel, and that channel's event and query policies are what allow or refuse the call. `pico_channels` includes a channel only when its MCP policy allows the mesh surface.

## The root has to allow OAuth

Install `io.picolabs.oauth` on the **root** pico before anyone signs in. The Engine KRL Directory lists it only on the root. On the Rulesets tab the URL is `https://<engine>/krl/io.picolabs.oauth.krl`.

That ruleset is the switch for issuing sign-in tokens. A connector for one channel and a connector for the whole mesh both require it. The channel URL still limits the token to that channel. Installing the ruleset also makes external `/sky/*` calls on the mesh require a bearer token. Channels tagged `mesh-oauth-exempt`, or `didcomm` and `ingress`, stay open. See [OAuth](/wrangler/oauth).

A channel tagged `oauth-webhook` can obtain a client-credentials token for its own MCP URL without this ruleset. That is a machine credential, not the authorization-code flow below, where a person signs in with a passkey and approves the client.

## Claude cannot use localhost

Claude connects from Anthropic's network, including from Claude Desktop. The connector URL must be HTTPS on port 443. `http://localhost:3000` and a URL with another port are refused.

Keep the engine on port 3000 and put a tunnel in front of it. A Cloudflare quick tunnel does not need an account:

```sh
brew install cloudflared
cloudflared tunnel --url http://localhost:3000
```

The public URL is in the box near the top of the output, `https://….trycloudflare.com`. A line about a missing `config.yml` is normal. Leave that process running. The hostname changes if you stop it and start it again. Anyone with the URL can reach the engine, so stop the tunnel when you are done.

Quick tunnels do not carry server-sent events. If sign-in succeeds and the tools then fail to stay connected, use `ngrok http 3000` instead. A named Cloudflare tunnel, with a hostname you choose, needs a free Cloudflare account and a domain on Cloudflare.

## Set the host before you create the account

A passkey works only for the host it was created on. A passkey for `localhost` will not sign in on the tunnel host, and a passkey for one quick-tunnel hostname will not sign in on the next one. Channels do not store the host. The account that owns them does. Create the passkey, then the channel, on the host Claude will use.

1. Start the tunnel and copy the hostname.
2. Point the engine at that host and restart it. In the config file (`~/.config/pico-engine/config.json`, or the file in `PICO_ENGINE_CONFIG`):

   ```json
   {
     "baseUrl": "https://example.trycloudflare.com",
     "allowSelfSignup": true,
     "webauthn": {
       "rpId": "example.trycloudflare.com",
       "origin": "https://example.trycloudflare.com",
       "rpName": "Pico Engine"
     }
   }
   ```

   `baseUrl` and `origin` have no trailing slash and no port. `rpId` is the hostname only. `allowSelfSignup` can go back to `false` after the account exists. The engine reads this file at startup.
3. Open the tunnel URL in a browser and register a passkey.
4. Install `io.picolabs.oauth` on that root.
5. Open the Channels tab, allow the channel MCP surface on the channel the agent should use, and copy its ECI.

The connector URL is then `https://example.trycloudflare.com/mcp/<eci>`.

## Add the connector in Claude

On a Pro or Max plan: **Customize** → **Connectors** → **+ Add** → **Add custom connector**.

On a Team or Enterprise plan an owner adds it under **Organization settings** → **Connectors** → **Add** → **Custom** → **Web**. Each person then connects it from **Customize** → **Connectors**.

- Name it whatever you like.
- Remote MCP server URL: the channel or mesh URL from above, exactly.
- Authentication: **Sign in now**.
- OAuth client: **Use Claude's published identity**. Leave the client id and secret empty.

**Register automatically** is dynamic client registration. This engine does not offer it. **Use your own OAuth client** is an `app_…` client you create on the engine first. The "Detected" label means Claude found an OAuth server, not that a client id is required.

If Claude says automatic client registration is not supported, or the connector page says the connection stopped working and never opens the passkey page, remove the connector and add it again with **Use Claude's published identity**. **Reconnect** repeats the registration attempt Claude already saved.

The client is in the OAuth flow. The page it opens is the tunnel host, not `localhost`. You sign in with the passkey, then approve the client. The approval screen names Claude, its host, the mesh, and the scopes. After that, turn the connector on from the **+** menu in a chat. Ask it to run a query (`mesh:read`) or raise an event (`mesh:act`).

A public client's access token lasts one hour. Each refresh returns a new refresh token. Sending the previous refresh token again revokes that grant.

## What another MCP client needs

A client that implements the MCP authorization spec can use the same URLs. A request with no bearer token gets `401` and a `WWW-Authenticate` header pointing at the protected-resource document.

| Document | URL |
|----------|-----|
| Protected resource, one channel | `/.well-known/oauth-protected-resource/mcp/<eci>` |
| Protected resource, mesh | `/.well-known/oauth-protected-resource/mcp/mesh/<eci>` |
| Authorization server | `/.well-known/oauth-authorization-server` |

The same authorization-server document is also served with the MCP path inserted, and at `/.well-known/openid-configuration`, because some clients look there first. PKCE is S256 only. A `client_id` that is an `https` URL is fetched as a Client ID Metadata Document. The token endpoint accepts a public client (`none`) and a confidential client that sends its secret in the body (`client_secret_post`). The token's `resource` is the MCP URL it was issued for. A token for one channel is rejected on another channel and on `/sky/*`.
