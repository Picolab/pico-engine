# Cookies and redirects

Two directive names are special. When a rule sends one in response to an event raised over HTTP, the engine turns it into part of the HTTP response.

## Set a cookie: `_cookie`

```krl
rule set_cookie {
  select when cookie needed
  pre {
    eci = wrangler:channels(["wellKnown_Rx", "Tx_Rx"]).head(){"id"} || meta:eci
  }
  send_directive("_cookie", {"cookie": <<wellKnown_Rx=#{eci}; Path=/sky>>})
}
```

The engine adds `Set-Cookie: wellKnown_Rx=<eci>; Path=/sky` to the response, and the browser sends the cookie back with later requests to the same engine. This one shares the pico's well-known channel, so other picos reached from the same browser could offer it a relationship. The ruleset uses `io.picolabs.wrangler` as a module.

## Read one cookie

`_headers` does not include the `Cookie` header. Read one cookie by name:

```krl
eci = http:cookie("wellKnown_Rx")
```

That is `"abc123"` when the browser sent `Cookie: wellKnown_Rx=abc123`. A cookie that was not sent is `null`. The engine's own session and ceremony cookies are not available to rulesets. `_cookie` and `_redirect` are unchanged: they still set the response.

## Redirect: `_redirect`

```krl
send_directive("_redirect", {"url": "https://picolabs.io/"})
```

The engine answers the event with HTTP 302 and that URL as the `Location`.

## A URL shortener

Together with a channel per link, `_redirect` makes a URL shortener. Each link gets its own channel, whose policy allows only the event that follows it. The channel id is the short URL:

```krl
ruleset s {
  meta {
    use module io.picolabs.wrangler alias wrangler
    provides u
  }
  global {
    u = function(eci) {
      <<#{meta:host}/sky/event/#{eci}/none/s/u>>
    }
  }
  rule recordShortcut {
    select when s u
      url re#(.+)# setting(url)
    pre {
      tag = event:attr("tag").lc().replace(re#[^a-z0-9_.-]#g, "-")
      eid = tag => tag | "none"
    }
    every {
      wrangler:createChannel(
        [eid, "s"],
        {"allow": [{"domain": "s", "name": "u"}], "deny": []},
        {"allow": [], "deny": [{"rid": "*", "name": "*"}]}
      ) setting(channel)
      send_directive("shortcut registered", {"tag": tag, "eci": channel{"id"}, "shortcut": u(channel{"id"}), "url": url})
    }
    fired {
      ent:shortcuts{channel{"id"}} := url
    }
  }
  rule redirectShortcut {
    select when s u
      where event:attr("url").isnull()
    send_directive("_redirect", {"url": ent:shortcuts{meta:eci}})
  }
}
```

Another ruleset uses it as a module. It registers a link with `raise s event "u" attributes {"url": long_url, "tag": "docs"}`, then finds the channel with `wrangler:channels(["docs", "s"]).head()` and the short form with `s:u(eci)`. Opening the short URL redirects to the long one. The short URL can only raise `s:u`, and queries on it are all denied. Short links are handy in QR codes, which get smaller as the URL does.

*From the Pico Labs KRL Cookbook pages "Setting and reading cookies" and "Ruleset that provides a general purpose URL shortener".*
