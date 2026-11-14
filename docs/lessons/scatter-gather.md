# Scatter-Gather

Sometimes one pico needs many others to do something, and then needs all the answers together. A fleet pico wants a report from every vehicle pico. A course pico wants a grade from every section. A coordinator wants a vote from every member.

The **scatter-gather** pattern does this with events alone, so nobody waits on anybody. This lesson explains the pattern with the problem that taught it to us, and builds a runnable version.

## Objectives

When you finish you will be able to:

- explain why a synchronous request-response solution breaks as the number of picos grows
- scatter an event to a computed list of picos, and gather the answers with an aggregator
- use a **correlation number** to keep concurrent conversations apart
- add a timeout, and say why it is a safety net and not the way the work finishes
- compare event recipient lists, content-based routing, and registration as ways to decide who gets an event

**Before you begin**, finish [Pico-Based Systems](/lessons/pico-based-systems) and [Relationships](/lessons/relationships). The example sends events to children, and the routing examples use relationships.

## The problem

Fuse was an open-source connected-car platform built with picos. Every week it sent the fleet owner a report: the trips and fuel fill-ups of each vehicle in the period, summed for each vehicle and then for the fleet. The owner was a pico, so was the fleet, and so was each vehicle. Each was independent and addressable, kept its own data, and answered queries (functions) and events (rules). They talked to one another directly, with nothing in between.

## The synchronous solution

The straightforward way is for the fleet to *ask* each vehicle for its details, wait for every reply, format the report, and tell the owner that it's ready:

```krl
fleetDetails = function() {
  wrangler:children().map(function(vehicle) {
    wrangler:picoQuery(vehicle{"eci"}, "com.example.vehicle", "summary", {})
  })
}
```

Programmers who've used an API will find that familiar. It works so long as every vehicle answers promptly. A query waits for its answer, so the fleet pico is stuck for the sum of all the delays, and it can't handle anything else meanwhile. Vehicles on other engines are queried over the network, where timeouts have to be short, and one slow vehicle gets missed. With a few vehicles that's rare. With ten, the chance that at least one is late gets good, and with a hundred it's routine.

Longer timeouts only hide the problem. Making each vehicle faster helps, but there is always something that can be slow: the network, a busy engine, a database. If a synchronous request-response were your only tool, this would be a serious problem. It isn't your only tool.

## The scatter-gather solution

Use events, and let every pico work at its own pace. Vaughn Vernon describes the pattern in *Reactive Messaging Patterns with the Actor Model*: get a number of actors to do something, then aggregate what they send back. Here:

1. The owner (or anything else) sends the fleet `report:requested`. Having sent it, the sender is free to do other things.
2. A rule in the fleet **scatters** a `report:vehicle_report_requested` event to each vehicle, whether there are 1 or 100. These are asynchronous too, and under no time pressure.
3. Each vehicle builds its report and sends `report:vehicle_report_created` to the fleet.
4. A rule in the fleet **gathers** them, one at a time, as they arrive.
5. Another rule checks whether every vehicle has answered. When all have, the fleet finishes the report.

There are no queries in this flow, only events. Events go to a pico, not to a particular rule: each pico has its own event bus, and any rule that selects the event runs. A rule doesn't need to know who raised the event, or what else is listening.

## The messy details

Two problems have to be solved for this to be reliable.

