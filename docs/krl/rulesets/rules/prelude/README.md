# Prelude

- [Declarations](/krl/rulesets/rules/prelude/declarations/)
- [Event Attributes](/krl/rulesets/rules/prelude/event-attributes)

KRL uses the ["event condition action" pattern](https://en.wikipedia.org/wiki/Event_condition_action). Since there is only space for a single Boolean expression in the condition, KRL adds a prelude section in which preparatory computations can be done. It fits in between the event and condition, setting things up for the conditional action. The prelude begins in line 3 in the rule template shown below.

```javascript
rule test {
  select when sensor heartbeat
  pre {
    ...
  }
  if condition_is_true then {
    send_directive("Heartbeat")
  }
  fired {
    ...
  } else {
    ...
  }
}
```

The prelude comprises a series of [declarations](/krl/rulesets/rules/prelude/declarations/declaration-semantics). The values bound to names in the declaration are within scope in the condition, action, and postlude of the rule.

See the child pages of this page for details.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189911) (last edited there 2021-01-23).</small>
