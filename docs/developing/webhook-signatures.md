# Webhook signatures

A webhook such as Square's is an HTTP event. The sender signs the exact bytes of the body. The parsed attributes are not those bytes: a space or the order of keys would change the signature. The channel has to keep the raw body, and the comparison has to take the same time whether or not it matches.

## Keep the raw body

On the Channels tab, check **Keep the raw request body**. From KRL, pass `rawBody: true` when the channel is created:

```krl
raise wrangler event "new_channel_request" attributes {
  "tags": ["square", "webhook"],
  "eventPolicy": { "allow": [{ "domain": "square", "name": "webhook" }], "deny": [] },
  "queryPolicy": { "allow": [], "deny": [] },
  "rawBody": true
}
```

`event:raw_body()` then returns the body as a string. On a channel without that setting it returns `null`, and so does `event:send` or a scheduled event. The body is not an attribute. Storing `event:attrs` does not store it. A rule that raises another event in the same transaction can still read it.

## The signing key

Keep the key in the ruleset's own PDS settings and mark it secret. `settings` then returns `{ "secret": true, "set": true }`. The ruleset reads the key with `pds:config_value("signatureKey")`. See [PDS settings](/wrangler/pds).

## Square

Square's `x-square-hmacsha256-signature` header is the base64 HMAC-SHA256 of the notification URL concatenated with the raw body, using the webhook signature key. The URL is the one configured in Square, exactly, not whatever host the request happened to arrive on. Header names on the event are lowercase.

```krl
ruleset com.example.square_webhook {
  meta {
    use module io.picolabs.pds alias pds
    shares verdict
  }
  global {
    notification_url = "https://example.com/sky/event/<eci>/none/square/webhook"
    verdict = function() { ent:verdict || "none" }
  }
  rule verify {
    select when square webhook
    pre {
      key = pds:config_value("signatureKey")
      body = event:raw_body()
      given = event:attr("_headers"){"x-square-hmacsha256-signature"}.defaultsTo("")
      ready = body.typeof() == "String" && key.typeof() == "String"
      expected = ready => math:hmac("sha256", key, notification_url + body, "base64") | ""
      ok = ready && math:timing_safe_equal(expected, given)
    }
    noop()
    fired {
      ent:verdict := ok => "accepted" | "rejected"
    }
  }
}
```

`math:timing_safe_equal` compares the two strings without stopping at the first different byte. Use it instead of `==` for the signature. `math:hmac` is described in the [math library](/krl/libraries/math).
