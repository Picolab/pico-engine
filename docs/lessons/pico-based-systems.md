# Pico-Based Systems

Solving a problem with picos usually means building a **system** of picos that cooperate. This lesson is about the simplest way picos are related: **parent and child**. You'll create children by hand and from KRL, give each one a ruleset, keep a directory of them, and delete them.

The running example is a class registration system. A *Section Collection* pico keeps one child pico per section of a course. Later lessons add students and connect them to sections.

## Objectives

When you finish you will be able to:

- explain the root pico, parents, children, and family channels
- create and delete child picos in the developer UI
- create and delete children from a rule with `wrangler:new_child_request` and `wrangler:child_deletion_request`
- install a ruleset in a child with `wrangler:install_ruleset_request` and react to `wrangler:ruleset_installed`
- keep a map of section id to the child's ECI, and say why two rules select the same event
- explain why a pico needs no locks
- list children with `wrangler:children()` and query one with `wrangler:picoQuery`

**Before you begin**, finish [Pico State](/lessons/pico-state). It helps to have read [Pico overview](/pico-overview) and the [Wrangler](/wrangler/) page. The [wrangler ruleset](/wrangler/wrangler) documents every event and function used here.

## Children

When your engine starts for the first time it creates one pico, the **root pico**. Every other pico has exactly one **parent**, the pico that created it. A pico can have as many children as it likes, and children can have children, so picos form a tree.

A parent and child are connected by **family channels**: the parent has a channel to the child, and the child has one to the parent. A pico uses the family channel to its parent for `wrangler:parent_eci()`, and a parent's `wrangler:children()` lists the family channel (`eci`) to each child. Only the parent can use its channel to the child, and Wrangler, the "pico operating system" ruleset that comes with every pico, manages both.

## Create children in the UI

Open your root pico and click its **About** tab. Under **Children**, type a name and choose a color, then click the add button. Call the new pico "Registration". The About tab lists the new child with its ECI. Click the link to visit it. Notice that it has a **Parent** link and no children yet.

Create a second child of the root, "Section Collection", with a different color.

Click **Close** to see the layout: two picos connected to the root by their parent-child links. Drag them around. The layout is saved.

## Delete children in the UI

Beside each child on the About tab is a **delete** link. Create a throwaway child inside one of the picos and delete it.

Deleting is permanent. Its channels, rulesets, state, and relationships are gone, and so are any picos below it. A parent is the only pico that can delete a child. The root pico can't be deleted.

## Create children from a rule

Picos create picos. The running example needs two more kinds, one pico for each section and one for each student, and they'll be made on demand. BYU teaches thousands of sections a semester; nobody is going to click add that many times.

We'll write a ruleset for the Section Collection pico. It's a directory: other picos, or the outside world (a class management system, say), tell it that a section needs a pico. It creates the pico and records it. Here's the plan:

```
 root pico
   ├── Registration pico
   └── Section Collection pico
         ├── Section CS462-1 pico
         └── Section CS462-2 pico
```

Create `app_section_collection.krl`. Here is the part that asks for a child:

```krl
rule section_needed {
  select when section needed
  pre {
    section_id = event:attr("section_id")
    exists = ent:sections.defaultsTo({}) >< section_id
  }
  if not exists then noop()
  fired {
    ent:sections{section_id} := {}
    raise wrangler event "new_child_request" attributes {
      "name": nameFromID(section_id),
      "backgroundColor": "#ff69b4",
      "section_id": section_id
    }
  }
}
```

A tour of the rule:

- It's selected by events in the `section` domain of type `needed`.
- The prelude names two values. `section_id` is the event attribute of that name. `exists` is true if `ent:sections` already has that id as a key. `><` is the membership operator, and for a map it tests keys.
- The condition is `not exists`. `noop()` is an action that does nothing, so the rule has a condition to fire on and a postlude to run.
- The postlude runs when the rule fired, that is, when the section is new. It records the section in the map, and raises `wrangler:new_child_request`.

`raise` puts an event on this pico's own queue, and the Wrangler ruleset, which is installed on every pico, handles it. That's the same event the developer UI sends when you click add. Wrangler creates the child, installs the developer UI ruleset and itself in it, and tells your pico when it's done. The `name` and `backgroundColor` are for the UI. Any other attributes, such as `section_id`, are passed along to the new pico and come back to the parent with Wrangler's events, which is how a parent tells its children apart. The function `nameFromID` is in the `global` block:

```krl
nameFromID = function(section_id) {
  "Section " + section_id + " Pico"
}
```

