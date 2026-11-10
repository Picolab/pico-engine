# Declarations

Declarations bind names to values. Variables are declared inside the global section of the rule set, the rule prelude, functions, and user-defined actions.

The expression on the right is evaluated and its value is bound to the variable on the left. The right-hand side can be any [valid expression](/krl/krl-expression-language/).

Function declarations are separated by semicolons.

The following example shows two variables, `x` and `y`, being declared:

```javascript
x = 5;
y = event:attr("url").extract(#http://(\[^/?]+)#)
```

KRL is statically scoped. Each place where an identifier is bound in a program corresponds to a region of the program text within which the binding is visible. The region is determined by the particular programmatic context where the binding is made:

- Each rule set is a binding scope and the bindings constructed within a rule set evaluation are only visible within that rule set execution. Any declarations made in the global section of a rule set will be visible for the execution of any rules in that rule set.
- Each rule is also a binding scope. Values bound to names in the setting clause of an eventex and values bound in the prelude are visible throughout the execution of that particular rule.

KRL variable declarations are not variable assignments. Neither can KRL expressions cause persistent side effects. For example, the second declaration in the following prelude does not change the value to which `x` is bound. Rather, it results in two bindings of `x`, one of which is hidden (shadowed) by the other:

```javascript
x = 5;
x = x + 6;
```

Developers should avoid treating declarations as assignments because they will invariably be [surprised by the resulting semantics](/krl/rulesets/rules/prelude/declarations/declaration-semantics) in subtle ways.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189835) (last edited there 2021-01-23).</small>
