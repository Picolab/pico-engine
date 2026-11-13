# Collection demo

A pico that keeps a collection of other picos over relationships, accepts members by role, and reports on all of them.

- Overview: [`docs/cookbook/collection/README.md`](../../docs/cookbook/collection/README.md) (on the docs site: https://docs.picolabs.io/#/cookbook/collection/)
- Instructions: [`docs/cookbook/collection/instructions.md`](../../docs/cookbook/collection/instructions.md)

| File | Shows |
|------|-------|
| `com.example.collection.krl` | The collection: accepts members by role, turns away other roles, removes members, and provides `members()` |
| `com.example.collection.room.krl` | A member: has a temperature, joins, leaves, and rejoins |
| `com.example.collection.report.krl` | Uses the collection as a module, asks every member for its reading, and has the Rooms page |
| `com.example.collection.bootstrap.krl` | Creates the collection and five rooms on a new pico (one asks in the wrong role); the **Try It!** tab runs it |