Share it, and `sections` (below), in the `meta` block with `shares`. The full ruleset is at the end of this lesson. Install it in the Section Collection pico on the **Rulesets** tab.

### Make a section pico

On the Section Collection pico's **Testing** tab, `section:needed` appears as a form. (Rules with a documentation comment, `@attr`, and `@example` show up there.) Enter a section id such as `CS462-1` and click the button. Close the pico and its tabs, and a new pink child is there.

### Why two rules?

There are two cases when a section is needed: its pico already exists, or it has to be created. We write a rule for each, and both select `section:needed`:

```krl
rule section_already_exists {
  select when section needed
  pre {
    section_id = event:attr("section_id")
    exists = ent:sections.defaultsTo({}) >< section_id
  }
  if exists then
    send_directive("section_ready", {"section_id": section_id})
}
```

Every rule selected by an event runs, in the order they appear in the ruleset. The `section_needed` rule above does its work only when the section is new, and this one only when it isn't, so exactly one of them acts. Put `section_already_exists` first. If `section_needed` ran first, it would record the new section and `section_already_exists` would then find it and say it was ready.

The directive tells the sender what happened: `section_ready` when there was nothing to do.

### Start from an empty map

`ent:sections` is the map of sections, and it's the directory. To start over, add a rule:

```krl
rule initialize_sections {
  select when section needs_initialization
  always {
    ent:sections := {}
  }
}
```

and share a function that shows it:

```krl
sections = function() {
  ent:sections
}
```

## What about race conditions?

You may have noticed this pattern:

```
exists = ent:sections >< section_id     // is this id in the map?
if not exists                           // if not,
ent:sections{section_id} := {}          //   add it
```

It looks like a critical section that needs a lock. What if two events for the same section arrive at the same moment?

It's taken care of. When an event selects a rule, that rule runs to completion before the pico looks at any other event. The check and the update happen as one atomic step, and only then is the next event taken from the queue. A pico encapsulates its state and also synchronizes access to it. We say picos are **single-threaded**, even though the engine is concurrent: many picos can be handling events at the same time, but no pico handles two at once. Picos need no locks.

One more detail, because the atomic step is one *event*, not a whole *task*. Creating a child takes several events. If the rule only recorded the section when the child appeared, a second `section:needed` for the same id could arrive before that, find nothing, and request a second child. That's why `section_needed` writes `ent:sections{section_id} := {}` at once, as a placeholder, in the same step as the check. The ECI is filled in later.

## Record where each child is

To talk to a section pico, the collection needs its ECI. When Wrangler has created the child, it raises `wrangler:new_child_created` in the parent, with the child's family channel `eci` and its `uiEci`, plus the attributes you passed in. Store the ECI under the section id:

```krl
rule store_new_section {
  select when wrangler new_child_created where event:attr("section_id")
  pre {
    section_id = event:attr("section_id")
  }
  always {
    ent:sections{[section_id, "eci"]} := event:attr("eci")
  }
}
```

The `where` clause makes the rule apply only to children this ruleset asked for. The path assignment `ent:sections{[section_id, "eci"]} := …` sets one part of one entry. `sections()` now looks like this:

```json
{
  "CS462-1": { "eci": "cm0a8w4ks0004m8ys0p1e5k2r" },
  "CS462-2": { "eci": "cm0a8w9sd0008m8ysg2l73c1d" }
}
```

(ECIs vary. Yours will look different.) To clear out earlier experiments, delete the old children on the About tab and raise `section:needs_initialization`.

> **Note:** Don't use the old chained form `ent:sections{section_id}{"eci"} := …`. It doesn't parse. Use a composite path, `ent:sections{[section_id, "eci"]}`.

## List the children

Add `use module io.picolabs.wrangler alias wrangler` to the `meta` block. Then `wrangler:children()` returns an array with one map per child:

```json
[
  { "eci": "cm0a8w4ks0004m8ys0p1e5k2r", "name": "Section CS462-1 Pico", "parent_eci": "..." }
]
```

Wrangler functions are available inside your ruleset after `use module`, but to call one from outside the pico you must wrap it in a shared function:

```krl
showChildren = function() {
  wrangler:children()
}
```

Share it, and the Testing tab shows `showChildren` and `sections` as queries.

## Query a child

You'll often need to ask a child something. In the [Events and Queries](/lessons/events-and-queries) lesson you queried a pico over HTTP. Don't do that from KRL: use `wrangler:picoQuery(eci, rid, name, args)`. On the same engine it calls the other pico directly, and it can use a family channel, which HTTP can't. It returns the function's value, or a map with `error` if the call failed.

