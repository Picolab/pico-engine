# Event and Query URLs with Postman

[Postman](https://www.postman.com/) is a desktop tool for building and sending HTTP requests and examining the responses. It's handy for trying events and queries on a pico: you can save requests, change attributes quickly, and keep them in a collection.

Everything here is plain HTTP, so `curl` works equally well. Each Postman step has a `curl` equivalent. For the full API, see the [Event API](/exp/event) and [Query API](/exp/query). For a gentler introduction, see [Events and Queries](/lessons/events-and-queries).

The examples use `http://localhost:3000`, the engine's default address. Use your own host and port if you've changed them.

## Before you start: pick a channel

Both events and queries are sent to a pico through one of its **channels**, and a channel is named by its ECI (event channel identifier). The channel's *policy* decides which events and queries it allows.

1. Open the developer UI, click the pico, and open its **Channels** tab.
2. Choose a channel whose policies allow what you want to send. The pico's own `self` channel (its ECI is the pico's id) allows everything, which is fine for experiments. For anything you'll leave around, make a channel that allows only what's needed. See [Managing channels](/wrangler/channels).
3. Copy the ECI.

If a request is refused, you'll get HTTP 200 and `{"error":"Error: Not allowed by channel policy"}`. Use a channel with a more permissive policy.

If the mesh has [OAuth](/wrangler/oauth) turned on, requests also need an `Authorization: Bearer <token>` header, which in Postman is the **Authorization** tab.

## Raising an event

The event URL looks like this:

```
http://localhost:3000/sky/event/<eci>/<eid>/<domain>/<type>
```

- `<eci>`: the channel
- `<eid>`: an event id you choose, for your own tracing (`none` is common)
- `<domain>` and `<type>`: the event's domain and type, which rules select on

This example asks wrangler to create a child pico: the domain is `wrangler` and the type is `new_child_request`.

> **Older docs and rulesets** call this event `child_creation`. The current wrangler event is `wrangler:new_child_request`. Likewise, in URLs `/sky/query/` replaces `/sky/cloud/`.

### In Postman

1. Create a new request tab.
2. Set the method to **POST**. (GET works for events, but POST is preferred because an event may change the pico.)
3. Enter the URL, with your ECI:

   ```
   http://localhost:3000/sky/event/<eci>/child_test/wrangler/new_child_request
   ```

4. Open the **Body** tab, choose **raw**, and set the type to **JSON**. Put the event's attributes in the body as a JSON object:

   ```json
   {
     "name": "test child",
     "backgroundColor": "#87cefa"
   }
   ```

5. Click **Send**.

A JSON body is the best way to send attributes: it keeps numbers, booleans, and nested maps as they are, and avoids URL-encoding. You can also send attributes as a query string (`?name=test%20child`) or as `application/x-www-form-urlencoded`. When a name appears in both body and query string, the body wins.

### The response

The response is JSON. It carries the transaction id, any directives from rules that ran, which rules fired, and the events raised during the cycle:

```json
{
  "eid": "…",
  "directives": [ … ],
  "ruleOutcomes": [ { "rid": "io.picolabs.wrangler", "rule": "createChild", "status": "fired" } ],
  "events": [ { "domain": "wrangler", "name": "new_child_created", "attrs": { … } } ]
}
```

For a wrangler event like this one there may be no directive: the `events` list and the new child in the developer UI are your confirmation. A rule that calls `send_directive` shows up under `directives`. The [Event API](/exp/event#response) page describes every field.

### With curl

```sh
curl -X POST "http://localhost:3000/sky/event/<eci>/child_test/wrangler/new_child_request" \
  -H 'content-type: application/json' \
  -d '{"name": "test child", "backgroundColor": "#87cefa"}'
```

## Querying a pico

A query calls a function that a ruleset lists in its `shares`, and returns the function's value. It can't change the pico. The URL looks like this:

```
http://localhost:3000/sky/query/<eci>/<rid>/<function>?<arguments>
```

- `<rid>`: the ruleset id that shares the function
- `<function>`: the function's name
- arguments: the function's parameters, by name (order doesn't matter)

### In Postman

1. Create a new request tab and set the method to **GET**.
2. Choose the pico, the ruleset, and a function that ruleset shares. The pico's **Testing** tab lists the queries a ruleset shares, and the **Channels** tab has the ECI. This example uses wrangler's `children` query:

   ```
   http://localhost:3000/sky/query/<eci>/io.picolabs.wrangler/children
   ```

3. For a function with parameters, add them on the **Params** tab (Postman builds the query string), such as `name = Ada` for `…/io.picolabs.hello_world/hello?name=Ada`. The names must match the function's parameter names.
4. Click **Send**. The body is the function's return value, as JSON.

If the function isn't in the ruleset's `shares` list, or the ruleset isn't installed in that pico, the response has an `error` field instead of a value. A GET is the natural method, though POST with a form-encoded or JSON body also works and is useful for long arguments.

### With curl

```sh
curl "http://localhost:3000/sky/query/<eci>/io.picolabs.wrangler/children"
curl "http://localhost:3000/sky/query/<eci>/io.picolabs.hello_world/hello?name=Ada"
```

## Tips

- Use Postman **variables** (such as `{{eci}}` and `{{base}}`) for the base URL and ECI, so a saved request works on another pico or engine by changing one value.
- Add `.txt` or `.html` to a function name (`…/page.html`) to get the function's string result as plain text or a web page. See the [Query API](/exp/query#text-and-html).
- If a rule doesn't seem to run, open the pico's **Logging** tab and look at the transaction your request created.
- To exercise a whole system, not one pico, the [Programming lessons](/lessons/) and the [EXP](/exp/) pages show how events and queries fit together.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1177157666) (last edited there 2020-06-26), and updated for this engine.</small>
