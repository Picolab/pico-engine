# Actions

One of the primary reasons for executing a rule is to take action. Actions provide the pico with the means of interacting with the world around it. In contrast, statements that affect the pico itself are typically found in the [postlude](/krl/rulesets/rules/postlude/) of the rule.  As we've seen, the [basic structure of a rule](/krl/rulesets/rules/) looks contains an action following the prelude. The action block is optional; you can create rules without actions. In addition, the action may have a conditional but they often do not.

```javascript
send_directive("this is an unconditional action")

if threshold < 100 then
    send_directive("this is a conditional action")
```

The preceding example shows an unconditional action and one that is conditional on the threshold being less than 100.

Structurally, actions look a lot like functions. Actions have a name and a set of parameters. Unnamed parameters are specified first, in order, followed by a list of name-value pairs in any order. The name and value are paired using an equal sign (`=`):

```javascript
foo("hello", 5, x = "world", y = 6 + 5)
```

This action has a name, `foo`, and two unnamed parameters, `"hello"` and `5`. The action also has two named parameters, `x` with the value `"world"` and `y` with the value `11`. The parameters, named and unnamed, can be any valid KRL expression and will be evaluated prior to the action being taken. More formally, parameters are evaluated in applicative order.

The following provide more information about using and creating actions:

- [Basic actions](/krl/rulesets/rules/actions/taking-action/) are built into KRL and available for any rule to use.
- [Compound actions](/krl/rulesets/rules/actions/compound-actions) allow more than one action to be taken by a rule.
- [User-defined actions](/krl/krl-expression-language/user-defined-actions) are an abstraction mechanism for creating custom actions.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189921) (last edited there 2020-02-05).</small>
