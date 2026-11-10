# Raising Explicit Events in the Postlude

Explicit events are raised in the rule postlude with a raise statement. You can raise events from a postlude like so:

```javascript
raise <domain> event <expr> [for <expr>] [attributes <expr>]
```

The event name is given by the `<expr>`. The expression is evaluated and the resulting string is used as the event name.

> **Warning:**
>
> Because the event name is an expression, you must use a string rather than using a bare word.

> **Note:**
>
> If you want to raise an event on a schedule, please refer to the [schedule](/krl/libraries/schedule) documentation.

## Attributes Clause

The `attributes` clause allows the developer to add event attributes to the event. The expression that follows the `attributes` key word must evaluate to a map. The keys and values in the map will be used as event attributes. This is particularly useful when you want to pass through all, or most, of the attributes that the current rule received:

```javascript
raise some_domain event "foo"
  attributes event:attrs
```

This raises the event `some_domain:foo` with all of the attributes that were passed into the enclosing rule.

## What Rulesets See an Explicit Event?

You can control which rulesets see an explicit event using the optional `for` clause.

The for clause is followed by an expression that is evaluated to determine which rule sets should see the event. The result must be a string, giving the target ruleset ID or an array of target rulesets. At the moment, the system will use the version of the current ruleset.

In the [Sky Event API](https://picolabs.atlassian.net/wiki/display/docs/Sky+Event+API), explicit events will be raised to any ruleset that an entity has installed unless a `for` clause is present. You can specify the current ruleset using `meta:rid` from the [meta library](/krl/libraries/meta).

Like any other postlude statement, explicit events can be guarded:

```javascript
raise explicit event "foo" attributes {
       "a" : "hello",
       "b" : 4 + x
} if (flipper == "two");
```

The event in the preceding example will only be raised if the variable flipper has the value "two".

Explicit events allow KRL programmers to chain rules together. Rule chaining is good for modularization, error handling, preprocessing, and abstraction.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189896) (last edited there 2021-04-14).</small>
