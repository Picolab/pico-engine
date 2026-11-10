# Maps

Maps—also called *hashes*, *dictionaries*, and *associative arrays*—are created by enclosing comma-delimited name-value pairs in curly braces, like so:

```javascript
some_hash = {"foo" : "bar",
"fizz" : {"a" : 5, "b" : 6},
"flop" : [1, 2, 3]};
```

Maps can be queried in the traditional manner using a key enclosed in curly braces:

```javascript
my_val = some_hash{"foo"}; // returns "bar"
```

KRL allows deep queries by what are known as *hash paths*. A hash path is an array whose elements represent the key values (for a map) or array indices of a path from the root of a complex data structure to the element of interest:

```javascript
another_val = some_hash{["fizz", "b"]}; // returns 6
```

There are a number of [map operators](/krl/krl-expression-language/operators/map-operators) that affect maps.

For example, to retrieve all values from the map, you use the [`values()`](https://picolabs.atlassian.net/wiki/display/docs/Map+Operators#MapOperators-values()) operator:

```javascript
my_vals = some_hash.values(); // returns ["bar", {"a" : 5, "b" : 6}, [1, 2, 3]]
```

As another example, you can also merge hashes using the [put()](/krl/krl-expression-language/operators/map-operators) operator:

```javascript
new_map = {"foo" : "bar1", "bazz": 4};
some_hash.put(new_map);
// returns {"foo" : "bar1", "fizz" : {"a" : 5, "b" : 6}, "flop" : [1, 2, 3], "bazz": 4}
```

When defining map literals, a string literal *must* be used to define the keys. This code will *not* work.

```javascript
some_string = "map_key";
literal_map = {some_string : "associated value"}; // DOES NOT WORK
```

You must use the [put()](/krl/krl-expression-language/operators/map-operators) operator to add string values bound to variables as keys for a map.

For example:

```javascript
first_key = "map_key";
second_key = "second_map_key";
new_map = {}.put(first_key, "first entry").put(second_key, "second entry");

/*
new_map looks like this:

{
  "map_key": "first entry",
  "second_map_key": "second entry"
}
*/
```

## Operations on Maps

There are a number of [operators](/krl/krl-expression-language/operators/map-operators) that work on maps. In addition there is an [map membership infix operator](/krl/krl-expression-language/predicate-expressions).

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189848) (last edited there 2018-05-23).</small>
