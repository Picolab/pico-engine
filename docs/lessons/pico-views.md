# Pico Views

A pico can be the whole back end of an application: it keeps the state, enforces who may change it, and answers queries. This lesson adds the front end, and it lives in the pico too. You'll build a small **timing tracker** (start a timing, finish it later, see how long it took) and serve its page straight from the pico as a **pico view**.

This replaces the older Single Page Application lesson, which wrote the page by hand in Angular and called the pico with AJAX. That approach still works, and you'll see how at the end. A view is the engine-hosted way: no web server, no JavaScript build, no ECI pasted into a URL. You install a ruleset and open it.

## Objectives

When you finish you will be able to:

- write a ruleset that keeps timings in an entity variable and shares them with a query
- write rules for `timing:started` and `timing:finished` with attribute matching
- tag a shared function with `@view` so the engine serves it as a page
- read and write from the page with `ui:query` and `ui:event`
- create an app channel with `ui:create_app_channel`, and one channel per user so you can revoke one
- say when to use a view and when to use a classic single page application

**Before you begin**, finish [Pico State](/lessons/pico-state) and read [Pico views](/pico-views). You need a running engine. If you haven't seen a view yet, run the [Echo demo](/cookbook/echo/) first: it's the smallest one, and its [instructions](/cookbook/echo/instructions) take two minutes.

## The application

Each **timing** has a number (`n1`, `n2`, …) and a name. When a timekeeper starts a timing, the pico records the start time. When they finish it, the pico records the finish time and the page shows the elapsed time as `HH:MM:SS`.

Some rules of the game:

- There can be several timekeepers using the page at once, but only one of them starts a given number. A number can't be reused.
- Finishing a timing records the finish time. A later finish overwrites it. (Ignoring later finishes is an exercise.)
- A timing that has started but not finished shows a **Finished** button.

That's all the behavior. A pico already knows how to do every part: events change state, a shared function reads it, and a channel decides who can do either. The view only adds a way to see and click.

## The ruleset

Save this as `com.example.timing_tracker.krl`. The three rules `timing_first_use`, `timing_started`, and `timing_finished` are the heart of the application. The page (`timingPage`) and the channel rules come after them in this walk-through.

```krl
ruleset com.example.timing_tracker {
  meta {
    name "Timing tracker"
    description "Start and finish times, each identified by a number and a name."
    use module io.picolabs.xmlui alias ui
    shares entries, timings, timingPage
  }
  global {
    channel_tags = ["timing", "app"]

    /**
     * Every timing, as stored.
     * @returns Array of { ordinal, number, name, time_out, time_in }
     */
    entries = function() {
      ent:timings.defaultsTo({}).values()
    }

    pad = function(n) {
      n < 10 => "0" + n.as("String") | n.as("String")
    }

    // HH:MM:SS between the start and the finish of one timing
    elapsed = function(timing) {
      started = time:strftime(timing{"time_out"}, "%s").as("Number")
      finished = time:strftime(timing{"time_in"}, "%s").as("Number")
      secs = finished - started
      hours = (secs - secs % 3600) / 3600
      minutes = (secs % 3600 - secs % 60) / 60
      pad(hours) + ":" + pad(minutes) + ":" + pad(secs % 60)
    }

    /**
     * The timings, newest first, with the elapsed time of each finished one.
     * @returns Array of { ordinal, number, name, time_out, time_in, elapsed }
     */
    timings = function() {
      entries()
        .sort(function(a, b) { b{"ordinal"} <=> a{"ordinal"} })
        .map(function(t) { t.put("elapsed", t{"time_in"} => elapsed(t) | "") })
    }

    /**
     * Start and finish timings
     * @view "Timing"
     */
    timingPage = function() {
      <<
<Component name="TimingPage">
  #{ui:query("rows", "timings", {"rid": meta:rid})}
  #{ui:event("startTiming", "timing", "started", {"refresh": ["rows"]})}
  #{ui:event("finishTiming", "timing", "finished", {"refresh": ["rows"]})}
  <PicoTheme>
    <Card title="Timing" subtitle="Number a timing (n1, n2, ...), name it, and click Finished when it is over." />
    <Form saveLabel="Timing started" onSubmit="(data) => startTiming.execute(data)">
      <FormItem bindTo="number" label="Number" initialValue="n1" required />
      <FormItem bindTo="name" label="Name" required />
    </Form>
    <Table data="{rows}">
      <property name="noDataTemplate">
        <Text value="No timings yet" variant="strong" />
      </property>
      <Column bindTo="number" header="Number" />
      <Column bindTo="name" header="Name" />
      <Column bindTo="time_out" header="Started" />
      <Column bindTo="time_in" header="Finished" />
      <Column bindTo="elapsed" header="Elapsed" />
      <Column header="">
        <Button label="Finished" when="{!$item.time_in}" onClick="finishTiming.execute({number: $item.number})" />
      </Column>
    </Table>
  </PicoTheme>
</Component>
>>
    }
  }

  rule timing_first_use {
    select when timing started or timing finished
    if ent:timings then noop()
    notfired {
      ent:timings := {}
    }
  }

  /**
   * Start a timing. A number that is already in use is ignored.
   * @attr number String "n followed by digits, such as n1"
   * @attr name String "who or what is being timed"
   * @example "first timing" { "number": "n1", "name": "Nick Angell" }
   */
  rule timing_started {
    select when timing started number re#n0*(\d+)#i setting(ordinal_string)
    pre {
      key = "N" + ordinal_string
    }
    if ent:timings >< key then noop()
    notfired {
      ent:timings{key} := {
        "ordinal": ordinal_string.as("Number"),
        "number": event:attr("number"),
        "name": event:attr("name"),
        "time_out": time:now() }
    }
  }

  /**
   * Finish a timing. Later finishes overwrite the finish time.
   * @attr number String "the number the timing was started with"
   * @example "finish" { "number": "n1" }
   */
  rule timing_finished {
    select when timing finished number re#n0*(\d+)#i setting(ordinal_string)
    pre {
      key = "N" + ordinal_string
    }
    if ent:timings >< key then noop()
    fired {
      ent:timings{[key,"time_in"]} := time:now()
    }
  }

  /**
   * Make a channel for one more timekeeper. Delete the channel to revoke access.
   * @attr who String "the timekeeper's name"
   * @example "Ada" { "who": "Ada" }
   */
  rule new_timekeeper {
    select when timing timekeeper_needed who re#(.+)# setting(who)
    ui:create_app_channel(channel_tags.append(who), ["timing"], null, meta:rid)
  }

  rule create_app_channel {
    select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
    ui:create_app_channel(channel_tags, ["timing"], null, meta:rid)
  }
}
```

