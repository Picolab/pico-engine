# Control Statements

You can place ruleset control statements in the postlude of a rule.

```javascript
last
```

The `last` stops ruleset execution after the current rule.

This example will stop execution of the ruleset if the rule that this postlude is contained in fires.

```javascript
fired {
  last
}
```

This example will stop execution of the ruleset if the rule that this postlude is contained in fires and x is equal to 4.

```javascript
fired {
 last if(x==4)
}
```

The following construct ensures that no rules below the current rule will ever be executed:

```javascript
always {
 last
}
```

The `last` control statement is used in the [authorize-then-use pattern](https://picolabs.atlassian.net/wiki/display/docs/Authorize-Then-Use+Pattern).

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189898) (last edited there 2012-01-12).</small>
