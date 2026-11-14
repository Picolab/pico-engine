# Event Loop Introduction

Each pico presents an event loop that handles the events sent to it, according to the rulesets installed in it. The event is the input that makes the cycle happen. When the event has been handled, the pico waits for the next one.

```
 event queue
     │
     ▼
 1. Wait ─────▶ 2. Decode ─────▶ 3. Schedule Rules ─────▶ 4. Rule Evaluation ─────▶ 5. Assemble Response
 (idle until     (unpack the      (look up salient         (run the schedule,         (directives, outcomes,
  the queue       event into a     rules; build the         one rule at a time;        raised events)
  has an event)   request)         schedule)                raise appends rules)             │
     ▲                                                            │   ▲                      │
     │                                                            └───┘                      │
     │                                                       (schedule grows)                │
     └──────────────────────────── wait again ◀─────────────────────────────────────────────┘
```

The five phases, in order: **Wait**, **Decode**, **Schedule Rules**, **Rule Evaluation**, **Assembling the Response**. Then the pico waits again.

## Wait

A pico spends nearly all its time waiting. An idle pico does no work.

Events the pico receives are added to its event queue and handled in the order received. The pico leaves the wait phase when the queue has an event to process.

**Picos are single-threaded.** A pico never processes two events at the same time, so rules in one pico can't race each other over its entity variables. Other events that arrive meanwhile queue up.

## Decode

The decode phase unpacks the event from whatever carried it and puts it in a common form, the *request* that the rest of the cycle uses whenever it needs information about the event: its domain, type, attributes, and event id.

Most events arrive over HTTP, through the [Sky event API](/exp/event) (`/sky/event/<eci>/<eid>/<domain>/<type>`). The channel in the URL picks the pico and its policy decides whether this domain and type is allowed in. Events sent from another pico with `event:send` arrive the same way, and events raised by the pico itself skip the transport altogether. Other transports could be supported by adding a decoder.

## Schedule Rules

Building the schedule determines what happens for the rest of the cycle.

The engine keeps a *salience graph* for each pico. For any event domain and type, it tells which rules are *salient*: which have an event expression that mentions that domain and type. The incoming event has one domain and one type, and the engine looks up the rules that are listening for that pair and puts them on the **schedule**.

The graph is computed from the rulesets installed in the pico, so it's recalculated whenever the pico's rulesets change. It acts as an event bus: when you install a ruleset, its rules are subscribed to the events they select on, with no other wiring.

Order matters in some places and not in others:

- **Within a ruleset**, rules appear in the schedule in the order they are written.
- **Across rulesets**, there is no defined order. Don't count on one ruleset's rules running before or after another's. If you need an order, make it explicit with events (see below).

"Salient" doesn't mean "will run". A rule on the schedule has only shown that it listens for this domain and type.

## Rule Evaluation

The engine goes down the schedule one rule at a time. For each rule it evaluates the event expression to see whether the rule is *selected*, and if so runs it: the prelude, the action when its condition is true, and then the postlude. A rule can be on the schedule and still not be selected, such as when a compound event expression is waiting for another event, or a `where` clause is false.

Most of what a rule does doesn't affect the loop. Two things do:

- **`raise` appends to the schedule.** A `raise` in a postlude doesn't call anything. The engine looks up the rules salient for the raised event and **appends** them to the end of the schedule, and the current rule's evaluation continues from where it left off. Everything scheduled by the original event runs before anything scheduled by a raised event. This is why `raise` is not a function call, and why a rule that raises an event and then expects the effect right away is surprised. See [KRL misconceptions](/developing/misconceptions#order-of-rule-evaluation).
- **`last`** in a postlude stops the remaining rules of that ruleset on the schedule.

Rules that raise events are still within the same pico and the same cycle. The whole cascade runs, and the schedule empties, before the cycle ends.

Two other kinds of effects are outside the schedule:

- **HTTP calls.** A synchronous call to an external API from the [http library](/krl/libraries/http) makes the rule wait until the resource answers, and the pico handles nothing else meanwhile, since it's single-threaded.
- **Sending an event to another pico.** `event:send` is **asynchronous**. It starts an independent cycle in the receiving pico and doesn't change the schedule you're running. If both picos are on the same engine they run concurrently, though not necessarily in parallel. You can't assume anything about their relative order unless you make one, usually by having the receiver send an event back when it's done. The [Scatter-Gather](/lessons/scatter-gather) lesson does exactly this, with a correlation id so the gatherer can tell which reply is which.

If a pico sends an event to its *own* channel, that event goes to the back of its queue and is handled in a later cycle, since the pico is busy.

## Assembling the Response

When the schedule is empty, the engine assembles the response from the output of all the rules that fired: the directives (`send_directive`), the outcome of each rule, and the events raised during the cycle. Over HTTP this is the JSON body described on the [Event API](/exp/event#response) page.

An event having a response is unusual, and mostly a historical convenience. For an event sent synchronously over HTTP the response confirms that it arrived and was processed, and it can carry useful results. Events sent asynchronously, including `event:send` from a rule, never have a response the sender can use. Responses are optional and depend on which rules ran.

## Waiting again

Once the response has gone, the pico takes the next event in its queue, or waits if the queue is empty.

Queries are separate. They call a shared function and return its value, and they don't run rules or change the pico (see [Query API](/exp/query)).

## See also

- [Events and Queries](/lessons/events-and-queries): events and queries over HTTP, with the Logging tab showing each cycle
- [Scatter-Gather](/lessons/scatter-gather): ordering concurrent picos explicitly
- [KRL misconceptions and common errors](/developing/misconceptions)
- [Event expressions](/krl/event-expressions/) and [raising explicit events](/krl/rulesets/rules/postlude/raising-explicit-events-in-the-postlude) in the KRL manual

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189951) (by Phil Windley; last edited there 2021-02-22), and updated for this engine.</small>
