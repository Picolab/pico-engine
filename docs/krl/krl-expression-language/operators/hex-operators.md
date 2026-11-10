# Hex Operators

The following operators are valid for hexadecimal values

## `toHexOrNull()`

Takes a value as an argument. If the argument is a number it is converted to a string matching the regex `/^[A-F0-9]+$/` with the hexadecimal value of the number. Arguments of any other type return `null`.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/2400681985) (last edited there 2023-01-18).</small>
