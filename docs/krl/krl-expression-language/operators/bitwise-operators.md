# Bitwise Operators

The following boolean operators are available:

## `band(x)`

Boolean AND of left value and `x` where `x` is a string representing a hexadecimal value.

```
a.band("3FFF")
```

## `bnot()`

Boolean NOT of left value.

```
a.bnot()
```

## `bor(x)`

Boolean OR of left value and `x` where `x` is a string representing a hexadecimal value. .

```
a.bor("3FFF")
```

## `bxor(x)`

Boolean XOR of left value and `x` where `x` is a string representing a hexadecimal value. .

```
a.bxor("3FFF")
```

## `shiftLeft(<num>)`

Shifts left value right `<num>` times.

```
a.shiftLeft(14)
```

## `shiftRight(<num>)`

Shifts left value right `<num>` times.

```
a.shiftRight(14)
```

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/2400354308) (last edited there 2024-07-31).</small>
