# Collection: instructions

These steps use the developer UI of a running engine at `http://localhost:3000`. Replace that with your engine's URL. See the [overview](/cookbook/collection/) for what the demo shows.

## The quick way: Try It!

On the root pico in the developer UI, open the **Try It!** tab, click **Collection**, then **Run in a new child pico**. The bootstrap creates six children: Rooms (the collection), and Kitchen, Office, Garage, Bedroom, and Stranger. The stage counts rooms as they join. When it shows **ready**, open **Rooms**: four rooms averaging 69.5 F, and Stranger under **Turned away**.

To see what the demo built, leave the **Try It!** tab and close the pico, so the developer UI shows the pico tree. The new child has six children of its own: Rooms, the four rooms, and Stranger. Click into each one and open its **Relationships** tab. Rooms has a relationship with each of the four rooms, with Rooms in the role `collection` and each room in the role `member`. Each room has the same relationship, seen from its side. Stranger has none.

Then see if you can work out from the code why Stranger was turned away. Start with the `accept_member` rule in `com.example.collection.krl`, then look at how the bootstrap set Stranger up.

<details>
<summary>Why Stranger was turned away</summary>

The bootstrap gives Stranger `"as": "visitor"`. Stranger's `join` rule puts that in its request as its own role, `"Rx_role": "visitor"`. At Rooms, the request arrives from Rooms' point of view, with Stranger's role as `Tx_role`. `accept_member` accepts only `Rx_role` `collection` and `Tx_role` `member`, so it raises `wrangler:inbound_rejection`. Wrangler removes the pending request on Rooms and tells Stranger, which removes it too. That's why Stranger's **Relationships** tab is empty.

</details>

## By hand

1. Create a pico for the collection. On its **Rulesets** tab, install, in this order:
   - `http://localhost:3000/krl/io.picolabs.xmlui.krl`
   - `http://localhost:3000/krl/demos/collection/com.example.collection.krl`
   - `http://localhost:3000/krl/demos/collection/com.example.collection.report.krl` (it uses the collection ruleset as a module, so install it second)
2. On its **Channels** tab, copy the id of the channel tagged `wellknown_rx, tx_rx`.
3. Create a pico for each room and install `http://localhost:3000/krl/demos/collection/com.example.collection.room.krl` on it.
4. On each room's **Testing** tab, raise `room` `new_temperature` with a `temperature`, then `collection` `join_requested` with `wellKnown_Tx` set to the id from step 2.
5. To see a request turned away, raise `join_requested` on one room with `as` set to `visitor` as well.
6. Open the report on the collection's `collection, app` channel (**View** next to `com.example.collection.report`).

## Try it

- Click **Remove** next to a room. The collection cancels that relationship, and the room leaves the table and the average.
- Open Office in the developer UI. On its **Testing** tab, raise `collection` `leave_requested`. Office leaves the table. The member ended the relationship this time.
- Still on Office, raise `room` `new_temperature` with `temperature` set to `80`, then `collection` `rejoin_requested`. Office is back, at 80 F.
- Look at the **Relationships** tab on Rooms and on a room. Each side has its own channel, and the roles say who is who.

## How it works

**Members are relationships.** The collection ruleset doesn't keep a list. Its members are its relationships in which the other pico is a member:

```krl
members = function() {
  subscription:established("Tx_role", "member")
}
```

It `provides members`, so another ruleset on the pico can `use module com.example.collection` and call `collection:members()`.

**Joining.** A room asks through the collection's well-known channel, naming both roles: `Rx_role` `member` for itself, `Tx_role` `collection` for the other side. The request arrives at the collection with the roles from its point of view. `accept_member` accepts it only in the right roles, and otherwise rejects it and remembers who asked:

```krl
rule accept_member {
  select when wrangler inbound_pending_subscription_added
  pre {
    acceptable = event:attr("Rx_role") == "collection" && event:attr("Tx_role") == "member"
  }
  if acceptable then noop()
  fired {
    raise wrangler event "pending_subscription_approval" attributes event:attrs
  }
  else {
    ent:rejections := rejections().append({"name": event:attr("name"), "role": event:attr("Tx_role"), "time": time:now()})
    raise wrangler event "inbound_rejection" attributes event:attrs
    raise collection event "member_rejected" attributes event:attrs
  }
}
```

A role is what the requesting pico says it is. Stranger could ask again as a member and be accepted. Roles sort relationships; they don't prove anything. A collection that must be choosy checks something it trusts as well, such as who introduced the pico, as the bootstrap does by sending each room the well-known channel.

**Leaving.** Either side can end a relationship with `wrangler:subscription_cancellation` and its `Id`. Both picos remove it, and both raise `wrangler:subscription_removed`. The collection turns that, and `subscription_added`, into its own `collection:member_removed` and `collection:member_added` events, for any ruleset that cares. `remove_member` only cancels relationships that are memberships, so the page's channel can't end any other relationship the pico has.

**Reporting.** The report asks each member for its `reading` over its relationship:

```krl
readingOf = function(bus) {
  reading = subscription:queryOnSub(bus{"Id"}, room_rid, "reading")
  row = {"Id": bus{"Id"}, "name": reading{"name"}, "temperature": reading{"temperature"}}
  row
}
```

**The bootstrap.** It creates Rooms first. When Rooms is initialized, it sends Rooms its three install requests, then creates the room picos. For each room, it sends the room ruleset install request, then `collection:join_requested`. A pico handles events one at a time, in the order they arrive, so each ruleset is installed before the event that needs it. Because the requests to Rooms were sent before any room existed, the collection is ready before the first request to join arrives.

## Change it and watch

The **Try It!** window lists each file with its path on disk. Edit a file there, click **Flush**, and use the page.

- Report the warmest room too: in `com.example.collection.report.krl`, add the room with the highest temperature to the map `report()` returns, and show it in the subtitle.
- Accept visitors as well: in `com.example.collection.krl`, let `accept_member` also accept `Tx_role` `visitor`, and add a `visitors()` function like `members()`. Then on Stranger's **Testing** tab, raise `collection` `join_requested` with `wellKnown_Tx` (Rooms' well-known channel id) and `as` set to `visitor`. Stranger is accepted, and it is not counted in the report, which only asks members.
- Have the collection react to new members: add a rule that selects `collection:member_added` and records when each member joined.
