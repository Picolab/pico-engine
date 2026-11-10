# Number Operators

The following operators are valid operators for numbers. Note: In addition to these there are also functions in the [math module](/krl/libraries/math).

## chr()

The chr`()` operator returns a string containing the character represented by the ASCIIi value of the number it operates on.  For example:

```javascript
a = 75.chr(); // a: 'K'
```

The inverse of chr`()` is `ord()`.

## range()

The range operator returns an array containing x to n elements. The number it operates on is the start of the range and the first parameter is the end of the range. For example:

```javascript
0.range(10) // Returns [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
```

If n is less than x, the sequence is decreasing and doesn't include n or n+1.

## `sprintf()`

The `sprintf()` operator can be applied to either a number or a string. The operator takes a formatting string as its sole argument. Use \`%d` to escape a literal `%d`:

```javascript
a = 10
b = a.sprintf("<\%d %d>") // b = "<%d 10>"
```

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1183721) (last edited there 2017-09-27).</small>
