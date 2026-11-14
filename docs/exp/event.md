# Event API (Sky)

Raise an event on a pico over HTTP. The channel in the URL identifies the pico; its event policy has to allow the domain and type. Rules that select on that event run, and their directives come back in the response.

Sky is the current [Event Exchange Protocol](/exp/) version; the path prefix is `/sky/event/…`.

## URL

```
/sky/event/<eci>/<eid>/<domain>/<type>
```

| Part | Meaning |
|------|---------|
| `<eci>` | A channel on the pico. Make channels on the **Channels** tab, or have a ruleset create one when it is installed (see [Bootstrap and channels](/cookbook/bootstrap/)). |
| `<eid>` | An event id of your choosing, for your own tracing. Anything URL-safe works; `none` is common. When it isn't `none`, the engine also puts it in the event attributes as `__eid`. |
| `<domain>` | The event's domain (namespace). |
| `<type>` | The event's type (also called its name). |

The scheme is `http` or `https`. GET or POST both work; **POST is preferred**.

```
/sky/event/<eci>/none/echo/message
```

## Attributes

Attributes further define the event. Send them:

- in the **query string** (GET or POST), or
- in a **POST body**, as `application/x-www-form-urlencoded` or `application/json`

When the same name appears in both, the body wins. A JSON body is an object of names to values:

```json
{
  "temperature": 67,
  "node_id": "2392029d003a:1"
}
```

```sh
curl "http://localhost:3000/sky/event/<eci>/none/echo/message?input=hello"

curl -X POST "http://localhost:3000/sky/event/<eci>/none/echo/message" \
  -H 'content-type: application/json' -d '{"input": "hello"}'
```

Every event raised over HTTP also gets an attribute `_headers` with the request's HTTP headers. See [Cookies and redirects](/patterns_and_tips/cookies-and-redirects).

## Response

The engine answers with JSON:

```json
{
  "eid": "…",
  "directives": [
    {
      "type": "directive",
      "name": "say",
      "options": { "something": "hello" },
      "meta": { "rid": "com.example.echo", "rule_name": "echo", "txnId": "…" }
    }
  ],
  "ruleOutcomes": [
    { "rid": "com.example.echo", "rule": "echo", "status": "fired" }
  ],
  "events": [
    { "domain": "…", "name": "…", "attrs": { } }
  ]
}
```

| Field | Meaning |
|-------|---------|
| `eid` | The transaction id the engine assigned this event |
| `directives` | Directives from rules that ran (`send_directive`, and the special `_cookie` / `_redirect` names) |
| `ruleOutcomes` | Which rules fired, did not fire, or were not selected (when the engine records them) |
| `events` | Events raised during the same transaction (not the ingress event). Omitted when there were none |

A channel that doesn't allow the event answers with HTTP 200 and `{"error":"Error: Not allowed by channel policy"}`. On a mesh with [OAuth](/wrangler/oauth) turned on, a missing or bad bearer token is refused before the channel policy runs.

### Special directives

Two directive names change the HTTP response itself, instead of only appearing in the JSON:

| Directive | Effect |
|-----------|--------|
| `_cookie` | Adds a `Set-Cookie` header from `options.cookie` |
| `_redirect` | Answers with HTTP 302 and `Location: options.url` |

Details and examples: [Cookies and redirects](/patterns_and_tips/cookies-and-redirects).

## From KRL

To raise an event on another pico (or this one), use `event:send` with an ECI, or `wrangler:picoQuery` / relationships for higher-level patterns. See the [event library](/krl/libraries/event) and [Wrangler](/wrangler/).

## See also

- [Event Exchange Protocol](/exp/) — overview
- [Query API](/exp/query) — call a shared function
- [Echo](/cookbook/echo/) — a demo that raises events and shows directives
- [OpenAPI](/openapi.yaml) — machine-readable routes

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189909/Sky+Event+API) (last edited there 2022-02-24), and updated for this engine.</small>
