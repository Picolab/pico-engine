# Events and Queries

Picos do two things for the world outside them: they react to **events**, and they answer **queries**. This lesson makes both real. You'll give a pico its own channel, send it events and queries with a browser, `curl`, and the Testing tab, and watch what happens in the Logging tab.

## Objectives

When you finish you will be able to:

- explain the difference between an event and a query, and why picos separate them
- create a channel with tags and a policy
- send an event and a query to a pico over HTTP
- add `klog` to a rule and read the output in the Logging tab
- tell why a request was refused

**Before you begin**, finish the [Quickstart](/lessons/quickstart). You need a running engine and a pico with `io.picolabs.hello_world` installed.

## Motivation: events change things, queries read them

Most web APIs are request-response: you call a function and it returns a value, and who knows what else happened. Picos split that in two:

| | Event | Query |
|--|-------|-------|
| Means | "Something happened. React if you care." | "Tell me something." |
| Changes the pico's state? | May | Never |
| Answered by | Zero, one, or many **rules**, each selecting events by domain and type | One **function** the ruleset lists in `shares` |
| Returns | **Directives** from the rules that ran | The function's return value |

The sender of an event doesn't name a function to run. It reports what happened, and the rules installed on the pico decide whether to react, and how. That lets you add behavior to a pico by installing another ruleset, without changing the sender. A query is a plain read: because it can't change state, it's safe to repeat and to cache. The engine enforces the split: functions can't write persistent state, only rules can.

Both kinds of traffic arrive on a **channel**. For the full model, see the [Event Exchange Protocol](/exp/) and the overview in [Persistent Compute Objects](/pico-overview).

## Channels

A channel is a communication path to one pico, identified by its **ECI** (event channel identifier), a unique string. Anyone who has the ECI and can reach the engine can use the channel, so an ECI works like a key. Each channel has:

- **tags**, a short list of words so you can find the channel later without remembering the ECI
- an **event policy** and a **query policy**, which list the events and queries the channel will accept. Anything not allowed is refused. This is how a pico limits what each party can do.

Your pico already has channels the engine made for it. The developer UI uses one, and the Testing tab sends on it. You'll make a new one for outside callers. The [Managing channels](/wrangler/channels) page has the whole story.

### Create a channel for hello_world

