# Accepting relationship requests

When another pico asks for a relationship, the request waits on the receiving pico (its **Relationships** tab lists it) until something approves it. Here are three ways to approve requests automatically. The examples share one setup: a list pico asks participant picos to join it, in the role `participant list` for itself and `participant` for them.

## A rule that approves

On each participant:

```krl
rule accept_list {
  select when wrangler inbound_pending_subscription_added
    where event:attr("Rx_role") == "participant"
       && event:attr("Tx_role") == "participant list"
  always {
    raise wrangler event "pending_subscription_approval" attributes event:attrs
  }
}
```

Passing the event's attributes along tells wrangler which request to approve. Roles arrive from the receiving pico's point of view: `Rx_role` is this pico's, and `Tx_role` is the other pico's.

Don't approve every request. A rule without a `where` accepts a relationship with any pico that has your well-known channel. Accept only what you expect: the right roles, a request from your parent, a request that carries a shared secret. To refuse, raise `wrangler:inbound_rejection` with the same attributes. The [Collection](/cookbook/collection/) demo does both, and remembers whom it turned away.

## Wrangler's auto-accept configuration

Without writing a rule, give the participant a pattern to accept:

```krl
raise wrangler event "autoAcceptConfigUpdate" attributes {
  "config": {"configName": "lists", "entries": {"Tx_role": ["^participant list$"]}}
}
```

Each entry maps an attribute of the request, as the participant sees it, to a list of regular expressions. A request that matches any of them is approved. Send the same event with `"delete": true` and the `configName` to remove it. `autoAcceptConfig()`, shared by `io.picolabs.subscription`, shows what is set. You can also send this event from the pico's **Testing** tab.

## Accept later, by installing a ruleset

If a request arrived before there was anything to approve it, install a ruleset that approves it and then removes itself:

```krl
ruleset acceptance {
  meta {
    use module io.picolabs.subscription alias subs
  }
  rule initialize {
    select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
    pre {
      s = subs:inbound("Tx_role", "participant list")
        .filter(function(i) { i{"Rx_role"} == "participant" })
        .head()
    }
    if s then noop()
    fired {
      raise wrangler event "pending_subscription_approval" attributes s
    }
    finally {
      raise wrangler event "uninstall_ruleset_request" attributes {"rid": meta:rid}
    }
  }
}
```

It looks for a pending request from a participant list, approves it, and uninstalls itself either way. This is handy when a parent asked many children to join before they could accept: install it on each child.

*From the Pico Labs KRL Cookbook pages "Automatic Replies to Subscription Requests" and "Accepting a subscription offer by installing a ruleset".*
