# Postlude

The section after the action is called the postlude. The rule's postlude statement is evaluated after the action has been generated.
The postlude allows for effects. Effects are an important addition to the ECA pattern. Effects differ from actions in that they do not result in directive documents being sent to the event generator. Instead, they cause side effects on the engine. Examples of effects include the following:

- **[Persistent variables](/krl/persistent-variables/).** An effect might cause a permanent change to a persistent variable. Persistent variables allow context to be automatically maintained for an entity or an application across separate invocations of a rule set. See the documentation on [persistent variables](/krl/persistent-variables/) for more information.
- **Control statements.** Sometimes, you need to affect the normal execution order. For example, the last statement causes the execution of the ruleset to terminate after the current rule.
- **Explicit events.** Explicit events allow a rule set to raise an event in response to incoming events.
- **[Scheduled events](/krl/libraries/schedule)**. Scheduled events are raised and evaluated at a specific time.
- **Exception Handling** Rules can raise error events that other rules respond to for handling exceptions.
- **Explicit Logging** An effect might direct the system to log something.

The rule postlude allows action to be taken based on whether or not the rule fired. The most common use is to manage persistent variables. You can also place explicit logging statements in the prelude.

Postludes are evaluated based on the status of the rule: fired, notfired, or always. The fired and notfired constructs take an optional else clause that is executed in the opposite state. Note that for a rule to "fired" it has to be selected and the condition on the action has to be true (i.e. action has to be taken). Rules without a conditional on the action are always evaluated and thus always fire so long as they are selected.

A postlude takes one of the following forms:

- `always` - the postlude is evaluated whether or not the rule fires.
- `fired` - the postlude is evaluated if the rule fires
- `notfired` - the postlude is evaluted only if the rule does not fire

```javascript
always {
  <postlude statement> [; <postlude statement>]* [;]
}
```

```javascript
fired {
  <postlude statement> [; <postlude statement>]* [;]
} else {
  <postlude statement> [; <postlude statement>]* [;]
}
```

```javascript
notfired {
  <postlude statement> [; <postlude statement>]* [;]
} else {
  <postlude statement> [; <postlude statement>]* [;]
}
```

Since the else is optional, you will often see postludes without it:

```javascript
fired {
  <postlude statement> [; <postlude statement>]* [;]
}
```

The are sometimes postlude effects that should happen whether or not the rule fired. To avoid repeating them, you can use finally for anything that should happen regardless of the condition.

```javascript
fired {
  <postlude statement> [; <postlude statement>]* [;]
} else {
  <postlude statement> [; <postlude statement>]* [;]
} finally {
  <postlude statement> [; <postlude statement>]* [;]
}
```

The following section describe the various statements that a postlude can contain:

- [Guard Conditions](/krl/rulesets/rules/postlude/guard-conditions)
- [Control Statements](/krl/rulesets/rules/postlude/control-statements)
- [Explicit Logging](/krl/rulesets/rules/postlude/explicit-logging)
- [Explicit Events for Error Handling](/krl/rulesets/rules/postlude/explicit-events-for-error-handling)
- [Raising Explicit Events in the Postlude](/krl/rulesets/rules/postlude/raising-explicit-events-in-the-postlude)

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189919) (last edited there 2020-12-15).</small>
