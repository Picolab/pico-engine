# Variable Arity Event Operators

The compound event operators used previously were given as infix, binary operators. (The term *infix* describes operators that are placed syntactically between their operands.) Event expressions also allow variable arity event operators that provide more convenient methods of expressing patterns over large numbers of events. (The term *arity* refers to the number of parameters a function takes. Variable arity functions can take a variable number of parameters.) Using compound operators in this way follows this pattern:

```javascript
select when <eventop>(E1,[el]En)
```

In the previous example, `<eventop>` is one of `or`, and, `before`, `after`, or `then`. Variable arity functions are merely a convenience because their semantics can be expressed using the binary operators. For example, the following two `select` statements are equivalent:

```javascript
select when and(A, B, C, D, E)
select when A and (B and (D and (C and E)))
```

Note that `and` and `or` are commutative. Consequently, the order of the arguments is not important for those two variable arity operators.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189879) (last edited there 2017-07-18).</small>
