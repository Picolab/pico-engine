# Querying JSON demo

Find values in nested JSON with KRL's `query()` operator and JSONPath. The pico holds a fleet's vehicles, trips, and fill-ups, and a page runs four canned queries against it, or one you type.

- Overview: [`docs/cookbook/json_query/README.md`](../../docs/cookbook/json_query/README.md) (on the docs site: https://docs.picolabs.io/#/cookbook/json_query/)
- Instructions: [`docs/cookbook/json_query/instructions.md`](../../docs/cookbook/json_query/instructions.md)

| File | Shows |
|------|-------|
| `com.example.json_query.krl` | The fleet data, the canned queries, a `runQuery(path)` function that calls `fleet.query(path)`, and a page that shows the data and runs the queries |
| `com.example.json_query.bootstrap.krl` | Sets up the demo on a new pico; the **Try It!** tab runs it |
