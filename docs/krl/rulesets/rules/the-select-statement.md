# The select Statement

Select statements are the initial condition on whether or not to run a rule. The `select` statement contains an [event expression](/krl/event-expressions/) that must be true before the rule fires. The simplest event expression merely matches an event domain and type. For example:

```javascript
select when mail received
```

A rule with the preceding `select` statement will be selected for an event with the domain `mail` and the type `received`.

Event expressions can express complicated relationships between multiple events. Review the [event expression](/krl/event-expressions/) documentation for more examples of `select` statements.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189915) (last edited there 2018-02-14).</small>
