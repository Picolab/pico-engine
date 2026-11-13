# Arrays and maps

KRL has no `for` loop in expressions. Array operators do the same work: `map`, `filter`, `reduce`, `sort`, and the others in [Array operators](/krl/krl-expression-language/operators/array-operators). Here are a few patterns that come up often.

## Loop with `reduce`

To repeat a step a fixed number of times, `reduce` over a range and carry the state in the accumulator. This converts a number to an 8-byte array, high byte first, the way this JavaScript does:

```js
for (var index = 0; index < byteArray.length; index++) {
  var byte = long & 0xff;
  byteArray[index] = byte;
  long = (long - byte) / 256;
}
```

```krl
toByteArray = function(str) {
  1.range(8)
    .reduce(function(a, i) {
      [a[0].append(a[1] % 256), math:int(a[1] / 256)]
    }, [[], str.as("Number")])
    .head()
    .reverse()
}
```

`1.range(8)` is `[1, 2, ... 8]`. It only counts; the function doesn't use `i`. The accumulator is a pair: the bytes so far, and what's left of the number. Each step appends the low byte and divides by 256. At the end, `head()` takes the bytes and `reverse()` puts the high byte first. `toByteArray("1551127401")` is `[0,0,0,0,92,116,83,105]`.

Add `.klog("step")` inside the function to watch the accumulator change on each step.

The inverse is one `reduce`. With no initial value, it starts from the first element:

```krl
fromByteArray = function(bytes) {
  bytes.reduce(function(a, b) { a * 256 + b })
}
```

## Flatten an array of arrays

```krl
[[1, 2, 3], [4, 5, 6], [7, 8, 9]].reduce(function(a, b) { a.append(b) }, [])
// [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

## Sort an array of maps

`sort` takes a comparison function. A function that returns one, for a given key, reads well:

```krl
by = function(key) {
  function(a, b) { a{key}.encode() cmp b{key}.encode() }
}
```

`wrangler:channels().sort(by("id"))` reads "my channels, sorted by id". `cmp` compares strings, and `encode()` turns any value into a string, so `by` works whatever the values are. For numbers, compare them as numbers instead: `people.sort(function(a, b) { a{"born"} <=> b{"born"} })`.

For a primary and a secondary key:

```krl
by = function(key1, key2) {
  key2 =>
    function(a, b) {
      a{key1}.encode() cmp b{key1}.encode() ||
      a{key2}.encode() cmp b{key2}.encode()
    }
  |
    function(a, b) { a{key1}.encode() cmp b{key1}.encode() }
}
```

`||` stops at the first comparison that isn't zero, so the second key only breaks ties. `by("last", "first")` sorts by last name, then first name, and `by` still works with one key.

A key can also be a path, such as `by(["meta", "flushed"])`, because `a{["meta", "flushed"]}` looks up a nested value.

*From the Pico Labs KRL Cookbook pages "Looping using the reduce operator", "Flatten an Array of Arrays", and "Sorting an Array of Maps".*
