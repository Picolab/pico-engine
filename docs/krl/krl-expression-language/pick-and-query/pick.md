# pick()

> **Engine Compatibility:**
>
> The `pick()` operator is not supported by the new pico engine.

The `pick()` operator is used to select portions a complex data structure. `Pick()` can be applied to any valid expression that returns a data structure. The `pick()` operator and its little language, JSONPath, are discussed in this section. The `pick()` operator takes two arguments:

- The first argument is a string that represents a JSONPath expression that will select some portion of the data structure.
- The second, optional argument is a Boolean that determines the return type of the result. If true, `pick()` will always return an array; otherwise, `pick()` will return whatever is appropriate. The default value is false. Ensuring the result is always an array is useful when `pick()` is used in a `foreach` statement.

## JSONPath

Stefan Goessner developed JSONPath as an analog to XPath for use with JSON data. The following description is modified from [his description of JSONPath](http://goessner.net/articles/JsonPath/). If you're familiar with XPath, the concepts behind JSONPath should be clear.

In KRL, JSONPath expressions give a path to a portion of a KRL data structure. JSONPath expressions are more powerful than the hash paths used in the `put()`, `delete()`, and `keys()` operators.

The root of a JSONPath expression is designated by the dollar symbol (`$`). Paths use dot notation to reference map keys and array index notation to reference array elements. For example, the following JSONPath expression would reference the `title` element in the first member of the array with the key `book` in the structure with the key `store`:

```javascript
$.store.book[0].title
```

JSONPath allows the wildcard symbol (`*`) for member names and array indices. The recursive descent operator (`..`), which must be followed by a key, descends through the data structure until the named key is found. For example, the previous example could be rewritten as follows:

```javascript
$..book[0].title
```

You can use simple KRL predicates as an alternative to explicit names or indices by using the at symbol (`@`) for the current object. Filter expressions are given using the question mark. For example, the following selects the titles of books with a price less than 10:

```javascript
$.store.book[?(@.price < 10)].title
```

The following table describes various components of JSONPath expressions and gives the analog in XPath for readers familiar with that notation.

| **XPath** | **JSONPath** | **Description** |
| --- | --- | --- |
| `/` | `$` | The root object. |
| `.` | `@` | The current object. |
| `/` | `.` | Child operator. |
| `//` | `..` | Recursive descent. JSONPath borrows this syntax from E4X. |
| `*` | `*` | Wildcard. All objects/elements regardless their names. |
| `[]` | `[]` | Subscript operator. |
| `|` | `[,]` | Union operator in XPath results in a combination of node sets. JSONPath allows alternate names or array indices as a set. |
| n/a | `[start:end:step]` | Array slice operator. |
| `[]` | `?()` | Applies a filter (script) expression. |
| n/a | `()` | KRL [predicate expression](/krl/krl-expression-language/predicate-expressions). |

Note that there are differences in how the subscript operator works in XPath and JSONPath. Square brackets in XPath expressions always operate on the node set resulting from the previous path fragment. Indices always start at 1. In contrast, JSONPath square brackets operate on the object or array addressed by the previous path fragment. Indices always start at 0.

## Examples

The best way to understand the operation of JSONPath expressions is through examples. Suppose you have made the following declaration in KRL:

```javascript
store_data =
  { "store": {
       "book": [{"author": "Nigel Rees",
                 "title": "Sayings of the Century",
                 "price": 8.95},
                {"author": "Evelyn Waugh",
                 "title": "Sword of Honour",
                 "price": 12.99},
                {"author": "Herman Melville",
                 "title": "Moby Dick",
                 "isbn": "0-553-21311-3",
                 "price": 8.99},
                {"author": "J. R. R. Tolkien",
                 "title": "The Lord of the Rings",
                 "isbn": "0-395-19395-8",
                 "price": 22.99
                }
               ],
       "bicycle": {"color": "red",
                   "price": 19.95}
      }
}
```

The following table shows the result of various JSONPath expressions operating on `store_data:`

| **JSONPath** | **Result** |
| --- | --- |
| `$.store.book[*].author` | The authors of all books in the store |
| `$..author` | All authors |
| `$.store.*` | All things in store, which are some books and a red bicycle. |
| `$.store..price` | The prices of everything in the store. |
| `$..book[2]` | The third book |
| `$..book[-1:]` | The last book |
| `$..book[0,1]` or `$..book[:2]` | The first two books |
| `$..book[?(@.isbn)]` | Filter to find all books with ISBN numbers |
| `$..book[?(@.price<10)]` | Filter all books cheaper than 10 |
| $..book[?(@.title like '/^M\w+/')] | Filter al books with a title that starts with 'M' |
| `$..*` | All members of JSON structure. |

In KRL, you use the `pick()` operator to apply JSONPath to a data structure.

```javascript
prices = store_data.pick("$.store..price")
// prices = [8.95, 12.99, 8.99, 22.99, 19.95]
last_price = store_data.pick("$..book[-1:].price")
// last_price = 22.99
last_price_array = store_data.pick("$..book[-1:].price", true)
// last_price_array = [22.99]
```

If you're trying to match data with a period (`.`) in the name, the period will be interpreted as a JSONPath operator unless you escape it with a backslash like so:

```javascript
bar.pick("$..www\.kynetx\.com[0].text")
```

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189600) (last edited there 2017-03-23).</small>