### The state and the rules

`ent:timings` is a map. Each key is a normalized number such as `N1`, and each value is a map of that timing's data. `entries` returns the values as an array, with `ordinal`, `number`, `name`, `time_out`, and `time_in` in each. It uses `defaultsTo({})`, so a query before anything has been timed returns an empty array instead of failing.

**`timing_first_use`** selects *both* `timing:started` and `timing:finished`. If `ent:timings` already holds something, the rule fires and does nothing (`noop()`). Otherwise the `notfired` postlude initializes it to an empty map. Rules in one ruleset that select the same event run in the order they're written, so this one runs before the other two and they can count on the map being there. (It's belt and braces here, since `entries` already defaults the value, but it's a good habit to have an initializing rule for each entity variable.)

**`timing_started`** selects `timing:started` when the event has a `number` attribute that matches the regular expression `n0*(\d+)` (case-insensitive). That's the letter `n`, any leading zeros, and at least one digit. `setting(ordinal_string)` binds what the parentheses captured, so `n007` gives `"7"`. The prelude builds a normalized key, `"N" + ordinal_string`. Then the condition asks whether `ent:timings` already has that key. If it **doesn't** (`notfired`), the postlude adds the entry with `time:now()` as the start. If it does, nothing happens, which is how a number can't be reused.

**`timing_finished`** selects `timing:finished` with the same pattern and builds the same key. If the timing exists (`fired`), it sets `time_in` with a *path assignment*: `ent:timings{[key,"time_in"]} := time:now()` changes one part of one entry and leaves the rest alone.

A rule with `if X then noop()` runs `fired` when `X` is true and `notfired` when it's false. The two rules use that opposite ways on purpose: `timing_started` acts when the key is *missing*, `timing_finished` when it's *present*.

### The elapsed time

The pico does the arithmetic, not the page. `timings` is a second shared function: the same data sorted newest first, with an `elapsed` string added to each finished timing. `time:strftime(t, "%s")` turns an ISO 8601 time into seconds since 1970, so `elapsed` subtracts two of them and formats the difference. Keeping the logic in KRL means the page only displays strings.

### The view

`timingPage` is tagged `@view "Timing"`, so the engine serves it as a page, and `shares` lists it so it can be queried. It returns one XMLUI `<Component>`. The only KRL inside the heredoc is the `#{…}` helpers from `io.picolabs.xmlui`, which run when the page is generated and return markup:

| In the page | What it does |
|-------------|--------------|
| `ui:query("rows", "timings", {"rid": meta:rid})` | A `DataSource` named `rows` that calls the shared function `timings` on this channel. The `rid` option is needed because inside the helper `meta:rid` would be the helper's own |
| `ui:event("startTiming", "timing", "started", {"refresh": ["rows"]})` | An `APICall` named `startTiming` that sends `timing:started` with the form's fields as attributes, then refetches `rows` |
| `ui:event("finishTiming", "timing", "finished", {"refresh": ["rows"]})` | The same for `timing:finished` |

After that it's XMLUI. The `Form` calls `startTiming.execute(data)` on submit; its `FormItem`s are named `number` and `name`, so those become the event attributes your rule matches. The `Table` shows `rows`. Its last column puts a `Button` in each row, shown `when` the row has no `time_in`, and its `onClick` runs `finishTiming.execute({number: $item.number})`. `$item` is the row. Nothing on the page talks about ECIs or URLs: the shell the engine serves already knows which channel it was opened on.

