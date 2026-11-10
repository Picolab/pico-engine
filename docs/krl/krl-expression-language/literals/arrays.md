# Arrays

Arrays are created by enclosing comma-delimited expressions in square brackets like so:

```javascript
["a", "b", "c"]
```

Arrays use zero-base indexing and can be referenced in the usual manner:

```javascript
a = [1,4,3,6,5];
b = a[1] // b = 4
```

Note that array references work for arrays of any dimension. For example, `c[1][2]` is allowed (presuming `c` is an array of arrays).

## Operations on Arrays

There are a number of [operators](/krl/krl-expression-language/operators/array-operators) that work on arrays. In addition there is an [array membership infix operator](/krl/krl-expression-language/predicate-expressions).

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189872) (last edited there 2017-07-10).</small>
