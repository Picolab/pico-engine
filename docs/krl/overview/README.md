# Overview

Consider the following example adapted from a *Scientific American* article on the Semantic Web:

The entertainment system was belting out the Beatles' "We Can Work It Out" when the phone rang. When Pete answered, his phone broadcast a message to all local devices indicating it had received a call. His stereo responded by turning down the volume. ...

The message that Pete's phone sends is an event. That event--let's call it `phone:inbound_call`--doesn't say what should happen. Rather, the event processors that happen to be listening for that event make that determination. They *react* to the event.

Event processors take the form of rules. Rules are a natural way to build reactive systems because they allow behavior to be layered. In the stereo example, two rules--one for the stereo and one for the DVR--could be listening for the `phone:inbound_call` event and take what action is appropriate in their context. Adding another listener simply means adding another rule. The rule defines what should happen when a particular event pattern occurs. The rules determine the response.

The basic pattern for a rule is shown in the following pseudocode:

when an **event** occurs
if some **condition** is true
then take some **action**

This pattern is called the event-condition-action, or ECA, pattern. Many rule languages use this pattern. The ECA pattern is typical for most business rule systems. Rule languages based on this pattern are a widely accepted way to build reactive systems.

Separating events from conditions is a key concept in ECA rule languages. As you've seen, events represent a state transition. Conditions, on the other hand, are used to determine if the current state has specific properties. For example, the `phone:inbound_call` event signals that the phone system has detected a phone call (i.e., the state changed from one in which no phone call was happening to one in which a phone call was happening). Conditions can be used to check properties of the new state, such as "is the call from the 801 area code?" "Is it after 5 p.m.?" or "Does the user's Google calendar show that she's busy right now?" The separation of events from conditions provides a clear distinction between when (event), what (condition), and how (action).

> **Note:** Don't confuse ECA rule languages with the kinds of rule languages that have been heavily used in planning and reasoning systems, including expert systems and natural language processing. They are very different.

## KRL is an ECA Rule Language

The Kinetic Rule Language (KRL) is an ECA rule language. KRL is a programming language for creating applications on the Live Web. KRL programs, or rule sets, comprise a number of rules that respond to particular events.

Besides a collection of rules, KRL rule sets also contain a `meta` section for specifying information about the rule set, a `dispatch` section for providing clues about event salience, and a `global` section for global definitions.

Each rule conforms to the aforementioned pattern for ECA rule languages with some significant additions. The basic structure of a KRL rule is as follows:

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

Only the name and eventex are required, so most rules are simpler than this template. (Obviously, a rule with only a name and eventex wouldn't accomplish anything, so meaningful rules include at least an action or a postlude in addition to the required components.) The prelude contains a list of variable declarations that allow computation of values for the condition and action based on global values and event attributes. Later, this chapter will discuss the KRL expression language in greater detail.

Actions specify the reaction that the rule makes to the event. Actions take two general forms:

- Actions produce directive documents that are sent to endpoints causing them to do something. For example, an email endpoint might receive a directive telling it to delete a specific message.
- Actions invoke operations in network APIs that produce some desired side effect. For example, an action might cause a Twitter update to be made to the user's status.

The section after the action is called the postlude. It allows for effects. Effects are an important addition to the ECA pattern. Effects differ from actions in that they do not result in directive documents being sent to the endpoint. Instead, they cause side effects on the KRE system. Examples of effects include the following:

- **Persistent variables.** An effect might cause a permanent change to a persistent variable. Persistent variables allow context to be automatically maintained for an entity or an application across separate invocations of a rule set.
- **Control statements.** Sometimes, you need affect the normal execution order. For example, the `last` statement causes the execution of the ruleset to terminate after the current rule.
- **Explicit events.** Explicit events allow a rule set to raise an event in response to incoming events.
- **Exception Handling and logging.** Rules can raise error events that other rules respond to for handling exceptions. Also, an effect might direct the system to log something.

- [Evented Systems vs Request-Response Systems](/krl/overview/evented-systems-vs-request-response-systems)
- [Why Use the Kinetic Rule Language?](/krl/overview/why-use-the-kinetic-rule-language)

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189865) (last edited there 2011-12-30).</small>
