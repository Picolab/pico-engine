# Predicate Expressions

## Comparison

Several built-in, infix operators allow testing for equality and inequality, including `<`, `>`, `<=`, `>=`, `==`, and `!=.`

The following are all valid predicate expressions:

```javascript
c >= 5
event:attr("city") != "Blackfoot"
"Lindon" == app:cities[random:integer(0, app:cities.length()-1)]
time:now() == time:new("2015-08-08")
5 * (random:number(32, 212) - 32) / 9 < ent:thresholdTemp
```

As can be seen from the preceding examples, a number of built-in libraries provide predicates that can be used inside predicate expressions. The documentation for those libraries gives details about their operation.

Two special comparison operators are useful with the [sort()](/krl/krl-expression-language/operators/array-operators) operator: `<=>` and `cmp`. These operators return -1 if the first operand is less than the second, 0, if they're equal, and 1 if the first operand is greater than the second. The `<=>` operator is used with numbers and `cmp` is used with strings.

```javascript
x = 5;
y = 6;
x <=> y // returns -1
x <=> x // returns 0
y <=> x // returns 1
p = "aab";
q = "abb";
p cmp q // returns -1
p cmp p // returns 0
q cmp p // returns 1
```

## Like

`Like` takes a regular expression as its second argument and returns true if it matches the string given as its first argument. Arguments to these operators can be any valid expression.

```javascript
spicy = cheese like re#(nacho|pepperjack)#;
```

## Membership

There is an infix operator for testing membership, `><`. The >&lt; operator tests the number or string in the right operand for membership in the map or array given by the left operand. For maps, membership extends to keys only.

```javascript
a = [5, 6, 7];
m = {"a" : 1, "b" : 2};
a >< 6     // returns true
a >< 3     // returns false
m >< "a"   // returns true
m >< "foo" // returns false
```

## Compound Predicates

Compound predicate expressions are created using the operators `&&`, `||`, and `not` to express conjunction, disjunction, and negation, respectively. Conjunction has precedence over disjunction. Parentheses are used to group expressions for precedence.

```javascript
not a
a && b
a || b
(a || b ) && not c
```

The operators `&&` and `||` use [short-circuit evaluation semantics](https://en.wikipedia.org/wiki/Short-circuit_evaluation).

```
val = arg || default
```

In the example code shown above, the name `val` is bound to the value of `arg` provided it is considered to be "true" and otherwise binds it to the value of `default`. This is similar to, but more general than, the [universal operator defaultsTo](/krl/krl-expression-language/operators/universal-operators) except that the latter only applies when the value it is operating on is specifically `null`.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189570) (last edited there 2019-01-16).</small>