```krl
sectionIdOf = function(section_id) {
  eci = ent:sections{[section_id, "eci"]}
  eci => wrangler:picoQuery(eci, "app_section", "sectionId", {}) | null
}
```

This asks a section pico which section it thinks it is, by calling the shared function `sectionId` of the ruleset `app_section`, which we'll write next. In a rule you would check the answer with `if answer{"error"}.isnull() then …`. A pico can't query itself, and a query waits for its answer, so avoid two picos that query each other at the same time. See [Querying another pico](/developing/querying-another-pico).

## Install a ruleset in a child

Why give a section pico any rulesets? A ruleset is behavior. A pico can be a digital twin of something real, here a section of a course, and its ruleset is what it does with events about that section.

Make a ruleset, `app_section.krl`, for the section picos. It can start nearly empty:

```krl
ruleset app_section {
  meta {
    name "Section"
    shares sectionId
  }
  global {
    sectionId = function() {
      ent:section_id
    }
  }
}
```

**By hand.** Visit a section pico's **Rulesets** tab and install it.

**From a rule.** The parent asks the child's Wrangler to install it, by sending the child `wrangler:install_ruleset_request`. Wait until the child has finished setting up: when it has, Wrangler sends the parent `wrangler:child_initialized`, with the child's `eci` and the attributes of your request.

```krl
rule install_section_ruleset {
  select when wrangler child_initialized where event:attr("section_id")
  event:send({
    "eci": event:attr("eci"),
    "domain": "wrangler",
    "type": "install_ruleset_request",
    "attrs": {
      "absoluteURL": meta:rulesetURI,
      "rid": "app_section",
      "section_id": event:attr("section_id")
    }
  })
}
```

`event:send` goes in the action block, never in a postlude. It sends the event to the child pico's channel. There are two ways to say what to install. With `url`, Wrangler installs the KRL at that URL. With `absoluteURL` and `rid`, it installs `<rid>.krl` from the same folder as `absoluteURL`. `meta:rulesetURI` is the URL of the ruleset that's running, so `app_section.krl` has to be in the same folder as `app_section_collection.krl`. This works like a relative URL in a web page: the browser resolves `page2.html` against the page it came from, and Wrangler resolves `app_section` against `meta:rulesetURI`.

Wrangler fetches and compiles the ruleset, installs it, and then raises `wrangler:ruleset_installed` in the **child**, with `rids` (an array holding the installed rid) and the other attributes of the request. So `section_id` is passed through, without Wrangler looking at it. The new ruleset's first event is `ruleset_installed`, and every ruleset on that pico sees it, so select your own with `where event:attr("rids") >< meta:rid`:

```krl
rule pico_ruleset_added {
  select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
  always {
    ent:section_id := event:attr("section_id")
  }
}
```

Add this rule to `app_section`. Now follow `section_id` the whole way: it starts as an attribute of `section:needed`, goes through `new_child_request` to Wrangler, comes back in `child_initialized`, is sent in `install_ruleset_request`, appears in `ruleset_installed`, and ends up in the child's `ent:section_id`. Create a section and check with `sectionIdOf`.

If the ruleset doesn't compile, Wrangler raises `wrangler:ruleset_install_failed` instead, with the compiler's errors. See [The wrangler ruleset](/wrangler/wrangler).

## Delete a child from a rule

When the Section Collection learns that a section has gone off-line, it deletes that section's pico. Only the parent can do it, by raising `wrangler:child_deletion_request` with `eci` set to the family channel of the child, the same value you stored in `ent:sections`:

```krl
rule section_offline {
  select when section offline
  pre {
    section_id = event:attr("section_id")
    eci_to_delete = ent:sections{[section_id, "eci"]}
  }
  if eci_to_delete then
    send_directive("deleting_section", {"section_id": section_id})
  fired {
    raise wrangler event "child_deletion_request" attributes {"eci": eci_to_delete}
    clear ent:sections{section_id}
  }
}
```

The directive is the rule's action, and it only happens if the section exists. The postlude asks Wrangler to delete the pico, and clears the section from the map. Wrangler deletes the child and all its descendants, then raises `wrangler:child_deleted` in the parent with the same attributes, in case another rule wants to know. Try it from the Testing tab with `section:offline`.

> **Note:** The deletion request takes the child's `eci`. An older form of this event took an `id`. It no longer works, and nothing happens if you use it.

A child can also ask for its own deletion by raising `wrangler:ready_for_deletion`. Wrangler passes the request to the parent as a `child_deletion_request`. The [Child pico tasks](/cookbook/child_tasks/) demo does that: each job runs in its own child pico, which reports and then removes itself.

