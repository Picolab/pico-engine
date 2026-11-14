# Pico State

A pico that forgets everything between events isn't much use. This lesson teaches the pico to remember: you'll store a name, store many names in a map, count visits, and clear it all again.

## Objectives

When you finish you will be able to:

- store and read **entity variables** (`ent:`)
- choose between `defaultsTo` and `||` for a missing value
- keep a nested map and update one part of it with a **path assignment**
- write a rule with one action block and a `fired` / `else` postlude
- delete a persistent variable with `clear`
- inspect a pico's state while you work

**Before you begin**, finish [Events and Queries](/lessons/events-and-queries). Make a new child pico for this lesson, so the ruleset below doesn't collide with the Quickstart's `io.picolabs.hello_world`. The Testing tab's default `self` channel allows everything, so you don't need a channel of your own. If you want to use `curl`, make a channel whose policies allow `hello` events (`{"allow": [{"domain": "hello", "name": "*"}], "deny": []}`) and this ruleset's queries (`{"allow": [{"rid": "io.picolabs.hello_world", "name": "*"}], "deny": []}`).

## Persistent variables

A KRL declaration like `x = 5` isn't an assignment, and it lives only as long as the rule evaluation. To remember something, use a **persistent variable**. There are two kinds:

- **Entity variables** (`ent:`) belong to one pico. The same ruleset running on two picos has two separate `ent:name`. They're how a pico has state.
- **Application variables** (`app:`) belong to the ruleset itself and are shared by every pico that has it installed. They're rarely what you want.

Entity variables:

- survive restarts and updates to the ruleset
- are private to the ruleset that uses them, on that pico. Other rulesets can't read your `ent:name`; they ask your ruleset through a shared function
- are **read** in any expression: a prelude, a condition, or a function
- are **written** only in a rule's **postlude**, the `fired`, `notfired`, `always`, or `else` block after the action
- are limited to about 1 MB each, and come back as copies: you can't hold a reference and change it. Large structures are slow to rewrite

Reading a variable that was never set gives `null`.

The [Persistent Variables](/krl/persistent-variables/) section of the KRL manual has the full story.

## Store a name

Start with the smallest case: one pico, one remembered name. Save this ruleset in a file, `hello_world_state.krl`, and install it on the new pico from a `file://` URL (so that flush rereads your file; see the [Quickstart](/lessons/quickstart)). It keeps the rid `io.picolabs.hello_world`, and you'll change this one file as the lesson goes on, flushing after each change:

```krl
ruleset io.picolabs.hello_world {
  meta {
    name "Hello World"
    author "Phil Windley"
    shares hello, name
  }
  global {
    hello = function(obj) {
      "Hello " + obj
    }
    name = function() {
      ent:name.defaultsTo("Monkey")
    }
  }
  rule store_name {
    select when hello name name re#(.*)# setting(new_name)
    send_directive("store_name", {"name": new_name})
    always {
      ent:name := new_name
    }
  }
}
```

Then:

1. Query `name`. The pico hasn't stored anything, so `ent:name` is `null` and `defaultsTo` supplies `"Monkey"`.
2. Send the event `hello:name` with attribute `name` set to `Ada`. The rule answers with a `store_name` directive.
3. Query `name` again. It's `"Ada"`.
4. Restart the engine (stop it with Control-C and start it again) and query `name`. It's still `"Ada"`. That's what "persistent" means.

The pieces:

- `select when hello name name re#(.*)# setting(new_name)` selects `hello:name` events whose `name` attribute matches the regular expression, and `setting` gives the captured text a name. The domain is `hello`, the type is `name`, and `name` is the attribute.
- The rule has one action, `send_directive`. Anything after the action runs in the **postlude**.
- `always { … }` runs whether or not an action ran. `ent:name := new_name` is the only place the variable changes.

