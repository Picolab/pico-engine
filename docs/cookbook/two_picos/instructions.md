# Two picos talking: instructions

These steps use the developer UI of a running engine at `http://localhost:3000`. Replace that with your engine's URL. See the [overview](/cookbook/two_picos/) for what the demo shows.

## The quick way: Try It!

On the root pico in the developer UI, open the **Try It!** tab, click **Two picos talking**, then **Run in a new child pico**. The bootstrap creates two children, Alice and Bob, and introduces them. When it shows **ready**, Bob has already asked his first question. Open **Bob's conversation** and **What Alice knows**.

## By hand

1. Create two child picos, Alice and Bob.
2. On each, install `io.picolabs.xmlui` from the engine: `http://localhost:3000/krl/io.picolabs.xmlui.krl`.
3. On Alice, install `http://localhost:3000/krl/demos/two_picos/com.example.two_picos.answerer.krl`.
4. On Bob, install `http://localhost:3000/krl/demos/two_picos/com.example.two_picos.asker.krl`.
5. Find Alice's well-known channel: on Alice's **Channels** tab, it is the channel tagged `wellknown_rx, tx_rx`. Copy its id.
6. On Bob's **Testing** tab, raise `two_picos` `introduce` with `wellKnown_Tx` set to that id.
7. Both picos' **Relationships** tabs now show the relationship, and Bob has asked about Alice's favorite color. Open Bob's page on his `two_picos, asker` channel and Alice's on her `two_picos, answerer` channel (**View** on the **Rulesets** tab).

## Try it

- On Bob's page, ask about `cat`, `hometown`, or `name`. Each answer comes from Alice's pico.
- Ask about something Alice doesn't know, such as `favorite food`. She says she doesn't know it yet.
- On Alice's page, teach her that fact, then ask Bob to ask again.
- Look at the **Relationships** tab on each pico. Bob's role is `asker`, Alice's is `answerer`, and each side has its own channel for the other.

## How it works

**Bob asks for a relationship.** Every pico has a well-known channel that accepts only relationship requests. Given Alice's, Bob asks for a relationship and names both roles:

```krl
raise wrangler event "subscription" attributes {
  "wellKnown_Tx": well_known,
  "name": "Bob and Alice",
  "Rx_role": "asker",
  "Tx_role": "answerer"
}
```

**Alice accepts.** The request arrives at Alice as `wrangler:inbound_pending_subscription_added`, with the roles swapped to her point of view: her `Rx_role` is `answerer`. She accepts only requests that cast her in that role:

```krl
rule accept_asker {
  select when wrangler inbound_pending_subscription_added
    where event:attr("Rx_role") == "answerer"
  always {
    raise wrangler event "pending_subscription_approval" attributes event:attrs
  }
}
```

**Bob hears back.** When Alice accepts, Bob's wrangler raises `wrangler:subscription_added`. Bob's `connected` rule checks that the other side is an answerer, tells the parent pico, and asks a first question.

**Bob queries Alice.** `ask` finds the relationship by role and calls Alice's shared `answer` function over it:

```krl
bus = subscription:established("Tx_role", "answerer").head()
reply = subscription:queryOnSub(bus{"Id"}, answerer_rid, "answer", {"question": question})
```

The query goes to the channel Alice made for Bob when she accepted. Bob uses that channel, not Alice's family channel or her app channel. Relationship channels allow every event and query, so what Bob can do to Alice is up to the rulesets she has installed.

**The bootstrap.** It creates Alice and Bob with `new_child_request` and installs their rulesets when `child_initialized` arrives. Each child sends `two_picos:child_ready` to the parent when its ruleset is installed. When both are ready, the parent queries Alice's well-known channel id (`wrangler:picoQuery(alice, "io.picolabs.subscription", "wellKnown_Rx")`) and sends Bob `two_picos:introduce`. That starts everything above.

## Change it and watch

The **Try It!** window lists each file with its path on disk. Edit a file there, click **Flush**, and use the pages again.

- In `com.example.two_picos.answerer.krl`, change how Alice answers. For example, make `answer` return `known.uc()`.
- Change `initial_facts`. The facts are set when the answerer is installed, so run the demo again to see new ones, or teach them on Alice's page.
- In `com.example.two_picos.asker.krl`, change the first question in `connected` from `favorite color` to another topic, and run the demo again.
- Let Bob teach Alice. Add a rule to `com.example.two_picos.asker.krl` that sends her an event over the relationship:

  ```krl
  rule teach {
    select when two_picos teach
    pre {
      bus = subscription:established("Tx_role", "answerer").head()
    }
    if bus then event:send({
      "eci": bus{"Tx"},
      "domain": "two_picos",
      "type": "fact_learned",
      "attrs": {"topic": event:attr("topic"), "value": event:attr("value")}
    })
  }
  ```

  Flush it, raise `two_picos` `teach` on Bob's **Testing** tab with a `topic` and `value`, and Alice's page shows the new fact.
