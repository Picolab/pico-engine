# Beestings

KRL extended quotes support the beesting operator, making them simple templating systems. Inside an extended quote, expression values can be referenced using the `#{<expr>}` syntax. For example, suppose you've stored 10 and 20 in the variables `a` and `b`:

```javascript
somevar = <<
The average of #{a} and #{b} is #{(a + b)/2}
>>;
```

The value of `somevar` would be `"The average of 10 and 20 is 15."`

A beesting is escaped with a backslash (`\#{`).

> **Non-Scalar Values:**
>
> If you try to insert non-scalar values into a string using the beesting syntax, only their types will be printed. For a non-scalar, use the [encode() operator](/krl/krl-expression-language/operators/map-operators) on the value first to turn it into a string.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189871) (last edited there 2017-08-08).</small>
