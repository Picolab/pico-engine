# Event Expressions

Writing a program to look at streams of events and pick out specific patterns isn't hard, but it gets tiresome when you want to do it over and over again. In the same way you use regular expressions to find patterns in strings, you can use a declarative language to express patterns in event streams and then automatically translate those patterns into the programs that search for them.

I will call patterns in this language *event expressions* or *eventexes*. Eventexes are used in KRL for selecting rules when a particular event pattern is present in the event stream. The processing system for KRL also uses eventexes to determine what events are salient for a particular rule set.

An effective event expression language will have the following properties (see Luckham, David. (2002). *The Power of Events*. Addison-Wesley):

- Power of expression
- Notational simplicity
- Precise semantics
- Scalable pattern matching

There is a trade-off between some of these properties. One can easily imagine powerful event-expression languages that are not scalable or simple to write. The event expressions described in this section achieve the goal of being quite powerful while retaining their implementability, scalability, and simplicity.

Eventexes have the following benefits over natural-language descriptions and standalone programs for recognizing the same pattern:

- Eventexes save time. Eventexes are succinct. Writing an eventex is shorter than writing the equivalent program in a general-purpose programming language, reducing tedium and mistakes at the same time.
- Eventexes provide a common foundation for communication. Eventexes are unambiguous. Programmers describing interesting patterns can be sure they are expressing the same concept when they use the same eventex. Similarly, programmers can be more sure that the program they are writing means what they think it does.
- Event processors can translate eventexes into programs to programmatically recognize specified patterns.
- Event generators can use eventexes to determine which events are of interest to the event processor, thereby making the event network more efficient.

Rules are selected when their event expression matches the incoming event or stream of events. The `select` statement is used in the rule to declare the event expression that the rule selects on. For example, a rule with the following select statement will select whenever the pico it is installed in receives an event with domain `emitter` and name `new_sensor_reading`.

```javascript
select when emitter new_sensor_reading
```

The following pages discuss the patterns that you can use to select events. We start with individual events and then move on to more complex event expressions that look for patterns over streams of events.

- [Finding Individual Events](/krl/event-expressions/finding-individual-events/)
- [Event Scenarios](/krl/event-expressions/event-scenarios)
- [Compound Events](/krl/event-expressions/compound-events/)
- [Eventex Examples](/krl/event-expressions/eventex-examples)

The examples from the sections show some of the power of using eventexes to match complex event scenarios. Eventexes make expressing the desired scenarios succinct and unambiguous.

The use of eventexes enables you to create dynamic queries that can filter the stream of real-time event data, matching only the event scenarios that are relevant to the task at hand. Being able to look for relevant event patterns is the first step toward managing and harnessing a deluge of real-time events. In coming chapters, you'll discover the power of not only matching event scenarios, but also processing them to achieve the user's purpose.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189912) (last edited there 2021-06-23).</small>
