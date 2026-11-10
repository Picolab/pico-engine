# Rules Are Simply Conditional Actions

Rules are conditional actions. The action can be anything appropriate to the domain. Actions usually cause some effect outside the pico. For example, an action might fire off an HTTP POST or send a message to another pico.

[Event expressions](/krl/event-expressions/) can be used to specify complex event patterns. A rule is selected when the eventex in the rule's `select` statement matches events in the rule set's event stream.

Once selected, the rule's prelude is executed and the condition, if any, is evaluated. If the condition is true, the action is taken; we say the rule fired. Empty conditions are trivially true. Because you can write a selector that always selects and the conditional is optional, some rules will always fire. But most interesting rule sets will contain rules that only fire under certain circumstances. After the action has been generated, the rule's postlude statement is evaluated. (Note that actions are not necessarily sent to endpoints as they are taken, but are queued for delivery when the entire event evaluation has completed for more efficient execution.

Condition expressions may not have anything to do with the events that led to the rule being selected. They could, for example, check a data source for the weather or a stock price. A condition is valid over a period of time. Events are atomic with respect to time. Being in a state is a condition, and the state transition that got you there is the event.

The best way to think of a rule's condition is as a guard on the action. Programmers new to KRL frequently want an else clause on the conditional. But there is a distinction between choosing an action and determining when an action should fire. The condition is used to determine whether an action should fire, not which action. Which action to fire is generally determined by which rule is selected.

Event expressions can use filters to further distinguish one event from another. For example, the following eventex matches `pageview` events where the URL has a particular format:

```javascript
rule url_in_filter {
  select when web pageview where url.match(re#/archives/\d{4}/#)
  ...
}
```

Suppose, instead, that you had written the URL filter as a condition in a rule using the event attribute function:

```javascript
rule url_in_condition {
  select when web pageview
  if event:attr("url").match(re#/archives/\d{4}/#) then
    ...
}
```

These are, mostly, equivalent, but there are several subtle differences:

- The second rule will be selected more than the first, but fire in the same circumstances. This has implications for system efficiency but not for the overall effect of the rule.
- Eventex filters are useful when you use compound expressions. This is especially true with aggregators. For example, the following eventex will match using a sliding window of five withdrawal events and set the variable m to have the maximum amount when that amount is above a threshold:
- Salience hints, harvested from the eventexes of a rule set, contain more useful data when the eventex include filters. This makes the network more efficient because endpoints can be written that only raise relevant events.

Consider the following select statement:

```javascript
select when repeat(5, withdrawal where amount.match(#$(\d+\.\d\d)#) && amount > 100) max(m)
```

This concept would be more verbose and difficult to understand had it been expressed any other way.

Rule conditions have the advantage of being able to take other data, aside from the events and attributes, into consideration when determining whether a rule should fire. KRL makes it easy to access data from cloud-based APIs. In addition, a number of intrinsic functions and libraries offer additional data to a KRL rule set. Consequently, conditions are important for making decisions based on user context because there's more of it available to conditions than there is in an eventex, regardless of sophistication.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189830) (last edited there 2017-07-10).</small>
