# KRL misconceptions and common errors

KRL is the programming language for picos. It's a notation for how a pico reacts to events and how it answers queries. This page collects the places where habits from other languages mislead, and the small mistakes that are hard to see. Skim the headings first: most readers recognize their own bug.

## KRL is not JavaScript

KRL's syntax looks like JavaScript's: braces, arithmetic and Boolean expressions, things that look like assignment, function definitions and calls, `if`. There is no `for` or `while`, and there are constructs JavaScript doesn't have, such as `select when`, `foreach`, and `defaction`.

It has a different execution model and a different memory model. KRL compiles to JavaScript, and the engine is a Node.js program, but a ruleset isn't a program that runs. It's a set of rules that a pico evaluates in reaction to events. The unit of compilation is the ruleset. Rule names must be unique within it, and the *order* the rules are written in matters. Its `global` block can define functions, which evaluate in the context of the ruleset and the pico they're installed in.

## Common misconceptions

### Request/response vs. event/action and query/response

If you know HTTP programming, you may think of a pico as a resource. With REST, a GET shouldn't change the resource and a POST or PUT often does. With picos:

- A **query** can never change the pico. It calls a function the ruleset lists in `shares` and returns the value, given the current state. Functions can't change state, and an HTTP POST isn't allowed in one. (KRL does let a function make a synchronous HTTP GET to use outside information, and a poorly designed resource may change in response to a GET, but that is the outside world's problem.)
- Only an **event** can change a pico. Rules react by (conditionally) taking actions on the outside world and by changing entity variables in the postlude, and they can raise more events to the same pico.

Think of a pico as a state machine: queries tell you what state it's in; events (maybe) change it.

Queries are `GET`s to `/sky/query/<eci>/<rid>/<function>?…` and events are `POST`s (or `GET`s) to `/sky/event/<eci>/<eid>/<domain>/<type>`. The first path component is the giveaway. The event URL names the pico, the domain, and the type, but **not a ruleset**: every installed ruleset with a salient rule gets a chance. A query names the ruleset and function, and only that one answers. See the [Event API](/exp/event), the [Query API](/exp/query), and [Event Loop Introduction](/developing/event-loop).

The response to an event isn't produced until the whole cycle, including the rules that events raised along the way scheduled, has finished. Actions on the outside world happen as the rules evaluate, not at the end.

### Name binding is not variable assignment

Most languages have an assignment that replaces the value at an address. KRL has two different things, and they're written differently.

**Declarations bind a name to a value.** In a `global` or `pre` block, `x = 3` binds the name `x`. The left side is always a plain name. There is no assignment, and the binding is in force from that point on: through the rest of the `global` block and the rules, or through the rest of the rule. Names are also bound by `setting(...)` in an event expression, by an action, and by `foreach`.

Don't declare a name twice. A second declaration doesn't change the first. It shadows it, and functions that closed over the first still see the first. The compiler warns about a duplicate declaration, so take notice of that.

```krl
pre {
  x = 3
  y = function(a){ x + a }
  x = 5          // shadows, doesn't change; y(6) is still 9
}
```

Rather than "refining" a binding, give each step its own name. See [Declaration Semantics](/krl/rulesets/rules/prelude/declarations/declaration-semantics).

**Entity variable assignment** changes pico state. It uses `:=`, only in a rule's postlude, so only events can change state:

```krl
fired {
  ent:count := ent:count.defaultsTo(0) + 1;
  ent:rooms{[room, "temp"]} := temp      // path assignment for a nested key
}
```

Use the *composite path* form, `ent:m{[a, "b"]} := v`, to set a nested key. Chained braces (`ent:m{a}{"b"} := v`) don't parse as an assignment target, and building a new map with `put` and assigning the whole thing back is more work and slower for large values.

Each pico keeps its own state: the entity variables of each ruleset installed in it, which persist.

### Operators produce new values

KRL's operators never change a structure in place. They return a new one. A line like this

```krl
temp = ent:var
temp[1].put("b", temp[1]{"b"} + 1)   // computes a new map; changes neither temp nor ent:var
```

computes a new value and then throws it away, because nothing receives it. Even if you used it, the result would be only the changed *part*, not the whole structure. To change state, assign the new whole value, or a path, in a postlude:

```krl
fired {
  ent:counts{[room, "n"]} := ent:counts{[room, "n"]}.defaultsTo(0) + 1
}
```

### Order of rule evaluation

When an event arrives, the engine builds a **schedule** of the rules salient for it. Rules in one ruleset are in the order they're written. Across rulesets the order is undefined. Evaluation then runs down the schedule.

A `raise` in a postlude doesn't run anything. The engine finds the rules salient for the raised event and **appends** them to the end of the schedule. They run after *all* the rules already on it. The lexical order applies each time rules are looked up, once for the arriving event and again for each raised one, so it can produce surprising results.

Here's a real example. A ruleset records temperature readings to a spreadsheet at `ent:url`. To change the URL each month, someone added a rule *before* the recording rule, so it would run first when `wovyn:new_temperature_reading` arrived:

```krl
rule set_up_url {
  select when probe_temp_recorder new_url url re#^(http.*)# setting(url)
  fired {
    ent:url := url;
    ent:urlInEffectSince := time:now()
  }
}
rule check_for_new_month {
  select when wovyn new_temperature_reading
  pre { … }
  if new_month && new_url then noop()
  fired {
    raise probe_temp_recorder event "new_url" attributes { "url": new_url }
  }
}
rule record_probe_temp_to_sheet {
  select when wovyn new_temperature_reading where ent:url
  …
  http:post(ent:url, qs = data) setting(response)
}
```

`set_up_url` is written first, but the schedule for the original event was `check_for_new_month` then `record_probe_temp_to_sheet`. The raised `new_url` event put `set_up_url` at the *end*, so it ran last: the first reading of a new month went to the old URL.

The fix was to do the work directly: put the postlude statements of `set_up_url` in `check_for_new_month`'s postlude instead of raising. It's tempting to avoid the repetition by chaining with `raise`, but that doesn't work when the order matters. If one rule's result must be visible to another rule in the same cycle, do the assignment in the first rule's postlude (rules later in the schedule see it) rather than through a raised event.

### Interference between rulesets

An event goes to *every* installed ruleset with a salient rule. Usually just one ruleset cares, but make sure your rules react only to what they should.

The standard example is `wrangler:ruleset_installed`, raised when a ruleset is installed in a pico. Every installed ruleset sees it, not only the one just installed. The `rids` attribute lists the rulesets that were installed, so guard with it:

```krl
select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
```

Another example is creating a child. A rule that asks wrangler for a child with `raise wrangler event "new_child_request"` gets `wrangler:new_child_created` back, but so does any other rule in any ruleset that selects it, whether or not it asked. Correlate with an attribute that passes through, such as `meta:txnId`, which is unique to this schedule:

```krl
rule make_child {
  select when app new_thing name re#(.+)# setting(name)
  fired {
    raise wrangler event "new_child_request" attributes {
      "name": name, "txn_id": meta:txnId
    }
  }
}

rule child_ready {
  select when wrangler new_child_created where event:attr("txn_id") == meta:txnId
  …
}
```

The second rule only selects when the child it asked for is created, not when someone creates a child by hand in the UI. Wrangler passes the extra attributes of the request along. (Note `meta:txnId` works here because both rules run in the same cycle. If your reply arrives in a later one, which is common with `event:send`, pass a correlation id of your own instead.)

### A rule's name is not its event

The name of a rule is for reference (in logs, for example) and must be unique within a ruleset. The event it listens to is in its `select when`. Rule names are usually verbs and event types usually nouns.

```krl
rule send_twilio_sms_message {
  select when twilio new_sms_message
  …
}
```

This rule is **not** triggered by raising `twilio:send_twilio_sms_message`. That's a common mistake: rules aren't procedures that you call by raising an event named after them. Raise the event the rule selects on, `twilio:new_sms_message`.

When two rules select the same event, both are scheduled, in the order written. That makes this pattern work:

```krl
rule check_for_a_known_number {
  select when twilio new_sms_message
  if ent:known_numbers >< event:attr("to") then noop()
  notfired {
    last
  }
}
rule send_twilio_sms_message {
  select when twilio new_sms_message
  …
}
```

If the number is unknown, `last` in the postlude stops the rest of *this ruleset's* rules for the event. `send_twilio_sms_message` was selected but isn't evaluated. (`last` doesn't affect other rulesets' rules on the schedule.)

### One action block and one postlude

A rule has at most **one** condition, one action block, and one postlude:

```krl
rule name {
  select when domain type
  pre { x = event:attr("x") }
  if cond then every { action1(); action2() }
  fired {
    ent:things{[id, "name"]} := x;
    raise domain event "next" attributes { "x": x }
  }
  else {
    error warn <<skipped: no x>>
  }
}
```

- Several actions go in one `every { … }` block. Don't write two `if … then` blocks, and there's no `else` on the action.
- The postlude is `fired`, `notfired`, or `always`. `fired` and `notfired` take an optional `else` (which runs in the opposite case), and an optional `finally`, which runs either way. Don't write `fired { } notfired { }` as two blocks. `finally` can only come after `fired` or `notfired`. Use `always` when you want something to run whatever happened, with nothing else.
- `event:send` is an action, so it goes in the action block, not in a postlude.
- `if X then noop()` with `fired { … }` runs the postlude when `X` is **true**. Use `notfired` for the other case.

### Strings: double quotes and chevrons

A double-quoted string is a constant. It can't contain line breaks, and the compiler turns it into a JavaScript string.

A chevron-quoted string (`<< … >>`) can contain line breaks and unescaped double quotes. It can also contain **beestings**, `#{expression}`, which are evaluated at run time, so the value can differ each time. When that happens depends on where it appears: in `global`, when the ruleset is installed; in a function, each time it's called; in a prelude, each time the rule selects; in a postlude, each time it runs.

```krl
url = <<#{meta:host}/sky/event/#{eci}/none/byu_hr_login/logout_request>>
```

A beesting can contain a chevron string:

```krl
#{is_self => << title="this is you">> | ""}
```

(or, less readable, `#{is_self => " title=\"this is you\"" | ""}`).

When a chevron string holds markup, put the closing `>>` on its own line, and the opening `<<` too if the first thing is a tag. `>>>` is ambiguous (the compiler sees `>>`, then a stray `>`):

```krl
<<
<option#{e == el => " selected" | ""}>#{e}</option>
>>
```

### KRL isn't Java: `raise` is not a call

A ruleset installed as a module doesn't make an object. The pico pre-existed, and the ruleset's entity variables belong to that pico. Consider a ruleset that offers a "setter" by event:

```krl
ruleset holder {
  meta { provides getter }
  global { getter = function(){ ent:stuff } }
  rule stuffer {
    select when holder setter
    fired {
      ent:stuff := event:attrs{"stuff"};
      raise holder event "stuffed" attributes event:attrs
    }
  }
}
```

and a naive caller:

```krl
ruleset java_pattern {
  meta { use module holder }
  rule checker {
    select when user checker
    pre { value = random:word() }
    fired {
      ent:value := value;
      raise holder event "setter" attributes {"stuff": value}   // schedules the setter, doesn't call it
    }
  }
  rule tester {
    select when user checker
    send_directive("result", {"okay": ent:value == holder:getter()})   // false
  }
}
```

The schedule when `user:checker` arrives is `checker`, then `tester`. `holder:setter` is *appended*, so `tester` runs before `stuffer` does and reports `false`. "Saves it away" should have been read as "schedules it to be saved, later."

The right pattern uses the terminal event the module raises, `holder:stuffed`, which it provides for exactly this purpose:

```krl
rule tester {
  select when holder stuffed
  send_directive("result", {"okay": ent:value == holder:getter()})
}
```

A module that does work in response to events should raise a *terminal* event, one it doesn't react to itself, so callers know when it has finished.

## Common errors

### Regular expression capture groups

`setting` binds to a capture group, which needs parentheses in the regular expression:

```krl
select when phone incoming number re#\d{10}# setting(caller_id)     // caller_id is never bound
select when phone incoming number re#(\d{10})# setting(caller_id)   // right
```

Without the parentheses `caller_id` stays unbound and evaluates to `null` when used.

### Regular expression capture vs. explicit binding

These look equivalent and aren't:

```krl
select when console incoming attr_name re#(.+)# setting(local_name)
```

```krl
select when console incoming
pre { local_name = event:attr("attr_name") }
```

The first only selects when `attr_name` matches. Regular expressions work on a single line, so with a multi-line value, don't count on getting more than the first line. The second binds the whole attribute value, which is also what you want when the value might be empty or absent. Use `event:attr` in the prelude for a multi-line value.

### Forgetting the parentheses on a function call

A function is called with parentheses, even with no arguments: `f()`. Without them, the name evaluates to the function itself, and the errors that follow can be astonishing.

### Dots, colons, and braces

- **Dots** introduce operators: `list.length()`. Don't use a dot to get a map key, as in JavaScript.
- **Colons** separate a module or library name from what it provides: `time:now()`, `ent:name`. A dot in its place gives an unknown operator error.
- **Curly braces** after a map get the value for a key or path: `m{"k"}`, `m{["a","b"]}`.
- **Square brackets** index arrays: `a[0]`.

### A name or a string in a map reference

Inside braces, a quoted key is the literal string; a bare name is the value the name is bound to. It's easy to get this wrong:

```krl
their_key = event:attr("sender_key")
se = ent:se{"their_key"}   // the key "their_key", almost certainly null
se = ent:se{their_key}     // the key the name is bound to
```

The first always gives `null`, and the `http:post` that uses it will always fail.

### The empty string isn't null

A blank form field arrives as the empty string, not as a missing attribute, so `event:attr("name")` is `""`, not `null`. Then:

- `isnull()` is `false`.
- `defaultsTo()` only replaces `null` (or a missing value), so `event:attr("name").defaultsTo(ent:name)` stays empty.

Use `||` when you also want to replace the empty string (and other false values):

```krl
name = event:attr("name") || ent:name
```

Also the string `"null"` is not `null`. `"null".decode()` is `null`, and so is `null.decode()`, so if you're not sure, decode. (`decode` returns a string unchanged if it isn't JSON.)

