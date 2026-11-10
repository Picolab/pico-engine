# Operators

Operators are applied to expressions using post-fix notation with a period (`.`) as the separator. For example, if `a` is a string, the `lc()` operator, which creates a new string with the case of all characters in `a` lowered, is applied to `a` as follows:

```javascript
a.lc()
```

Operators can be chained. The following expression splits `a` into an array and then calculates the length of the resulting array:

```javascript
a.split(re#;#).length()
```

Operators are syntactic sugar for normal function application. The left hand of the period (.) is inserted as the first argument of the function call. For example:

```javascript
foo = function (self, arg1, arg2) {
  // `self` is the left hand side of `.`
}

// then use it
"something".foo(1, 2)
// which is the same as
foo("something", 1, 2)

// Another example:
a.split(re#;#).length()
// is the same as
length(split(a, re#;#))
```

The following sections describe operators currently available. They are organized based on the kind of value on which they operate.

- [Universal Operators](/krl/krl-expression-language/operators/universal-operators)
- [Number Operators](/krl/krl-expression-language/operators/number-operators)
- [String Operators](/krl/krl-expression-language/operators/string-operators)
- [Array Operators](/krl/krl-expression-language/operators/array-operators)
- [Map Operators](/krl/krl-expression-language/operators/map-operators)
- [Set Operators](/krl/krl-expression-language/operators/set-operators)
- [Hex Operators](/krl/krl-expression-language/operators/hex-operators)
- [Bitwise Operators](/krl/krl-expression-language/operators/bitwise-operators)

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189575) (last edited there 2024-07-31).</small>