1. Open your pico and click its **Channels** tab.
2. In the **New Channel** form, leave **Channel id (ECI)** blank to let the engine pick one. (You can choose your own, at least 12 characters of letters, digits, hyphen or underscore, but it can't be changed later.)
3. Set **Tags** to `hello, lesson`.
4. Set **Event Policy** to:

   ```json
   {
     "allow": [{"domain": "echo", "name": "hello"}],
     "deny": []
   }
   ```

5. Set **Query Policy** to:

   ```json
   {
     "allow": [{"rid": "io.picolabs.hello_world", "name": "hello"}],
     "deny": []
   }
   ```

6. Click **Add**. The new channel appears in the list, with its ECI. Copy it.

The policy says this channel accepts one event, `echo:hello`, and one query, the `hello` function of `io.picolabs.hello_world`. Use `"*"` to match anything, for instance `{"domain": "echo", "name": "*"}` allows every `echo` event. A rule in `deny` always wins over `allow`.

From here on, `<eci>` means the ECI you copied and `http://localhost:3000` is your engine's address.

## Send an event

The Event API URL is:

```
/sky/event/<eci>/<eid>/<domain>/<type>
```

`<eid>` is an event id you choose, for your own tracing. `none` is common. Attributes go in the query string, or in a POST body as form data or JSON. [Event API](/exp/event) has the details.

From a terminal:

```sh
curl -X POST "http://localhost:3000/sky/event/<eci>/none/echo/hello?name=Ada"
```

or with a JSON body:

```sh
curl -X POST "http://localhost:3000/sky/event/<eci>/none/echo/hello" \
  -H 'content-type: application/json' -d '{"name": "Ada"}'
```

You get JSON back:

```json
{
  "eid": "…",
  "directives": [
    {
      "type": "directive",
      "name": "say",
      "options": {"something": "Hello ADA"},
      "meta": {"rid": "io.picolabs.hello_world", "rule_name": "hello_world", "txnId": "…"}
    }
  ],
  "ruleOutcomes": [
    {"rid": "io.picolabs.hello_world", "rule": "hello_world", "status": "fired"}
  ]
}
```

Those are the **directives** from every rule the event ran. The sender asked nothing of a function: the rule `hello_world` selected the event and answered with `say`.

GET works too, so you can paste the URL in a browser, but **POST is preferred** for events because an event can change state.

Now try the things that should fail:

- Send `echo:goodbye`. The channel's policy doesn't allow it, so you get `{"error":"Error: Not allowed by channel policy"}`. The rule never saw the event.
- Send `echo:hello` with no `name`. The rule runs with its default, and says `Hello WORLD`.

## Send a query

The Query API URL is:

```
/sky/query/<eci>/<rid>/<function>?<arguments>
```

`<rid>` is the ruleset id, and `<function>` has to be listed in that ruleset's `shares`. Arguments are the function's parameters by name:

```sh
curl "http://localhost:3000/sky/query/<eci>/io.picolabs.hello_world/hello?name=Ada"
```

The answer is the return value: `"Hello Ada"`. Leave off `name` and the function's default gives `"Hello world"`. Query details are in [Query API](/exp/query).

> **Note:** Older docs and rulesets show `/sky/cloud/…`. It's a legacy alias for the same handler. Use `/sky/query/…`.

## Use the Testing tab

You can send the same events and queries without typing URLs. Open the pico's **Testing** tab:

1. Pick the **ECI** to send on. The menu lists the pico's channels with their tags, and the tab remembers your choice. It starts on the pico's own `self` channel (its ECI is the pico's id), which allows everything. Pick the channel you just made to see its policy at work.
2. Pick the **Ruleset**, `io.picolabs.hello_world`.
3. The tab builds a form for each event the ruleset's rules select and each query it shares. The forms come from the ruleset's **schema**, which the compiler generates from the code and from the `/** … */` doc comments on rules and functions: the `@attr` and `@param` tags name the inputs, and `@example` supplies presets. Fill in `name`, then send.

The result shows below the forms, and the tab keeps a history of what you sent so you can send it again.

> **Note:** Older rulesets list their events and queries in a global `__testing` map. That's legacy: the engine still understands it for older rulesets, but new rulesets should use doc comments. Rules and functions with no doc comment still appear, with attributes the engine can find in the code, but you won't get descriptions or examples.

## Debug with klog and the Logging tab

`klog` is KRL's print statement. It's a function that returns the value it was applied to, so you can slip it into the middle of an expression:

```krl
my_name = event:attr("name")
            .defaultsTo("world")
            .lc()
            .klog("Here's the name I saw: ")
            .uc()
```

Change the rule in your `hello_world.krl` to look like this, and flush the ruleset (see the Quickstart). The full rule:

```krl
rule hello_world {
  select when echo hello
  pre {
    my_name = event:attr("name")
                .defaultsTo("world")
                .lc()
                .klog("Here's the name I saw: ")
                .uc()
  }
  send_directive("say", {"something": "Hello " + my_name})
}
```

Send `echo:hello` with `name` set to `Ada`. Then open the **Logging** tab. It lists what the pico did, newest first, one transaction for each event or query that arrived. Select the `echo:hello` transaction. The panel shows:

- the channel it arrived on, and the policy decision
- the attributes the event carried
- which rules were selected and which fired
- your `klog` line, `Here's the name I saw: ada`
- the directives that went back
- any events the rules raised

The **Filters** button narrows the list: by ruleset, by `domain:type`, errors only, or transactions that logged `klog`. The tab follows new transactions as they arrive. You'll use it constantly: if a rule didn't run, this is where you find out why. Rules that didn't select an event are shown with their `select` text, so you can see what they were waiting for.

`klog` also works inside a rule's postlude, and KRL has explicit [log statements](/krl/rulesets/rules/postlude/explicit-logging) with levels.

## Exercises

### Beginner

1. Create a new channel (any tags you like, same event and query policy as before). Send an event on it. Do you get the same result? Why or why not?
2. Delete that channel. Resend the event using the deleted ECI. What happens? Why?
3. Send the event `ecco/hello` (note the spelling) to your pico. What do you observe? Why?
4. Add a rule that selects `echo/monkey` and answers `"Hello Monkey"` unless an attribute `name` is given, in which case it answers `"Hello "` plus that name. Hint: `.defaultsTo()`. Use `.klog()` on the value you use.
5. Repeat the previous exercise with the ternary conditional (`=>` / `|`) instead of `.defaultsTo()`.
6. Create a second channel whose query policy allows only `hello` and whose event policy allows nothing (`{"allow": [], "deny": []}`). Show that the query works and the event is refused. Where in the Logging tab do you see the refusal?

### Intermediate

These presume [Pico State](/lessons/pico-state) and [Modules and External APIs](/lessons/modules-and-apis). Come back after those lessons.

1. Write and install a ruleset `track_trips` with a rule `process_trips` that selects `car:new_trip` with attribute `mileage` and answers a directive `trip` with option `trip_length` set to that mileage.
2. Create a pico that represents a car and install `track_trips` on it. Test with and without `mileage`.
3. Tighten the select so the rule only runs when `mileage` is a positive number (hint: the `as` operator).
4. Have `process_trips` raise `explicit:trip_processed` with the same attributes (`event:attrs`).
5. Add `find_long_trips` on `explicit:trip_processed`: if `mileage` is greater than a global `long_trip`, raise `explicit:found_long_trip`.
6. Add `trip_fuel_usage` on `explicit:trip_processed` that uses a vehicle-info function from your Modules lesson and the mileage to estimate gallons used, and returns that in a directive.
7. Use the Logging tab to convince yourself the cascade runs.

## What you learned

- Events report that something happened. Rules select them by domain and type, and answer with directives.
- Queries read state with no side effects, by calling a function listed in `shares`.
- Channels carry both, and a channel's policy decides what it accepts. Tags help you find channels.
- URLs: `/sky/event/<eci>/<eid>/<domain>/<type>` and `/sky/query/<eci>/<rid>/<function>`.
- The Testing tab builds forms from the schema; the Logging tab and `klog` show what happened.

## Next

[Pico State](/lessons/pico-state) adds memory: a pico that remembers the names it's been told. For a runnable relative of this lesson, see the [Echo demo](/cookbook/echo/), and for more on how apps make channels for themselves, [Bootstrap and channels](/cookbook/bootstrap/).

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/19791904/Events+and+Queries+Lesson) (last edited there 2021-02-02), and updated for this engine.</small>
