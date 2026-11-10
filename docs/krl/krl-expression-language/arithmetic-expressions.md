# Arithmetic Expressions

KRL supports the standard arithmetic operators: `+`, `-`, `*`, `%`, and `/`, using infix notation. Precedence is left to right, where unary "-" has the greatest precedence, *, %, and / have equal and medium precedence, and + and - have equal and least precedence. Parentheses are used to group expressions when normal precedence rules are to be overridden.

Due to parsing issues, the unary "-" (minus) sign cannot be followed by a space.

The following expressions demonstrate arithmetic expressions in KRL:

```javascript
modulus = 17 % 3; // modulus = 2
divide = 22 / 10; // divide = 2.2
multiply = 10 * 4.2; // multiple = 42
add = 5 + 10; // add = 15
subtract = 3.8-12.4; // subtract = -8.6
all_of_them = (5 - -10 + 5) / (2 * 5 % 6); // all_of_them = 5
```

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189576) (last edited there 2018-03-24).</small>