Notice that the function `name` and the event attribute `name` share a word and nothing else. Names in KRL live in different places: [What's in a name?](/developing/names-and-scope) explains the one case where that bites.

You can check any entity variable without writing a query. On the **Testing** tab, pick the ruleset, find the **KRL console**, enter `ent:name`, and click **Evaluate**. It evaluates the expression inside that ruleset on that pico.

## defaultsTo and ||

Two ways to say "this, or if it's missing, that":

```krl
ent:name.defaultsTo("Monkey")
ent:name || "Monkey"
```

They differ in what counts as missing:

| Expression | `ent:name` is `null` | `ent:name` is `""` | `ent:name` is `0` or `false` |
|---|---|---|---|
| `ent:name.defaultsTo("Monkey")` | `"Monkey"` | `""` | `0` / `false` |
| `ent:name \|\| "Monkey"` | `"Monkey"` | `"Monkey"` | `"Monkey"` |

`defaultsTo` replaces only `null`. `||` replaces anything false: `null`, the empty string, `0`, and `false`.

Try it. Send `hello:name` with `name` set to nothing at all (`...?name=`). The regular expression `(.*)` accepts an empty string, so the pico stores `""`. Query `name`:

- with `defaultsTo`, the answer is `""`. The stored empty string is a value.
- change the function to `ent:name || "Monkey"` and flush: the answer is `"Monkey"`.

Which is right depends on what the value means. For text where an empty string means "not set", use `||`. For counts, flags, and anywhere `0` or `false` is a real value, use `defaultsTo`. `ent:count || 5` can never give `0`. This is also the idiom for event attributes: `event:attr("name") || ent:name` falls back for a missing or empty attribute. See [event attributes](/krl/rulesets/rules/prelude/event-attributes).

## Many names: a map

One name isn't enough. To remember a name for each person, give each one an id and keep a map: `ent:users` maps an id to what we know about that person.

```json
{
  "1": {"name": {"first": "Ada", "last": "Lovelace"}, "visits": 2},
  "2": {"name": {"first": "Grace", "last": "Hopper"}}
}
```

To write inside the map, use a **path assignment**. The path is a list of keys, in `{[ … ]}` after the variable:

```krl
ent:users{[id, "name", "first"]} := first
```

That sets `first` under `id`, then `"name"`, then `"first"`. If `ent:users` or the maps along the path don't exist, they're created. You can read with the same path: `ent:users{[id, "name", "first"]}`. For one level, `ent:users{id}` works. For deeper keys, put them all in one list, and don't chain (`ent:users{id}{"name"}` isn't valid on the left of an assignment).

> **Older style:** you'll see `ent:users := ent:users.put([id, "name", "first"], first)` in older rulesets. It still works, but it reads the whole map, copies it, and writes it back. Prefer the path assignment.

## The full ruleset

Here's the whole ruleset, with names, visit counts, and a way to start over. Replace the contents of `hello_world_state.krl` with this one, and flush the ruleset:

```krl
ruleset io.picolabs.hello_world {
  meta {
    name "Hello World"
    author "Phil Windley"
    shares hello, name, users, visits
  }
  global {
    hello = function(obj) {
      "Hello " + obj
    }
    users = function() {
      ent:users.defaultsTo({})
    }
    name = function(id) {
      first = ent:users{[id, "name", "first"]}.defaultsTo("HAL")
      last = ent:users{[id, "name", "last"]}.defaultsTo("9000")
      first + " " + last
    }
    visits = function(id) {
      ent:users{[id, "visits"]}.defaultsTo(0)
    }
  }
  rule store_name {
    select when hello name
    pre {
      id = event:attr("id")
      first = event:attr("first")
      last = event:attr("last")
    }
    if id && first && last then send_directive("store_name", {"id": id, "name": first + " " + last})
    fired {
      ent:users{[id, "name", "first"]} := first
      ent:users{[id, "name", "last"]} := last
    }
    else {
      error warn <<store_name needs id, first, and last>>
    }
  }
  rule visit {
    select when hello visit
    pre {
      id = event:attr("id")
    }
    if id then send_directive("hello", {"something": hello(name(id))})
    fired {
      ent:users{[id, "visits"]} := visits(id) + 1
    }
    else {
      error warn <<visit needs an id>>
    }
  }
  rule clear_names {
    select when hello clear_names
    always {
      clear ent:users
    }
  }
}
```

Walk through what's new.

**`if … then action`.** A rule runs one action block, here the single `send_directive`, only when the condition is true. The condition `id && first && last` is false if any attribute is missing. `fired` runs when the condition was true and the action ran. `else` runs when it wasn't, here to log a warning: `error warn` raises a `system:error` event you can see in the Logging tab, and it doesn't stop anything else. If you had two things to do, use an `every { … }` block, not two `if … then` blocks.

