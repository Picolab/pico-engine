# Querying JSON: instructions

These steps use the developer UI of a running engine at `http://localhost:3000`. Replace that with your engine's URL. See the [overview](/cookbook/json_query/) for what the demo shows.

## The quick way: Try It!

On the root pico in the developer UI, open the **Try It!** tab, click **Querying JSON**, then **Run in a new child pico**. When it shows **ready**, open **Query page**.

## By hand

1. Create a child pico and open its **Rulesets** tab.
2. Install `io.picolabs.xmlui` from the engine: `http://localhost:3000/krl/io.picolabs.xmlui.krl`.
3. Install the demo ruleset: `http://localhost:3000/krl/demos/json_query/com.example.json_query.krl`.
4. Installing it creates a channel tagged `json_query, app`. Click **View** next to `com.example.json_query` and open it on that channel.

## Try it

- Click **Show the JSON**. The fleet data appears beside the queries.
- Click each query button. The card shows the path, what it uses, and the values `query()` found.
- Type your own path and click **Run it**:
  - `$.owner.email`: one value, still in an array
  - `$.vehicles[?@.year > 2020].name`: a filter on a number
  - `$..cost`: every trip's cost
  - `$.vehicles[0].trips[-1:]`: the last trip of the first vehicle, as a slice
  - `$.vehicles[?match(@.make, 'T.*')].model`: a regular expression
  - `$.nope`: no match, an empty array
- Type a broken path such as `$.vehicles[?@.year >`. The pico answers with the parse error.
- Run a query from a terminal. The path has to be URL-encoded:

  ```sh
  curl "http://localhost:3000/sky/query/<eci>/com.example.json_query/runQuery?path=%24..miles"
  ```

## How it works

The data is a map in the ruleset's `global` block, and one shared function queries it:

```krl
runQuery = function(path) {
  result = fleet.query(path)
  answer = {"path": path, "count": result.length(), "result": result}
  answer
}
```

`query()` always returns an array, even for one match, and an empty array when nothing matches. An invalid path is an error, which the engine returns to the page as `{"error": …}`.

The page fetches `runQuery` with a `DataSource` whose `queryParams` send the path. `DataSource` URL-encodes it, which matters because JSONPath uses `$`, `?`, `&&`, and quotes:

```xml
<DataSource id="run" url="#{run_url}" headers="{appGlobals.auth}" queryParams="{{path: path}}" when="{path}" />
```

Each button sets `path`, and the `DataSource` fetches again whenever `path` changes. The canned queries come from another shared function, `cannedQueries()`, so the page doesn't have to put JSONPath strings in XML attributes.

The JSON is shown with `JSON.stringify(value, null, 2)` in a `Text` with `variant="mono"` and `preserveLinebreaks`.

## Change it and watch

The **Try It!** window lists each file with its path on disk. Edit `com.example.json_query.krl` there, click **Flush**, and reload the page.

- Add a fifth entry to `cannedQueries()`, for example the total of fuel bought: `$.vehicles[*].fillups[*].gallons`. Then sum the result in KRL with `.reduce(function(a, b) { a + b }, 0)`.
- Add a vehicle to `fleet`, and run the queries again.
- Write a function that uses `query()` for something useful, such as the business miles of one vehicle: `fleet.query("$.vehicles[?@.name == '" + name + "'].trips[?@.category == 'business'].miles")`. See the [`query()` page](/krl/krl-expression-language/operators/query-operator) on checking values before putting them in a path.
