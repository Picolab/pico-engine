# query()

The `query()` operator finds values in a map or array with a [JSONPath](https://www.rfc-editor.org/rfc/rfc9535) expression and returns them in an array. It's useful for picking values out of large or deeply nested data, such as an API response, without a chain of `get()`, `map()`, and `filter()` calls.

```krl
fleet = {
  "vehicles": [
    {"name": "truck", "trips": [{"miles": 8.7, "category": "business"}, {"miles": 2.7, "category": ""}]},
    {"name": "van", "trips": [{"miles": 40, "category": "business"}]}
  ],
  "owner": {"name": "Phil"}
}

fleet.query("$.vehicles[*].name")       // ["truck", "van"]
fleet.query("$..name")                  // ["truck", "van", "Phil"]
fleet.query("$.vehicles[*].trips[?@.category == 'business'].miles")  // [8.7, 40]
fleet.query("$.vehicles[?count(@.trips[*]) > 1].name")              // ["truck"]
fleet.query("$.vehicles[-1].name")      // ["van"]
fleet.query("$.nope")                   // []
```

The [Querying JSON](/cookbook/json_query/) demo runs queries like these on a page, beside the data they search.

`query()` always returns an array, even when one value matches, and an empty array when none does. Use `head()` for the first match:

```krl
owner = fleet.query("$.owner.name").head()
```

The path must start with `$`, the value `query()` is applied to. An invalid path is an error, and so is a path that isn't a string.

## JSONPath in brief

| Syntax | Selects |
| --- | --- |
| `$` | The value itself (the root) |
| `.name` or `['name']` | A member of a map. Use the bracket form for names with spaces or punctuation. |
| `[2]`, `[-1]` | An element of an array, counting from 0; negative counts from the end |
| `[1:3]`, `[::2]` | A slice of an array: start, end (not included), and step |
| `.*` or `[*]` | Every member of a map or element of an array |
| `..name`, `..*` | Descendants at any depth |
| `['a', 'b']`, `[0, -1]` | Several selections at once |
| `[?<filter>]` | Members or elements for which the filter is true |

In a filter, `@` is the member or element being tested. A filter can compare (`==`, `!=`, `<`, `<=`, `>`, `>=`), combine with `&&`, `||`, and `!`, test for existence (`[?@.email]`), and call these functions:

| Function | Returns |
| --- | --- |
| `length(v)` | The length of a string, array, or map |
| `count(nodes)` | How many values a path selects, as in `count(@.trips[*])` |
| `match(s, re)` | Whether the whole string matches the regular expression |
| `search(s, re)` | Whether some part of the string matches it |
| `value(nodes)` | The value a path selects, when it selects exactly one |

The regular expressions are strings in [I-Regexp](https://www.rfc-editor.org/rfc/rfc9485) form, a common subset of regular expression syntax.

Strings in a path can use single or double quotes. Single quotes are easier inside a KRL string: `"$[?@.category == 'business']"`.

## Building paths

A path is a string, so it can be built from values:

```krl
longTrips = function(min) {
  fleet.query("$.vehicles[*].trips[?@.miles > " + min + "]")
}
```

Take care when a value comes from an event attribute or another pico: a quote or bracket in it changes the path. Check such values first (a number with `.as("Number")`, a name with `match()`), or select with `query()` and then filter in KRL.

## From the classic engine

The classic engine's `pick()` operator also used JSONPath, but it returned a single value when there was one match and an array otherwise. `query()` always returns an array, so `x.pick("$..status")` becomes `x.query("$..status")`, and code that expected one value adds `.head()`. JSONPath is now a standard ([RFC 9535](https://www.rfc-editor.org/rfc/rfc9535)). Older filters such as `[?(@.miles > 5)]` still work (the parentheses are optional), but filters that ran script expressions, which some JSONPath implementations allowed, don't.

The classic engine's `query()` operator was a different thing, based on MongoDB queries. It isn't part of this engine.
