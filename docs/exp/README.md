# Event Exchange Protocol

Picos talk to the outside world over HTTP. The **Event Exchange Protocol** (EXP) is that HTTP surface: raise an event, or ask a query, on a specific [channel](/wrangler/channels). **Sky** is the current version of EXP — the path prefix is `/sky/…`. A later version would keep the same ideas under a new prefix; these pages describe the protocol, and name Sky where the current URLs matter.

## The event-query model

The pico API is **not RESTful**. A pico is not a collection of resources you manipulate with GET, POST, PUT, and DELETE. HTTP is only the transport. The shape of the API is closer to [Command Query Separation](https://martinfowler.com/bliki/CommandQuerySeparation.html): one path changes state, another only reads it. There are no "commands" as such — there are **events** — so we call it an **event-query** model.

| Kind | What it does | HTTP (Sky) |
|------|----------------|------------|
| **Event** | Something happened (or should happen). Rules may fire, change state, raise further events, and answer with directives. | [Event API](/exp/event) — `/sky/event/…` |
| **Query** | Ask a shared function for a value. No rule selection; the function runs and returns. Queries use a different code path from events and are usually cheaper. | [Query API](/exp/query) — `/sky/query/…` |

EXP is also a **meta-API**: it describes the *pattern* for talking to a pico, not a fixed list of operations. Each pico's concrete API is whatever its installed rulesets provide — which events their rules select on, and which functions they list in `shares` — and that can change over the pico's life as rulesets are installed or removed. Salience (from the rules' `select when` expressions) and the shared-function list are how you learn what a given pico will respond to; the developer UI's **Testing** tab and each pico's `discovery` channel surface that.

```
  application / webhook / view
        │                      │
        │ raise event          │ call shared function
        ▼                      ▼
   /sky/event/…           /sky/query/…
        │                      │
        └──────────┬───────────┘
                   ▼
                 pico
                   │
        ┌──────────┴───────────┐
        ▼                      ▼
  directives / outcomes   JSON return value
```

A better analogy than REST is a cloud-based persistent object: you send it messages (events) and ask it questions (queries), the same way you would talk to an object in an OO program. In return you get actors that scale by sharding, can live on different engines, and keep the user in control of their data.

Picos are not empty vessels for long. New children come with [Wrangler](/wrangler/) and the other platform rulesets already installed, so they already speak EXP. Application rulesets (and frameworks such as Manifold) add a more specific event-query surface and a data schema on top — a vehicle pico, a sensor pico, a community pico — which gives developers leverage without inventing a new HTTP style for each type.

## Channels and authorization

An EXP URL always includes an **ECI** (event channel identifier). That one token says which pico and which channel the request is for. The channel's [policy](/wrangler/channels) decides whether the event or query is allowed. On a mesh with [OAuth](/wrangler/oauth) turned on, most `/sky/*` requests also need a bearer token.

Both event and query accept GET and POST. POST with a JSON body is preferred when you have attributes or arguments.

The same operations exist for the developer UI on `/c/*` (passkey session). Integrators, webhooks, pico views, and Home Assistant use `/sky/*`. A machine-readable subset of the surface is in the [OpenAPI spec](/openapi.yaml).

## Try it

- The [Echo](/cookbook/echo/) demo raises events from a page and from `curl`, and shows the directives that come back.
- The [Querying JSON](/cookbook/json_query/) demo calls a shared function over `/sky/query`.
- On any pico's **Testing** tab, pick a ruleset and send a documented event or query on a channel you choose.

## See also

- [Persistent Compute Objects](/pico-overview) — where the event-query model sits in the pico picture
- [Managing channels](/wrangler/channels) — ECIs, tags, and policies
- [Cookies and redirects](/patterns_and_tips/cookies-and-redirects) — `_cookie` and `_redirect` directives on event responses
- [Pico views](/pico-views) — pages that call EXP from the browser
- [OAuth](/wrangler/oauth) — when `/sky/*` needs a bearer token

---

<small>Ported from the Pico Labs wiki pages [Event Exchange Protocol](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189914/Event+Exchange+Protocol) (2021-02-20) and [Event-Query API](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189953/Event-Query+API) (2021-02-03), and updated for this engine.</small>
