# Events and queries over HTTP

A pico's events and queries are plain HTTP, so anything that can make a request can talk to a pico: `curl`, a browser, a script, a webhook from another service.

## Raise an event

```
/sky/event/<eci>/<eid>/<domain>/<type>?<attributes>
```

- `<eci>` is a channel on the pico. Its event policy has to allow `<domain>:<type>`. Make channels on the pico's **Channels** tab, or have a ruleset create one when it is installed (see the [Bootstrap and channels](/cookbook/bootstrap/) demo).
- `<eid>` is an event id of your choosing, for your own tracing. Anything works; `none` is common.
- Attributes go in the query string, or in a POST body (form-encoded or JSON). When both have the same name, the body wins.

```sh
curl "http://localhost:3000/sky/event/<eci>/none/echo/message?input=hello"

curl -X POST "http://localhost:3000/sky/event/<eci>/none/echo/message" \
  -H 'content-type: application/json' -d '{"input": "hello"}'
```

The response is JSON with the `directives` the rules sent and `ruleOutcomes`, which say which rules fired. A channel that doesn't allow the event answers `{"error":"Error: Not allowed by channel policy"}`.

## Ask a query

```
/sky/cloud/<eci>/<rid>/<function>?<arguments>
```

The function has to be shared by the ruleset, and allowed by the channel's query policy. The answer is the function's value, as JSON.

## Get text or HTML instead of JSON

Add `.txt` or `.html` to the function name and the engine returns the string the function produced, with that content type:

```krl
page = function() {
  <<<h1>Hello from a pico</h1>
>>
}
```

`/sky/cloud/<eci>/<rid>/page.html` shows a heading in a browser. `/sky/cloud/<eci>/<rid>/page.txt` shows the markup as text. For whole pages, use a [pico view](/pico-views) instead.

## See the request

Every event raised over HTTP has an attribute `_headers` with the request's HTTP headers, and every query has an argument by the same name. See [Cookies and redirects](/patterns_and_tips/cookies-and-redirects) for one use.

## From the developer UI

On a pico's **Testing** tab, pick a ruleset and fill in the form for any documented event or query, then send it on the channel you choose. Documented means it has a doc comment: the Testing tab builds its forms from the ruleset's schema.

*From the Pico Labs KRL Cookbook pages "Raising Events" and "Content negotiation with HTTP".*