### Regular expressions and case

A regex is case sensitive unless you flag it:

```krl
"1E4C".match(re#1e4c#)      // false
"1E4C".match(re#1e4c#i)     // true
```

A regex made from a string, `"1e4c".as("RegExp")`, has no way to carry the `i` flag. Change the case of the string you're matching (or the pattern) with `uc()` or `lc()` instead:

```krl
"1E4C".match("1e4c".uc().as("RegExp"))   // true
```

### Operator precedence

Infix operators rarely need parentheses, but sometimes you need them, and the bug is subtle. The conditional (`=>`) binds more loosely than `+`. This conditionally-added part didn't do what was intended:

```krl
html:header("Tic Tac Toe", css)
  + <<<h1>…</h1>
>>
  + board
  + need_detail => << Moves: #{moves.encode()} >> | ""     // wrong: the whole sum is the test
  + js
```

Everything before `=>` was concatenated into the condition. It's a non-empty string, so true, and the result was just the "Moves" part. Parenthesize:

```krl
  + (need_detail => << Moves: #{moves.encode()} >> | "")
```

A conditional inside a beesting is already enclosed, so it doesn't need them.

### Attributes when you generate an event

There are two ways to generate an event from a rule, and each names its attributes differently.

**`event:send`** is an *action* (action block only, no `use module` needed). Its first argument is a map. Keys: `"eci"` (the target channel, usually another pico's), `"domain"`, `"type"` (or `"name"`), optionally `"eid"`, and `"attrs"` (a map of the attributes). The event goes out asynchronously, perhaps to another engine. If the ECI is your own pico's, the event is queued and handled in a later cycle.

**`raise … event … attributes …`** is a postlude statement. The event always goes to *this* pico, and the rules it selects are scheduled in the same cycle, after the ones already scheduled.

It's easy to write `"attributes"` where you mean `"attrs"`, or the other way around. And a key that `event:send` doesn't know is silently ignored, so this sends *no* attributes:

```krl
event:send({
  "eci": eci,
  "domain": "wrangler",
  "type": "ready_for_deletion",
  "co_id": meta:rid        // not a recognized key; ignored
})
```

The attributes belong under `"attrs"`:

```krl
event:send({
  "eci": eci,
  "domain": "wrangler",
  "type": "ready_for_deletion",
  "attrs": { "co_id": meta:rid }
})
```

### An empty array is truthy

KRL follows JavaScript's truthiness rules: `0`, `""`, `false`, and `null` are false, but an empty array is **true**. A test like

```krl
pending => handle_them() | nothing_to_do()   // pending is an array of requests
```

is true even when `pending` is `[]`, so `handle_them()` is chosen when there's nothing to handle. Test the length, since zero is false:

```krl
pending.length() => handle_them() | nothing_to_do()
```

### A domain isn't a ruleset id

An event domain is often similar to a ruleset id, but a ruleset id like `byu.hr.connect` has dots, which a bare event domain can't. So you can't use `meta:rid` where a domain is expected. Spell out the domain (`byu_hr_connect`), or convert: `"byu.hr.connect".replace(re#[.]#g, "_")`.

### Initializing entity variables on install

A rule that gives entity variables initial values when a ruleset is installed needs two guards:

```krl
rule initialize {
  select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
  if ent:apps.isnull() then noop()
  fired {
    ent:apps := built_ins()
  }
}
```

- The `where` clause. Without it the rule selects whenever *any* ruleset is installed in the pico, and resets the variable each time, erasing changes made since.
- The `isnull()` test. It protects against the ruleset being initialized again. A pico's state can accumulate for months, and a reinstall that re-initializes it would throw that away. (Wrangler raises `ruleset_installed` only when the ruleset's id is new on the pico, and a flush doesn't raise it, but the guard is cheap and covers any other path to this rule.)

See [Initializing entity variables](/patterns_and_tips/initializing-entity-variables).

### Regular expressions and multi-line strings

When an event expression captures an attribute value with a regular expression, only a single line of it is matched and kept. For a multi-line attribute, read it with `event:attr` in the prelude instead.

### The ruleset id and the file name

By convention the file is named after the ruleset id, with `.krl` on the end, but nothing enforces it. If you don't follow the convention, know where each is used:

- The **rid** (what's in `ruleset <rid> { … }`, and `meta:rid`) goes in query URLs (`/sky/query/<eci>/<rid>/…`) and in the `rid` attribute of wrangler's install request.
- The **URL** ends with the whole file name, extension included, and is what the `url` attribute of an install request and the flush use.

The engine enforces uniqueness of installed rulesets in a pico by rid, not by URL.

## See also

- [Event Loop Introduction](/developing/event-loop): how the schedule works
- [KRL manual](/krl/): the language reference
- [Guard rules](/cookbook/guard_rules/): demo of the guard patterns here

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/676397057), and updated for this engine.</small>
