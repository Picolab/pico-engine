# Rules

Rules are the primary component of a ruleset.

Rules respond to events and, conditionally, take action. The basic pattern for a rule is as follows:

**when** an event occurs

**if** some condition is true

**then** take some action

This pattern is called the event-condition-action, or ECA, pattern. Many rule languages use this pattern. The ECA pattern is typical of most business rule systems and rule languages based on that pattern are a widely accepted way to build reactive systems.

Separating events from conditions is a key idea in ECA rule languages. As we’ve seen, events represent a state transition. Conditions, on the other hand, are used to determine if the current state has specific properties.

For example, the inbound_call event signals that the phone system has detected a phone call (i.e. the state changed from one where no phone call was happening to one where a phone call was happening). Conditions can be used to check properties of the new state such as “is the call from the 801 area code,” “is it after 5pm,” or “does the user’s Google calendar show that she’s busy right now?” The separation of events from conditions provides a clear distinction between when (event), what (condition) and how (action).

Each rule conforms to the pattern for ECA rule languages given above with some significant additions. The basic structure of a KRL rule is as follows:

```javascript
rule <name> {
  select when <eventex>
  pre {
    <declarations>
  }
  if <expr> then
    <action>
  fired {
    <effects>
  } else {
    <effects>
 }
}
```

Only the name and eventex are required, so most rules are simpler than this template. The prelude contains a list of variable declarations that allow computation of values for the condition and action based on global values and event parameters. We will discuss the KRL expression language in greater detail later in this chapter.

Actions are the reaction that the rule makes because of the event. Actions take two general forms:

- Actions produce directive documents that are sent to endpoints causing them to do something. For example, an email endpoint might receive a directive telling it to delete a specific message.
- Actions invoke side-effect producing operations in network APIs. For example, an action might cause a Twitter update to be made to the user’s status.

The section after the action is called the *postlude* and allows for “effects.” Effects are an important addition to the ECA pattern. Effects differ from actions in that they do not result in directive documents being sent to the endpoint, but rather cause side effects on the KRE system. Examples of effects include the following:

- **Persistent variables**—an effect might cause a permanent change to a persistent variable. Persistent variables allow context to be automatically maintained for an entity or an application across separate invocations of a ruleset.
- **Control statements**—sometimes we need to abort the execution of a ruleset or otherwise affect the normal execution order.
- **Explicit events**—explicit events allow a ruleset to raise an event in response to the incoming events. This effect is so useful and powerful that there is an entire chapter devoted to it.
- **Logging**—an effect might direct the system to log something.

The following pages describe the details of rules:

*- [Rules Are Simply Conditional Actions](/krl/rulesets/rules/rules-are-simply-conditional-actions)
- [The select Statement](/krl/rulesets/rules/the-select-statement)
- [Looping in Rules](/krl/rulesets/rules/looping-in-rules)
- [Prelude](/krl/rulesets/rules/prelude/)
- [Actions](/krl/rulesets/rules/actions/)
- [Postlude](/krl/rulesets/rules/postlude/)*

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189934) (last edited there 2017-05-23).</small>
