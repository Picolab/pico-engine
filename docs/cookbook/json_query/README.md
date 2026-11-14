# Querying JSON

Picos often hold large, nested data: API responses, sensor histories, a fleet's trips and fill-ups. KRL's [`query()`](/krl/krl-expression-language/operators/query-operator) operator finds values in that data with a [JSONPath](https://www.rfc-editor.org/rfc/rfc9535) expression, instead of a chain of `get()`, `map()`, and `filter()` calls.

This demo's pico holds the vehicles, trips, and fill-ups of a small fleet, the kind of data Fuse, a pico-based connected-car platform, kept for each vehicle. Its page shows the data and runs four queries against it, each showing a different part of JSONPath. You can also type your own.

| Query | Path | Shows |
|-------|------|-------|
| Every vehicle's name | `$.vehicles[*].name` | Child selectors and the wildcard |
| All the miles, at any depth | `$..miles` | The descendant selector |
| Business trips over 25 miles | `$.vehicles[*].trips[?@.category == 'business' && @.miles > 25]` | A filter with two tests |
| Each vehicle's latest fill-up | `$.vehicles[?count(@.fillups[*]) > 0].fillups[-1]` | A filter function and a negative index |

To run it, follow the [instructions](/cookbook/json_query/instructions).

## The rulesets

| Ruleset | File | What it shows |
|---------|------|---------------|
| Querying JSON | [`com.example.json_query.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/json_query/com.example.json_query.krl) | The data as a global map, `query()` in a shared function, and a `@view` that sends the path as a query parameter and shows the results. Creates an app channel that allows the page's queries and no events |
| Querying JSON bootstrap | [`com.example.json_query.bootstrap.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/json_query/com.example.json_query.bootstrap.krl) | Sets up the demo on a new pico. The developer UI's **Try It!** tab runs it |

## What you need

- A running pico engine with the `query()` operator (after 1.9.5).
- `io.picolabs.xmlui` on the pico for the page. The bootstrap installs it.
