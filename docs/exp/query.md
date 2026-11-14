# Query API (Sky)

Call a shared function on a pico over HTTP and get its return value. The channel in the URL identifies the pico; its query policy has to allow that ruleset and function. Which functions exist is up to the ruleset: the query API is a meta-API that every ruleset extends by listing names in `shares`.

Use it together with the [Event API](/exp/event): events change a pico's state; queries read it. Sky is the current [Event Exchange Protocol](/exp/) version; the path prefix is `/sky/query/…`.

## URL

```
/sky/query/<eci>/<rid>/<function>?<arguments>
```

| Part | Meaning |
|------|---------|
| `<eci>` | A channel on the pico |
| `<rid>` | The ruleset id that shares the function. If that ruleset isn't installed on the pico, the response is a JSON object with an `error` field |
| `<function>` | The name of a function listed in that ruleset's `shares` |
| arguments | The function's parameters, by name. Order does not matter |

The scheme is `http` or `https`. GET or POST both work. Arguments go in the query string, or in a POST body as form-encoded or JSON (same rules as [event attributes](/exp/event): the body wins when a name appears in both).

```sh
curl "http://localhost:3000/sky/query/<eci>/com.example.echo/hello?name=Ada"

curl -X POST "http://localhost:3000/sky/query/<eci>/com.example.json_query/runQuery" \
  -H 'content-type: application/json' -d '{"path": "$.vehicles[*].name"}'
```

`/sky/cloud/...` is a legacy alias for the same handler. Prefer `/sky/query/`.

Every query also gets an argument `_headers` with the request's HTTP headers.

## Response

The body is the function's return value, as JSON (`Content-Type: application/json`). A channel that doesn't allow the query answers with HTTP 200 and `{"error":"Error: Not allowed by channel policy"}`. On a mesh with [OAuth](/wrangler/oauth) turned on, a missing or bad bearer token is refused first.

### Text and HTML

Add `.txt` or `.html` to the function name and the engine returns the string the function produced, with that content type:

```krl
page = function() {
  <<<h1>Hello from a pico</h1>
>>
}
```

`/sky/query/<eci>/<rid>/page.html` shows a heading in a browser. `/sky/query/<eci>/<rid>/page.txt` shows the markup as text. For whole interactive pages, use a [pico view](/pico-views) instead.

## Preparing a ruleset

List the functions you want callable in `shares`. Only functions can be shared; wrap a constant in a parameterless function if you need to return a fixed value:

```krl
ruleset com.example.thermostat {
  meta {
    name "Thermostat"
    shares mode, temperature
  }
  global {
    mode = function() {
      ent:mode.defaultsTo("off")
    }
    temperature = function(room) {
      ent:rooms{room}{"temp"}
    }
  }
}
```

Then:

```
GET /sky/query/<eci>/com.example.thermostat/temperature?room=bedroom
```

Parameter names in the URL (or JSON body) must match the function's parameter names. Good parameter names make a clearer HTTP API.

The channel's query policy must allow that rid and name. App channels created with `ui:create_app_channel` allow the shared functions you pass them; see [Pico views](/pico-views) and [Bootstrap and channels](/cookbook/bootstrap/).

## From KRL

To query another pico from a ruleset, use `wrangler:picoQuery` (works over family channels and relationships). Prefer that over building an `http:get` to `/sky/query/` yourself. See [Querying another pico](/patterns_and_tips/querying-another-pico) and [Wrangler](/wrangler/).

## See also

- [Event Exchange Protocol](/exp/) — overview
- [Event API](/exp/event) — raise an event
- [Querying JSON](/cookbook/json_query/) — a demo that calls a shared function from a page
- [OpenAPI](/openapi.yaml) — machine-readable routes

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1186084/Sky+Query+API) (last edited there 2025-07-11), and updated for this engine.</small>
