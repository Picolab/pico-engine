# Conditional Expressions

KRL provides support for conditional expressions with the following syntax:

```javascript
<pred> => <consequent expr> | <alternate expr>
```

This is akin to the `?:` ternary operator found in the C family of languages.
Conditional expressions can be nested to produce structures like the following:

```javascript
<pred0> => <expr0> |
<pred1> => <expr1> |
<pred2> => <expr2> |
...
           <exprn>
```

Here are a couple of examples, whose predicates are enclosed in parentheses (this is not required, but can be clearer when reading code):

```javascript
z = (x > y) => y | x

d = (x > y) => x - y
  | (x < y) => y - x
  |            0
```

Note three different styles: all on a single line, or on multiple lines, one per expression, either ending with the vertical bar or with the expression, but in either case the expressions are lined up, and the vertical bars are lined up. These styles are not required by the language syntax but are recommended for readability of your code.

Another example, in a function to convert GMT time to Mountain Time during 2020:

```
    makeMT = function(ts){
      MST = time:add(ts,{"hours": -7});
      MDT = time:add(ts,{"hours": -6});
      MDT > "2020-11-01T02" => MST |
      MST > "2020-03-08T02" => MDT |
                               MST
    }
```

There is a common special case of the ternary expression, in which the predicate expression and the consequent expression are identical:

```
<pred> => <pred> | <alternate expr>
```

To avoid repeating the predicate expression, this can be replaced by the simpler, equivalent Boolean expression:

```
<pred> || <alternate expr>
```

This is especially useful if `<pred>` is an involved or time-consuming expression. This form is often used to provide default values for event attributes.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189571) (last edited there 2020-07-22).</small>
