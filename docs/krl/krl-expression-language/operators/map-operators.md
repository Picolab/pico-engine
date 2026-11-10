# Map Operators

The operators in this section are valid for maps.

Note: in addition to these operators, there is a [membership infix operator that works on arrays and maps](/krl/krl-expression-language/predicate-expressions).

## Hash Paths

Many of the following operators take an argument that is a hash path. A *hash path* is an array whose elements represent the key values (for a map) or array indices of a path from the root of a complex data structure to the element of interest. For example, consider the following data structure:

```javascript
{ "colors" : "many",
  "pi" : [3,1,4,1,5,6,9],
  "foo" : {"bar" : {"10":"I like cheese"}}
}
```

The hash path `["foo", "bar"]` references the following map inside the data structure:

```javascript
{"bar" : {"10":"I like cheese"}}
```

## `get()`

Returns the value at the given hash-path. This result is the same as the `foo{path}, but is useful when the map is the result of a function call.`

```javascript
a = {
  "colors" : "many",
  "pi" : [3,1,4,1,5,6,9],
  "foo" : {"bar" : {"10":"I like cheese"}}
};

f = function(){a};

a.get(["foo", "bar", "10"])
// "I like cheese"

a{["foo", "bar", "10"]}
// "I like cheese"

f.get(["foo", "bar", "10"])
// "I like cheese"
```

## `delete()`

The `delete()` operator takes a hash path argument designating the member of the original data structure that should be deleted. The `delete()` operator returns a new data structure with the specified member deleted. If the path is invalid, nothing is deleted and the new data structure is identical to the original. For example:

```javascript
a = { "colors" : "many",
      "pi" : [3,1,4,1,5,6,9],
      "foo" : {"bar" : {"10":"I like cheese"}}
    };
c = a.delete(["foo", "bar", "10"])
// c = { "colors" : "many",
//       "pi" : [3,1,4,1,5,6,9],
//       "foo" : {"bar": {}}
// }
```

## `filter()`

The `filter()` operator takes a function as its only argument and returns a map. The new map contains any members of the original map for which the function evaluates to true. The function given as the argument must take two arguments and return a Boolean value. The function is applied to the key and value of each member of the map in turn. The number of elements in the new map will be less than or equal to the length of the original map. For example:

```javascript
a = {"a": 3, "b": 4, "c": 5};
c = a.filter(function(v,k){v < 5})    // c = {"a": 3, "b": 4}
d = a.filter(function(v,k){k == "a"}) // d = {"a": 3}
```

## `keys()`

The `keys()`operator returns the keys of the map to which it is applied. Without an argument, the keys at the top level of the map are returned. The operator also accepts a hash path argument. For example:

```javascript
a = { "colors" : "many",
      "pi" : [3,1,4,1,5,6,9],
      "foo" : {"bar" : {"10": "I like cheese", "a" : 12}}
    };
b = a.keys();               // b = ["colors", "pi", "foo"]
c = a.keys(["foo", "bar"]); // c = [10, "a"]
```

## length()

The `length()` operator returns the number of elements in the map to which it is applied.

```
a = { "colors" : "many",
      "pi" : [3,1,4,1,5,6,9],
      "foo" : {"bar" : {"10": "I like cheese", "a" : 12}}
    };
b = a.length();                // b = 3
c = a{"foo"}.length();         // c = 1
d = a{["foo","bar"]}.length(); // d = 2
```

## map()

The `map()` operator returns a map that contains the results of applying the function given as the operator's argument to each key-value pair from the original map. The function given as an argument must take two arguments: the first will be the value and the second the key. The result will be a map with the same keys, each key mapped to the result of the function. The length of the resulting map will be equal to the length of the target map. For example:

```javascript
a = {"a": 3, "b": 4, "c": 5};
c = a.map(function(v,k) {v+2}) // c = {"a": 5, "b": 6, "c": 7}
```

## `put()`

The `put()` operator takes two arguments: an optional hash path, and a new element to be inserted. The result is a new data structure with the element inserted at the location specified by the hash path. If the path specifies a location that does not exist, it will be created. If the location already has a value, it will be replaced by the new element. For example:

```javascript
a = { "colors" : "many",
      "pi" : [3,1,4,1,5,6,9]
    };
b = {"flop" : 12};
c = a.put(["foo"], b);
// c = { "colors" : "many",
//       "pi" : [3,1,4,1,5,6,9],
//       "foo" : {"flop" : 12}
//     };
d = a.put(["foo", "bar"], b);
// d = { "colors" : "many",
//       "pi" : [3,1,4,1,5,6,9],
//       "foo" : {"bar" : {"flop" : 12}}
// };
```

If the hash path is omitted, the element must be a map, and its keys and values will be merged at the root level:

```javascript
e = a.put(b);
// e = {"colors" : "many",
//      "pi" : [3,1,4,1,5,6,9]
//      "flop" : 12
//     };
```

## `set()`

Return a copy of the Map where the given `value` is `set` at the hash `path`

```javascript
a = { "colors" : "many",
      "pi" : [3,1,4,1,5,6,9]
    };

a.set(["pi"], "new-thing");
// { "colors" : "many",
//   "pi" : "new-thing"
// }
```

## `values()`

The `values()`operator returns the values of the map to which it is applied. Without an argument, the values at the top level of the map are returned. The operator also accepts a hash path argument. For example:

```javascript
a = { "colors" : "many",
      "pi" : [3,1,4,1,5,6,9],
      "foo" : {"bar" : {"10": "I like cheese", "a" : 12}}
    };
b = a.values();               // b = ["many", [3,1,4,1,5,6,9], {"bar" : {"10": "I like cheese", "a" : 12}}]
c = a.values(["foo", "bar"]); // c = ["I like cheese", 12]
```

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189585) (last edited there 2020-12-24).</small>