**`pre`** declares `id`, `first`, and `last` once for the rule. You can't redeclare them.

**Functions read, rules write.** `users`, `name`, and `visits` read state with `defaultsTo`. Because `name(id)` falls back to `"HAL 9000"`, an unknown id doesn't produce an error. `visit` writes the visit count, but only in its postlude.

**`clear ent:users`** deletes the variable entirely. Afterward `ent:users` is `null` again, and `users()` shows `{}`. You could also assign an empty map, `ent:users := {}`, which keeps the variable but with nothing in it.

Now play with it from the Testing tab (or from `curl`, with the URLs from the last lesson):

1. Send `hello:name` with `id` `1`, `first` `Ada`, `last` `Lovelace`.
2. Send `hello:name` with `id` `2` and only `first`: the warning shows in the Logging tab and nothing is stored. The condition was false, so `else` ran.
3. Query `name` with `id` `1`: `"Ada Lovelace"`. With `id` `9`: `"HAL 9000"`.
4. Send `hello:visit` with `id` `1` twice. The directive says `Hello Ada Lovelace`. Query `visits` with `id` `1`: `2`.
5. Query `users`: `{"1": {"name": {"first": "Ada", "last": "Lovelace"}, "visits": 2}}`.
6. Send `hello:clear_names`. Query `users`: `{}`. The visit count went too, because it lives in the same map.

Over HTTP the same steps look like this:

```sh
curl -X POST "http://localhost:3000/sky/event/<eci>/none/hello/name?id=1&first=Ada&last=Lovelace"
curl -X POST "http://localhost:3000/sky/event/<eci>/none/hello/visit?id=1"
curl "http://localhost:3000/sky/query/<eci>/io.picolabs.hello_world/visits?id=1"
curl "http://localhost:3000/sky/query/<eci>/io.picolabs.hello_world/users"
```

Check the channel's policy: it has to allow `hello` events and the functions you query.

Entity variables are per pico. Make a second pico, install the same ruleset on it, and query `users`. It's empty: the first pico's names are in the first pico.

## Exercises

1. **A greeting that remembers.** Add a rule that answers `hello:greet` with `Hello` and the name stored by the first, single-name version of this ruleset. Store with `ent:name`, and use `||` so an empty name falls back to `"Monkey"`.
2. **Last seen.** Record the time of each visit with `ent:users{[id, "last_visit"]} := time:now()`, and add a function that returns it. (`time:now()` is in the [time library](/krl/libraries/time).)
3. **Forget one.** Add a rule that selects `hello:forget` and removes just one id. A path assignment can set the visit count to `0` or a name to an empty string. To remove the whole entry, assign the map without it: `ent:users := ent:users.delete([id])`. Compare the two.
4. **Total visits.** Add a function, `total_visits`, that adds up every user's visits. You'll want `users().values()` (the [map operators](/krl/krl-expression-language/operators/map-operators)) and `reduce`. Use `defaultsTo(0)` for users who have never visited.
5. **A guard.** Make `visit` refuse an unknown id: do nothing, and log a warning, unless `ent:users{id}` exists. Where does the check go: the condition, the `pre`, or the postlude?
6. **A counter that can be zero.** Write `starting = ent:count || 5` for a counter, then store `0` in `ent:count`. What does `starting` give, and why? Fix it.

## What you learned

- `ent:` variables are a pico's memory: per pico, persistent, read anywhere, written only in the postlude.
- `defaultsTo` replaces `null`; `||` replaces anything false.
- `ent:users{[id, "name", "first"]} := first` updates one part of a nested map. `put` still works, but path assignment is the modern way.
- A rule has one action block. `fired` runs when it ran, `else` when the condition was false, `always` either way.
- `clear ent:x` deletes a variable.

## Next

[Modules and External APIs](/lessons/modules-and-apis) shows how to share code between rulesets and talk to services on the web. The [Score tracker](/cookbook/score_tracker/) demo is a small app built on this kind of state: a contest pico that keeps a leaderboard in entity variables.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/20742148/Pico+State+Lesson) (last edited there 2021-02-18), and updated for this engine.</small>