## Put it together

The three steps for a child (create it, install its ruleset, learn when it's ready) can run as a chain with no waiting:

1. Your rule raises `wrangler:new_child_request`.
2. Wrangler raises `wrangler:new_child_created`. You record the child.
3. Wrangler raises `wrangler:child_initialized`. You send `wrangler:install_ruleset_request`.
4. Wrangler in the child raises `wrangler:ruleset_installed`. The child's ruleset starts up, and can tell its parent with an event of its own.

Each step starts the next. Nothing sleeps or polls, and you don't schedule an event to wait for the child.

## The whole ruleset

```krl
ruleset app_section_collection {
  meta {
    name "Section collection"
    description "Creates, tracks, and deletes section picos."
    use module io.picolabs.wrangler alias wrangler
    shares sections, showChildren, sectionIdOf
  }
  global {
    nameFromID = function(section_id) {
      "Section " + section_id + " Pico"
    }

    /**
     * The sections: section_id to { eci }.
     * @returns Map
     */
    sections = function() {
      ent:sections
    }

    /**
     * This pico's children, from Wrangler.
     * @returns Array of { eci, name, parent_eci }
     */
    showChildren = function() {
      wrangler:children()
    }

    /**
     * Ask a section pico which section it believes it is.
     * @param section_id String "a section this pico created"
     */
    sectionIdOf = function(section_id) {
      eci = ent:sections{[section_id, "eci"]}
      eci => wrangler:picoQuery(eci, "app_section", "sectionId", {}) | null
    }
  }

  /**
   * Start over with no sections.
   */
  rule initialize_sections {
    select when section needs_initialization
    always {
      ent:sections := {}
    }
  }

  /**
   * A section pico is needed. If one exists, say so.
   * @attr section_id String "such as CS462-1"
   * @example "CS 462, section 1" { "section_id": "CS462-1" }
   */
  rule section_already_exists {
    select when section needed
    pre {
      section_id = event:attr("section_id")
      exists = ent:sections.defaultsTo({}) >< section_id
    }
    if exists then
      send_directive("section_ready", {"section_id": section_id})
  }

  // Same event, other case: no pico for this section yet.
  rule section_needed {
    select when section needed
    pre {
      section_id = event:attr("section_id")
      exists = ent:sections.defaultsTo({}) >< section_id
    }
    if not exists then noop()
    fired {
      ent:sections{section_id} := {}
      raise wrangler event "new_child_request" attributes {
        "name": nameFromID(section_id),
        "backgroundColor": "#ff69b4",
        "section_id": section_id
      }
    }
  }

  rule store_new_section {
    select when wrangler new_child_created where event:attr("section_id")
    pre {
      section_id = event:attr("section_id")
    }
    always {
      ent:sections{[section_id, "eci"]} := event:attr("eci")
    }
  }

  rule install_section_ruleset {
    select when wrangler child_initialized where event:attr("section_id")
    event:send({
      "eci": event:attr("eci"),
      "domain": "wrangler",
      "type": "install_ruleset_request",
      "attrs": {
        "absoluteURL": meta:rulesetURI,
        "rid": "app_section",
        "section_id": event:attr("section_id")
      }
    })
  }

  /**
   * A section has gone off-line: delete its pico.
   * @attr section_id String "a section this pico created"
   * @example "CS 462, section 1" { "section_id": "CS462-1" }
   */
  rule section_offline {
    select when section offline
    pre {
      section_id = event:attr("section_id")
      eci_to_delete = ent:sections{[section_id, "eci"]}
    }
    if eci_to_delete then
      send_directive("deleting_section", {"section_id": section_id})
    fired {
      raise wrangler event "child_deletion_request" attributes {"eci": eci_to_delete}
      clear ent:sections{section_id}
    }
  }
}
```

## Exercises

1. Make `section_needed` accept a `name` for the section as well, and use it in place of `nameFromID`.
2. When a section pico finishes installing, have `app_section` tell its parent (`wrangler:parent_eci()`) with an event, and have the collection record that the section is ready.
3. Add a function that returns `ent:sections` filtered to the sections whose picos are known (have an `eci`).
4. When `wrangler:child_deleted` arrives, remove any entry with that `eci` from `ent:sections` too, in case a child was deleted in the UI.

## Next

[Relationships](/lessons/relationships) connects picos that aren't parent and child: students to the sections they take. For another parent and child example you can run, see [Child pico tasks](/cookbook/child_tasks/) and [Wrangler](/wrangler/).

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/21168151) (Pico-Based Systems Lesson, last edited there 2021-02-25), and updated for this engine.</small>