> **Note:** `#{…}` is for markup and constants only. Never put `ent:` variables or query results inside it. Values that change belong in a `DataSource`, as `rows` does here. [Pico views](/pico-views) explains why, and `krl check` warns when you slip.

Put `<Component …>` on its own line after `<<`, as above. The component name must be the function name with a capital first letter: `timingPage` becomes `TimingPage`.

## The app channel

Look at the last rule:

```krl
rule create_app_channel {
  select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
  ui:create_app_channel(channel_tags, ["timing"], null, meta:rid)
}
```

`wrangler:ruleset_installed` is the first event a ruleset sees, and every ruleset on the pico sees it when *any* ruleset is installed, so the `where` clause selects only your own install. `ui:create_app_channel(tags, domains, queries, app_rid)` makes a channel that:

- allows events only in the `timing` domain
- allows queries on `com.example.timing_tracker` (`null` means every shared function) plus `io.picolabs.xmlui`'s `file`, which the page shell needs
- is tagged `timing` and `app`

Whoever holds that channel can record timings and read them, and nothing else. They can't install a ruleset, create a child, or see another ruleset's state. That policy is what the old lesson did by hand with a "channel for each timekeeper".

### One channel per timekeeper

The old lesson gave every timekeeper a separate channel so you could cut one person off without bothering the others. You can still do that. The rule `new_timekeeper` makes another app channel with the person's name as an extra tag:

```
timing:timekeeper_needed   who=Ada
```

Raise it on the Testing tab. Give each person the page opened on their own channel, and to revoke someone, delete their channel on the **Channels** tab. Their page stops working at once. The others are unaffected.

## Try it

1. Create a child pico on the **About** tab. Call it "Timing".
2. On its **Rulesets** tab, install `io.picolabs.xmlui` from your engine:

   ```
   http://localhost:3000/krl/io.picolabs.xmlui.krl
   ```

   The engine ships this ruleset but doesn't install it anywhere by default. It builds the page shell and the `ui:` helpers.
3. Install `com.example.timing_tracker`. Use the **Browse…** button (as in the [Quickstart](/lessons/quickstart)) or a `file://` URL to your saved file.
4. Click **View** next to the ruleset and choose the channel tagged `timing, app`. The page opens at `/ui/{eci}/com.example.timing_tracker/`.
5. Enter `n1` and a name, click **Timing started**, wait a few seconds, then click **Finished**. The elapsed time appears. Start `n2` and leave it running.
6. Start `n1` again. Nothing changes: the number is taken.

The same events work without the page. This is why a view is a front end and not a different kind of pico:

```sh
curl -X POST "http://localhost:3000/sky/event/<eci>/none/timing/started?number=n3&name=Grace"
curl "http://localhost:3000/sky/query/<eci>/com.example.timing_tracker/entries"
```

Use the ECI of the `timing, app` channel. Reload the page and `n3` is there. On the Testing tab, `timing:started` and `timing:finished` show up as forms, because their rules have documentation comments with `@attr` and `@example`.

If the page can't find something, check the channel's policy first. A view fails closed: a channel that can't call a function doesn't get that page, and a channel that can't send an event can't click that button.

## Exercises

1. Make `timing_finished` ignore a second finish, so the first finish time stays.
2. Add a `timing:cleared` rule that deletes every timing, and a **Clear** button that sends it. Which channel policy does it need?
3. Add a second page, `/summary`, that shows how many timings are finished and how many are running. Read [Pico views](/pico-views) on `@view` paths.

## Views and classic single page applications

Everything a view does, an ordinary web page can do, because everything goes over [Sky](/exp/): `POST /sky/event/{eci}/{eid}/{domain}/{type}` to send an event and `GET /sky/query/{eci}/{rid}/{function}` to ask a question. A page written in Angular, React, or plain HTML and `fetch` that is served from anywhere can use the timing tracker with no change to the ruleset. The old lesson did exactly that and read the ECI from the page's query string. If your front end already exists, or has to run somewhere other than the engine, do that.

Prefer a pico view when the page belongs to the pico: you want to install an app and open it, you want the channel policy to be what limits the page, or you want no other server. The pieces to explore next:

- [Pico views](/pico-views): paths and detail pages, `@component`, themes and settings, OAuth-protected meshes
- [Echo](/cookbook/echo/): events, directives, and an app channel that allows only `echo` events
- [Pico view demos](/cookbook/xmlui/): guestbook, contacts, thermostat, and a view over another pico's data
- [Event Exchange Protocol](/exp/): the HTTP side of events and queries

## Next

[Pico-Based Systems](/lessons/pico-based-systems) shows picos making other picos: the parent and child tree, and how a parent keeps track of its children.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/32640450) (Single Page Application lesson, last edited there 2021-01-07), rewritten for pico views and this engine.</small>
