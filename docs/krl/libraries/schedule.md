# schedule

Scheduled events allow you to raise an event at a point in time or on a recurring schedule.  Scheduled events function like a raised event and are scheduled for the current pico

## Postlude Statements

### One time events

```
schedule <domain> event <eventtype> at <ISO8601 DateTime> [attributes <expr>] [setting(<var>)]
```

The name or type of the event &lt;eventtype> can be any KRL &lt;expr> that evaluates to a string

The time expression can be any expression that evaluates to a future ISO8601 DateTime. For example, in the following example, the [time library](/krl/libraries/time) is used to create a time 5 minutes in the future

```
schedule notification event "remind5" at time:add(time:now(), {"minutes": 5})
```

There are 2 components to this time expression: time:now() selects the current time; time:add() takes the current time and calculates the time in 5 minutes.  By using the native [time module](/krl/libraries/time) expressions, you can avoid some of the headache of converting between localtime and UTC.

`attributes` uses the familiar KRL modifier syntax to allow you to pass a map to the raised event

```javascript
schedule notification event "remind5" at time:add(time:now(), {"minutes": 5})
  attributes event:attrs()
```

The `setting(<var>)` clause stores the identifier for this scheduled event in the `<var>`. Note that `<var>` is a variable for the current rule and goes out of scope when the rule terminates, so it must be used inside the postlude where the scheduled event is created.

### Recurring events

The format is the same as for single events; however the keyword **repeat** (instead of **at**) requires &lt;timespec> to be a [CRON style](https://github.com/node-schedule/node-schedule#unsupported-cron-features) time specification (see below).

```
schedule <domain> event <eventtype> repeat <timespec> [attributes <expr>] [setting(<var>)]
```

The name or type of the event &lt;eventtype> can be any KRL &lt;expr> that evaluates to a string

#### Time Specifications

The cron format consists of:

```
*    *    *    *    *    *
┬    ┬    ┬    ┬    ┬    ┬
│    │    │    │    │    |
│    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
│    │    │    │    └───── month (1 - 12)
│    │    │    └────────── day of month (1 - 31)
│    │    └─────────────── hour (0 - 23)
│    └──────────────────── minute (0 - 59)
└───────────────────────── second (0 - 59, OPTIONAL)
```

*Notice that there is no field for year.  Recurring events operate on a yearly cycle.  If you want to schedule an event to be raised every 16 months, calculate the next few occurrences and schedule several single events*

A '*' in a field will match any value

Complex expressions can be defined with a &lt;timespec>. The extent of the CRON format is beyond the scope of this article, but some examples of recurring events that can be expressed through a cron &lt;timespec> are

```
*   42  * * * *     run when the minute is 42 (e.g. 19:42, 20:42, etc.).
*/5  *  * * * *     run every 5 seconds
     5  0 * * *     run five minutes after midnight, every day
    15 14 1 * *     run at 2:15pm on the first of every month
     0 22 * * 1-5   run at 10 pm on weekdays
     5  4 * * 0     run at 5 after 4 every Sunday
23 0-23/2 * * *     run 23 minutes after midn, 2am, 4am ..., everyday
```

For example, the following will cause the event `notification:repeating_event` every `period` seconds:

```
schedule notification event "repeating_event"
        repeat << */#{period} * * * * * >>  attributes { } setting(id);
```

## Functions

### `schedule:list()`

Returns an array of events schedule by the ruleset it is executed in. For example:

```javascript
[
  {
    id: "cj2j53ckp0000vgdx7p8rxw0o",
    at: "2017-12-25T00:00:00.000Z",
    event: {domain: "holiday", type: "christmas", attrs: {}}
  },
  {
    id: "cj2j54lc90001vgdxsdhr3kgn",
    at: "2018-01-01T00:00:00.000Z",
    event: {domain: "holiday", type: "new-years-day", attrs: {}}
  },
  {
    id: "cj2j54qpc0002vgdxdbqe2cwj",
    timespec: "*/1 * * * * *",
    event: {domain: "every", type: "1second", attrs: {}}
  }
]
```

Note: it sorts the soonest `**at**` events to the top. And the repeat events at the end.

### `schedule:history(<id>)`

Not yet implemented

## Actions

### `schedule:remove(id)`

It accepts an id for a scheduled event.  This id could come from `event:list_scheduled()` or from the postlude. It removes the scheduled event from the queue. If it fails it will throw an error. A ruleset can only remove an event that it scheduled.

```javascript
if <some condition> then {
  schedule:remove("cj2j54qpc0002vgdxdbqe2cwj");
}
```

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/32839058) (last edited there 2021-03-28).</small>