**Overlap.** A second report might start before the first has finished. Each run therefore carries a unique **correlation number**, `rcn`. Every rule that sees it passes it along and files its data under it, so two reports in flight at once never get mixed up. (Reports run once a week and almost never overlap, but it's a good habit: independent conversations should be kept independent.)

**Loss.** The "is everyone in?" check depends on events from vehicles. Delivery isn't guaranteed: a pico might be down, an engine unreachable, a pico deleted mid-conversation. If one never answers, the report never finishes. There are several tactics:

- Accept it: tell owners that a report sometimes fails, and let someone ask for it again.
- Set a timeout and carry on, producing the report with some vehicles missing.
- Set a timeout and re-send the request to the vehicles that haven't answered, and give up (carry on without them) after some number of retries.

Fuse used the second. Picos have no clock tick of their own. They react to events, so if you need a timer you schedule an event for later. Two minutes was plenty. Scheduling a short, recurring event to make a "tick" is possible, but usually unnecessary and wasteful.

> **The timeout is a safety net.** The normal path is driven entirely by events: the last answer arrives, the check fires, the report finishes. The timer only matters when something went wrong. Don't schedule an event to wait for work to finish. Chain steps with events instead.

## The pieces

Here is the fleet. It's a ruleset for a pico whose children are vehicles. The rules appear in the order they run, one for each step above.

### Correlating events

A **correlation identifier** links the two halves of an asynchronous conversation. It is an event attribute, any string that's unique within the conversation, and the sender of the first event expects it back in the reply. Rules also use it as a key in persistent state, so each conversation's data is separate.

```krl
// 1. Start: correlate the work, remember who we expect, set a safety timer.
rule start_report {
  select when report requested
  pre {
    rcn = event:attr("rcn") || random:uuid()
    expected = vehicles().map(function(v) { v{"name"} })
  }
  always {
    ent:reports{rcn} := {"expected": expected, "received": {}}
    raise report event "scatter" attributes {"rcn": rcn}
    schedule report event "timer_expired"
      at time:add(time:now(), {"minutes": 2})
      attributes {"rcn": rcn}
  }
}
```

- `rcn` is taken from the event if the caller supplied one (so a retry can reuse a number), and otherwise generated with `random:uuid()`.
- The rule stores the fleet's expectations under that number: the vehicles it's waiting for, and a map for what's received.
- In the postlude it raises `report:scatter` to start the work and schedules `report:timer_expired`, both carrying the number.

Any rule that sees an `rcn` must pass it on. Future versions of Wrangler may automate more of this.

### Event recipient lists

The simplest routing is to keep a list of picos and send the same event to each of them, like the **To:** line of an email. The list can be fixed, or computed, so that the pico acts as an event router. Here the list is the fleet's current children:

```krl
// 2. Scatter: one event per vehicle, from a computed recipient list.
rule scatter {
  select when report scatter
  foreach vehicles() setting(vehicle)
  event:send({
    "eci": vehicle{"eci"},
    "domain": "report",
    "type": "vehicle_report_requested",
    "attrs": {"rcn": event:attr("rcn")}
  })
}
```

- `foreach` runs the rest of the rule once for each vehicle that `vehicles()` returns, setting `vehicle` each time. If vehicles are added or removed, the next report just uses the new list.
- `event:send` goes in the action block. It sends `report:vehicle_report_requested` over the family channel to each vehicle.
- The number goes along with it.

The vehicle pico does its part, and it can take as long as it likes:

```krl
ruleset com.example.vehicle {
  meta {
    name "Vehicle"
    use module io.picolabs.wrangler alias wrangler
    shares summary
  }
  global {
    /**
     * What this vehicle has done.
     * @returns Map
     */
    summary = function() {
      {"trips": ent:trips.defaultsTo(0), "miles": ent:miles.defaultsTo(0)}
    }
  }

  rule produce_vehicle_report {
    select when report vehicle_report_requested rcn re#(.+)# setting(rcn)
    event:send({
      "eci": wrangler:parent_eci(),
      "domain": "report",
      "type": "vehicle_report_created",
      "attrs": {"rcn": rcn, "vehicle": wrangler:name(), "details": summary()}
    })
  }
}
```

It sends the answer to its parent with the number and its name, so the fleet can tell who replied.

### Aggregators

An **aggregator** collects events and, when it has enough, raises an event or takes another action. The fleet's is two rules: one collects, and one decides.

```krl
// 3. Gather: file each answer under its correlation number.
rule catch_vehicle_report {
  select when report vehicle_report_created
  pre {
    rcn = event:attr("rcn")
    open = reports() >< rcn
  }
  if open then noop()
  fired {
    ent:reports{[rcn, "received", event:attr("vehicle")]} := event:attr("details")
    raise report event "vehicle_report_added" attributes {"rcn": rcn}
  }
}
```

- The rule files the vehicle's details under `[rcn, "received", vehicle name]`, so overlapping reports can't interfere, and a vehicle that answers twice just overwrites itself.
- The rule only acts if the report is still open (`reports() >< rcn`). An answer that arrives after the report has finished is ignored.
- It raises `report:vehicle_report_added` with the number so another rule can decide.

```krl
// 4. Check: is everyone in?
rule check_report_status {
  select when report vehicle_report_added
  pre {
    rcn = event:attr("rcn")
    report = ent:reports{rcn}
    still_waiting = report{"expected"}.defaultsTo([]).difference(report{"received"}.defaultsTo({}).keys())
  }
  if not report.isnull() && still_waiting.length() == 0 then noop()
  fired {
    raise report event "ready" attributes {"rcn": rcn}
  }
}
```

- The prelude works out which expected vehicles haven't answered. Each is in `expected` but not among the keys of `received`.
- If none is missing, the rule fires and raises `report:ready`. Otherwise it does nothing: there's no waiting, no loop, and the next answer will run this rule again.

### Dealing with failure

The timer was scheduled when the report began. When it expires, the rule sees whether the report is still open, and if it is, raises the same `report:ready` event, marked `timed_out`:

```krl
// The timer is a safety net, not the way the work normally finishes.
rule timer_expired {
  select when report timer_expired
  pre {
    rcn = event:attr("rcn")
  }
  if reports() >< rcn then noop()
  fired {
    raise report event "ready" attributes {"rcn": rcn, "timed_out": true}
  }
}
```

Whichever comes first, the last answer or the timer, ends in `report:ready`. The rule that finishes the report has to make sure it only does so once:

```krl
// 5. Finish once, however we got here.
rule finish_report {
  select when report ready
  pre {
    rcn = event:attr("rcn")
    report = ent:reports{rcn}
    missing = report{"expected"}.defaultsTo([]).difference(report{"received"}.defaultsTo({}).keys())
  }
  if not report.isnull() then noop()
  fired {
    ent:completed{rcn} := {
      "details": report{"received"},
      "missing": missing,
      "time": time:now()
    }
    clear ent:reports{rcn}
  }
}
```

It runs only if `ent:reports{rcn}` still exists, and it clears it. So a late answer, or a timer that expires after the report is done, finds nothing to do. The finished report lists the `details` it has and which vehicles are `missing`, so a reader knows what it's made of.

To retry instead of just continuing, have `timer_expired` raise `report:scatter` again for only the missing vehicles (the same `rcn`), count the attempts, schedule the timer again, and finish after the limit. Fuse did this: up to two retries, two minutes apart, and then a report with what it had.

### Content-based event routing

Another way to decide who gets an event is by what it says. The routing pico knows several others and chooses by the event's domain, type, attributes, or its own state. A Fuse fleet could have more than one owner and needed to keep an owner informed by routing certain events to one:

```krl
// Content-based routing: the event decides where it goes.
rule route_to_owner {
  select when fleet new_trip
           or fleet reminders_ready
           or fleet email_for_owner
  pre {
    owner = relationship:established("Tx_role", "owner").head()
  }
  if owner then
    event:send({
      "sub": owner,
      "domain": "fleet",
      "type": event:type(),
      "attrs": event:attrs
    })
}
```

- The event expression says which events get routed. It's fixed when the rule is written. To route on something computed, chain rules.
- `relationship:established("Tx_role", "owner")` finds the relationships whose other end is an owner. `head()` takes the first. To tell every owner, loop over them with `foreach`.
- `event:send` with `"sub"` sends over the relationship. The type and attributes of the incoming event go along unchanged.

### Registration

The most general routing is a directory. Picos send a registration event saying who they are and what they care about, and the directory routes events to those that have registered for them. The directory can be a special pico in a large system, or a ruleset in a pico that does other things too. A directory also lets a pico change its channel for security without losing service, and lets a pico move without losing messages.

```krl
// Registration: picos say what they want to hear about.
rule register_pico {
  select when registry pico_registered
    topic re#(.+)#
    eci re#(.+)#
    setting(topic, eci)
  always {
    ent:registrations{[topic, eci]} := event:attr("name")
  }
}
```

```krl
rule route_to_registered {
  select when fleet events_to_route
           or fleet another_event_to_route
  foreach registered(event:attr("topic")) setting(eci)
  event:send({
    "eci": eci,
    "domain": "fleet",
    "type": event:type(),
    "attrs": event:attrs
  })
}
```

The first rule files each registrant under its topic. The second sends an incoming event to every pico registered for the event's `topic`. A registrar goes a step further: it manages the registry on behalf of the picos, watching `wrangler:child_initialized` and `wrangler:child_deleted` and registering and deregistering as they come and go. The picos needn't know the registry exists.

## Try it

Make a fleet pico with two or three children. Install `com.example.vehicle` in each child, and `com.example.fleet` in the parent. The easy way is to use the chain from [Pico-Based Systems](/lessons/pico-based-systems): `new_child_request`, then `child_initialized`, then `install_ruleset_request`.

On the fleet's Testing tab, raise `report:requested`. Query `completed` and you'll see one report with every vehicle's details, an empty `missing` list, and the correlation number as its key. Then try it the hard way:

- Uninstall `com.example.vehicle` from one child and raise `report:requested` again. The report completes after the timer expires, with that vehicle in `missing`.
- Raise `report:requested` twice quickly. There are two numbers and two independent reports.

## Conclusion

Scatter-gather adds a few rules over the synchronous version, and each is short and does one thing. What you get for it:

- **Reliability.** The synchronous version fails when any vehicle is slow. This one finishes even when one is dead.
- **Better use of the fleet pico.** It doesn't sit waiting. It handles other events while the vehicles work, and takes the answers as they arrive.
- **No locks.** The fleet pico may get answers from many vehicles at once, but they queue and are handled one at a time. Because each pico is independent, concurrent processing needs no locks, inside a pico or between picos. This is a property of actor systems, and picos are actors.

Vernon's book is a good companion. Its language and framework (Scala and Akka) are different, but the concepts carry over directly to picos.

## Related

- [Child pico tasks](/cookbook/child_tasks/): a pico per job, with a task id and no waiting
- [Querying another pico](/patterns_and_tips/querying-another-pico): when a synchronous query is the right tool
- [Relationships](/wrangler/relationships) and [The wrangler ruleset](/wrangler/wrangler): the events and functions used here
- [Gossip](/lessons/gossip): an advanced lab in which picos exchange state by events

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1185976) (Reactive Programming Patterns: Scatter Gather, last edited there 2021-03-06), and rewritten for this engine. The Fuse examples are now written as a small fleet and vehicle.</small>
