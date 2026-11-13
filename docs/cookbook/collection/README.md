# Collection

A pico that keeps track of a group of other picos is a pattern you will use often: the rooms in a building, the vehicles in a fleet, the sensors in a field. The best practice is a **relationship** with each member, labeled with roles: the collection pico plays `collection`, and each member plays `member`. Because roles label each relationship, the collection pico can have other relationships too, and tell them apart.

Keep the collection ruleset small. Its only job is managing the collection: accept members, turn away requests in other roles, remove members, and provide the members to other rulesets. Other rulesets on the same pico use the members. Here, a report ruleset asks each room for its temperature over its relationship and averages them.

To run it, follow the [instructions](/cookbook/collection/instructions). For one-to-one relationships first, see [Two picos talking](/cookbook/two_picos/).

## The rulesets

| Ruleset | File | What it shows |
|---------|------|---------------|
| Collection | [`com.example.collection.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/collection/com.example.collection.krl) | Accepting relationship requests by role and rejecting the rest (`inbound_rejection`), removing a member, raising `collection:member_added` and `member_removed`, and `provides members` for other rulesets |
| Room | [`com.example.collection.room.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/collection/com.example.collection.room.krl) | A member that asks to join through the collection's well-known channel, and can leave (`subscription_cancellation`) and rejoin |
| Room report | [`com.example.collection.report.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/collection/com.example.collection.report.krl) | `use module com.example.collection`, querying every member with `subscription:queryOnSub`, and a Rooms `@view` with a **Remove** button per member |
| Bootstrap | [`com.example.collection.bootstrap.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/collection/com.example.collection.bootstrap.krl) | Creates a Rooms collection pico and five room picos. Four join as members; Stranger asks as a visitor and is turned away. The developer UI's **Try It!** tab runs it |

## What you need

- A running pico engine (1.9.4 or later for the page, which uses the shared `PicoTheme` component).
- `io.picolabs.xmlui` on the collection pico for the page. The bootstrap installs it. The rooms don't need it.
