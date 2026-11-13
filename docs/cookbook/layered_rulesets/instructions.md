# Layered rulesets: instructions

These steps use the developer UI of a running engine at `http://localhost:3000`. Replace that with your engine's URL. See the [overview](/cookbook/layered_rulesets/) for what the demo shows.

## The quick way: Try It!

On the root pico in the developer UI, open the **Try It!** tab, click **Layered rulesets**, then **Run in a new child pico**. The bootstrap installs only the base ruleset. When it shows **ready**, open **Invitations**. The page walks you through three steps, adding one layer at a time.

## Try it

The **The pico answered** card lists the name of every directive in the reply, from every rule that ran, in order. At each step, click **Try the full invitation** and **Try the short link**, compare the answers with what the step card says to expect, then click **Add the next layer**.

| Step | Installed | Full invitation | Short link |
|------|-----------|-----------------|------------|
| 1 | The base ruleset | `connected` | `nothing`: no rule selects it |
| 2 | + `com.example.invitations.short_links` | `connected` | `expanded, connected` |
| 3 | + `com.example.invitations.welcome` | `connected, welcome` | `expanded, connected, welcome` |

The base ruleset is the same file at every step. Then:

- Paste `https://short.example/nobody` and click **Accept**. The answer is `nothing`: the short links add-on selected it but has no such link, and the base never saw a full invitation.
- On the **Rulesets** tab, uninstall `com.example.invitations.short_links`. The page goes back a step: the **Layer** table shows it is gone, short links get `nothing` again, and full invitations still get `connected, welcome`. **Add the next layer** puts it back.

**Add the next layer** raises `layers:next_layer_requested`, and a rule in the base ruleset installs the next add-on from the same folder. That rule is scaffolding for the demo, and it installs only the two add-ons the base ruleset lists. On a real pico, the operator installs rulesets, and a page can't.

## By hand

1. Create a child pico and open its **Rulesets** tab.
2. Install `io.picolabs.xmlui` from the engine: `http://localhost:3000/krl/io.picolabs.xmlui.krl`.
3. Install the base: `http://localhost:3000/krl/demos/layered_rulesets/com.example.invitations.krl`. It creates a channel tagged `invitations, app`. Open the page on it (**View** next to `com.example.invitations`).
4. Follow the steps above. To add a layer yourself instead of with the button, install `.../layered_rulesets/com.example.invitations.short_links.krl`, then `.../layered_rulesets/com.example.invitations.welcome.krl`, on the **Rulesets** tab.

## How it works

**The base rule** selects `invite:new_invitation` only when the `url` attribute is a full invitation, and captures the `c_i` code:

```krl
rule accept_invitation {
  select when invite new_invitation
    url re#^(https?://[^?]+[?](?:.*&)?c_i=([A-Za-z0-9+/_=-]+).*)$#
    setting(url, code)
  pre {
    label = labelOf(code)
  }
  send_directive("connected", {"label": label})
  fired {
    ent:connections := connections().append({"label": label, "url": url, "time": time:now()})
    raise invite event "connection_made" attributes {"label": label, "url": url}
  }
}
```

It raises `invite:connection_made` after recording the connection. Nothing in the base listens for that event. It is there for other rulesets.

**The short links add-on** selects the same event with a pattern only short links match. It doesn't touch the base. It expands the link and raises the event again, with the full invitation as the `url`:

```krl
rule expand_short_link {
  select when invite new_invitation
    url re#^https://short[.]example/(\w+)$#
    setting(code)
  pre {
    full = links{code}
  }
  if full then send_directive("expanded", {"from": event:attr("url"), "to": full})
  fired {
    raise invite event "new_invitation" attributes event:attrs.put("url", full)
  }
  else {
    raise invite event "unknown_short_link" attributes event:attrs
  }
}
```

The second time around, the base's pattern matches and the add-on's doesn't. A real short link service would be expanded with `http:get` and its redirect. This one uses a table so the demo works offline.

**The welcome add-on** selects `invite:connection_made`. It runs after every connection, however it was made.

A raised event is handled in the same transaction, after the rules for the current event finish. So the reply to a short link has the directives of all three rulesets, in the order the rules ran.

## Change it and watch

The **Try It!** window lists each file with its path on disk. Edit a file there, click **Flush**, and use the page again.

- Add a short link: put `"ada": "https://agents.example/invite?c_i=eyJsYWJlbCI6IkFkYSBMb3ZlbGFjZSJ9"` in the `links` table in `com.example.invitations.short_links.krl`, then accept `https://short.example/ada`.
- Change the welcome message in `com.example.invitations.welcome.krl`.
- Write a third add-on that selects `invite:unknown_short_link` (the short links add-on raises it whether or not anything listens) and records the links nobody could expand. Install it from a `file://` URL.
