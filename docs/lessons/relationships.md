# Relationships

Not every relationship between picos is parent and child. A flower shop may need a link to a delivery driver so it can broadcast a request and the driver can bid on it, and neither created the other. Many systems are built from peers. This lesson teaches picos to link to one another with **relationships**, and to use the link.

> **Terminology:** What the engine now calls a *relationship* was called a *subscription* before engine 1.6.2. The ideas are the same. The ruleset is still `io.picolabs.subscription`, and the older event names (`wrangler:subscription`, `wrangler:pending_subscription_approval`, …) still work next to the new ones. This lesson uses the new names. See [Relationships](/wrangler/relationships) for the full list.

## Objectives

When you finish you will be able to:

- explain what a relationship is: a named, two-way link with a channel and a role at each end
- say what `Tx`, `Rx`, `Tx_role`, `Rx_role`, and the well-known channel are
- create, approve, and inspect relationships in the developer UI
- create, approve, reject, and cancel relationships from rules
- send an event over a relationship and use it to tell friend from stranger
- say what changes when a relationship uses DIDs instead of a well-known channel

**Before you begin**, finish:

- [Quickstart](/lessons/quickstart): install rulesets
- [Events and Queries](/lessons/events-and-queries): channels, and events raised on them
- [Pico State](/lessons/pico-state): entity variables, simple and complex
- [Pico-Based Systems](/lessons/pico-based-systems): create and delete children, and install rulesets in them (you'll rebuild the registration system from it here)

and read [Relationships](/wrangler/relationships) in the Wrangler documentation.

## Relationships

A relationship has a name and **two channels**, one owned by each pico. Each pico sees it from its own side. In a relationship between picos A and B:

- A's **`Rx`** is the channel on which A *receives* events and queries. It's a channel in A, and its policy decides what B may do. It's B's `Tx`.
- A's **`Tx`** is the channel A *transmits* on, to reach B. It's B's `Rx`.

The two picos see the channels swapped, which is the point: each side keeps its own rules about who can do what to it.

Each end may also have a role. From A's perspective, **`Rx_role`** is A's role, "mine", and **`Tx_role`** is B's, "theirs". From B's perspective they are the other way round. Roles label a relationship (`student`, `section`, `owner`). They prove nothing. What a pico may do is decided by the policy of its `Rx` channel.

The relationship also has an **`Id`**, the same on both ends. It is the one field that is: there's one relationship with two ends, and the rest of its fields swap.

## The experiment

We continue the registration example. The root pico has two children, the **Registration** pico and the **Section Collection** pico. The Section Collection pico has a child pico for each section. Students are children of the Registration pico, and each student will have a relationship with each section they take:

```
 root pico
   ├── Registration pico
   │      └── Student pico (Jane)
   └── Section Collection pico
          ├── Section A HTG 100-1 pico
          └── Section CS462-1 pico
```

Parent-child links are the tree. Relationships are separate lines drawn across it: Jane to a section, and Jane to the Section Collection.

To prepare, (re)build the registration system from [Pico-Based Systems](/lessons/pico-based-systems): install `app_section_collection` in the Section Collection pico and create two sections with `section:needed`. Then create a pico for a student, a child of the root named "Jane", with the About tab. Every pico has `io.picolabs.subscription` installed already, so you needn't install it.

## Create a relationship by hand

To form a relationship, Wrangler makes a new channel in each pico. To get started, it needs a channel that already exists in each one. That's the **well-known channel**.

### Find the well-known channel

Every pico has a **well-known channel**, created by `io.picolabs.subscription` when it's installed. Its policy is deliberately narrow: it accepts only the events that start a relationship (and one that removes an unaccepted request), and it answers a single query, for its own ID. That makes its ECI safe to pass around widely.

Visit a section pico and open its **Relationships** tab. The **Identity** panel shows the well-known channel, `wellKnown_Rx`. Copy it.

### Ask for a relationship

Open Jane's **Relationships** tab and find **New relationship**. Choose the classic (ECI) form and fill it in:

1. `wellKnown_Tx`: paste the section pico's well-known ECI
2. `Rx_role`: this pico's role: `student`
3. `Tx_role`: the other pico's role: `class`
4. `name`: a name for the relationship, such as `Jane-A HTG 100-1`
5. Leave the `channel_type` as it is (the default is `Tx_Rx`), and leave the password and host blank. A password is for auto-accept configuration, and the host is for a pico on another engine

Submit the form. It raises `wrangler:relationship` in Jane's pico.

### Look at what happened

On Jane's **Channels** tab there's a new channel for this relationship. It is Jane's `Rx`, and the section's `Tx`. On Jane's **Relationships** tab, the relationship is under **Outbound pending**: proposed to the other pico, not yet accepted.

Visit the section pico. Its **Inbound pending** list has the same relationship. Expand both and compare. `Id` is the same. The roles are swapped and so are `Tx` and `Rx`. Jane doesn't yet have the section's ECI, because the section hasn't accepted.

### Accept it

On the section pico, expand the inbound relationship and click **Approve**. That raises `wrangler:pending_relationship_approval` with the relationship's `Id`. Both sides now show it as **Established**. Jane has the section's channel, and the section has Jane's.

Do it again with Jane and the other section. Jane's established list now has two relationships. Their `Id`s differ.

## Create a relationship from a rule

Everything the UI did, a rule can do, so the system can build itself. The challenge is the starting point: a rule can only use a well-known ECI that it has *found*. Someone must publish it. A natural place is the parent: a new pico tells its parent, and others ask the parent.

### Sections report their well-known channels

Replace `app_section` from the last lesson with this version. Its rule runs when the ruleset is installed, finds the pico's well-known channel, and tells the Section Collection pico:

```krl
ruleset app_section {
  meta {
    name "Section"
    use module io.picolabs.wrangler alias wrangler
    use module io.picolabs.subscription alias relationship
    shares sectionId
  }
  global {
    sectionId = function() {
      ent:section_id
    }
  }

  rule pico_ruleset_added {
    select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
    pre {
      section_id = event:attr("section_id")
      well_known = relationship:wellKnown_Rx(){"id"}
    }
    event:send({
      "eci": wrangler:parent_eci(),
      "domain": "section",
      "type": "identify",
      "attrs": {"section_id": section_id, "wellKnown_eci": well_known}
    })
    always {
      ent:section_id := section_id
    }
  }
}
```

Look at the new parts: the `use module io.picolabs.subscription alias relationship` line gives access to the relationship functions. `relationship:wellKnown_Rx()` returns the well-known channel, a map with an `id`. `event:send` in the action block sends `section:identify` to the parent over the family channel.

Add these rules to `app_section_collection`. The first one stores what sections report:

```krl
rule accept_wellKnown {
  select when section identify
    section_id re#(.+)#
    wellKnown_eci re#(.+)#
    setting(section_id, wellKnown_eci)
  always {
    ent:sections{[section_id, "wellKnown_eci"]} := wellKnown_eci
  }
}

// A student asked for a relationship with this pico: this pico's role is registration.
rule accept_student {
  select when wrangler inbound_pending_relationship_added
    where event:attr("Rx_role") == "registration"
  always {
    raise wrangler event "pending_relationship_approval" attributes event:attrs
  }
}

rule introduce_section_to_student {
  select when section add_request
  pre {
    section_id = event:attr("section_id")
    name = event:attr("name")
  }
  event:send({
    "eci": ent:sections{[section_id, "wellKnown_eci"]},
    "domain": "wrangler",
    "type": "relationship",
    "attrs": {
      "wellKnown_Tx": event:attr("wellKnown_Tx"),
      "Rx_role": "section",
      "Tx_role": "student",
      "name": name + "-" + section_id,
      "section_id": section_id
    }
  })
}
```

After a few sections have reported, `sections()` returns more than it did, because each entry now has the section's well-known ECI beside its family `eci`:

```json
{
  "CS462-1": { "eci": "cm0a8w4ks0004m8ys0p1e5k2r", "wellKnown_eci": "cm0a8w4ls0007m8ys6bd2f5h3" },
  "A HTG 100-1": { "eci": "cm0a8w9sd0008m8ysg2l73c1d", "wellKnown_eci": "cm0a8w9tc000bm8ysd4w9j8e1" }
}
```

Any section ID can now be turned into a well-known ECI by asking the Section Collection pico.

The Registration pico has to know the Section Collection pico's well-known channel too. To keep this lesson short, do that by hand: copy it from the Section Collection pico's Relationships tab, and send `registration:collection_known` with the `wellKnown_Rx` attribute to the Registration pico on its Testing tab. (Making the collection report it, like the sections do, is an exercise.)

### The Registration pico makes students

Here is `app_registration`. When a student arrives, it creates a child pico for them. When the child has finished setting up, it installs `app_student` and passes along the student's name and the collection's well-known channel:

```krl
ruleset app_registration {
  meta {
    use module io.picolabs.wrangler alias wrangler
    shares collection
  }
  global {
    collection = function() {
      ent:collectionWellKnown
    }
  }

  rule collection_known {
    select when registration collection_known wellKnown_Rx re#(.+)# setting(well_known)
    always {
      ent:collectionWellKnown := well_known
    }
  }

  rule allow_student_to_register {
    select when student arrives name re#(.+)# setting(name)
    always {
      raise wrangler event "new_child_request" attributes {
        "name": name,
        "backgroundColor": event:attr("backgroundColor") || "#CCCCCC",
        "student_name": name
      }
    }
  }

  rule install_student_ruleset {
    select when wrangler child_initialized where event:attr("student_name")
    event:send({
      "eci": event:attr("eci"),
      "domain": "wrangler",
      "type": "install_ruleset_request",
      "attrs": {
        "absoluteURL": meta:rulesetURI,
        "rid": "app_student",
        "student_name": event:attr("student_name"),
        "collection_wellKnown": ent:collectionWellKnown
      }
    })
  }
}
```

This is the same create-then-install chain as in [Pico-Based Systems](/lessons/pico-based-systems): `new_child_request`, then `child_initialized`, then `install_ruleset_request`. Install `app_registration` in the Registration pico, with `app_student` in the same folder. Send `registration:collection_known` first, so there's a well-known channel to pass on, and then `student:arrives` with `name=Jane` on its Testing tab.

### The student asks the collection for a relationship

Now `app_student`, in full. Each rule is explained below, but read the first two now:

```krl
ruleset app_student {
  meta {
    use module io.picolabs.wrangler alias wrangler
    use module io.picolabs.subscription alias relationship
    shares classes
  }
  global {
    classes = function() {
      ent:classes.defaultsTo({}).values()
    }
  }

  rule capture_initial_state {
    select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
    always {
      ent:name := event:attr("student_name")
      ent:collectionWellKnown := event:attr("collection_wellKnown")
      raise student event "new_relationship_request"
    }
  }

  rule make_a_relationship {
    select when student new_relationship_request
    always {
      raise wrangler event "relationship" attributes {
        "wellKnown_Tx": ent:collectionWellKnown,
        "Rx_role": "student",
        "Tx_role": "registration",
        "name": ent:name + "-registration"
      }
    }
  }

  rule add_a_class {
    select when section add_request section_id re#(.+)# setting(section_id)
    pre {
      already_enrolled = classes() >< section_id
      registration = relationship:established("Tx_role", "registration").head()
    }
    if not already_enrolled && registration then
      event:send({
        "sub": registration,
        "domain": "section",
        "type": "add_request",
        "attrs": {
          "wellKnown_Tx": relationship:wellKnown_Rx(){"id"},
          "section_id": section_id,
          "name": ent:name
        }
      })
  }

  rule auto_accept_section {
    select when wrangler inbound_pending_relationship_added
      Rx_role re#^student$#
      Tx_role re#^section$#
    pre {
      section_id = event:attr("section_id")
    }
    if section_id then noop()
    fired {
      ent:classes{event:attr("Id")} := section_id
      raise wrangler event "pending_relationship_approval" attributes event:attrs
      last
    }
  }

  rule reject_everything_else {
    select when wrangler inbound_pending_relationship_added
    always {
      raise wrangler event "inbound_rejection" attributes event:attrs
    }
  }

  rule drop_a_class {
    select when section drop_request section_id re#(.+)# setting(section_id)
    pre {
      rel_id = ent:classes.defaultsTo({})
        .filter(function(v) { v == section_id })
        .keys()
        .head()
    }
    if rel_id then noop()
    fired {
      clear ent:classes{rel_id}
      raise wrangler event "relationship_cancellation" attributes {"Id": rel_id}
    }
  }
}
```

`capture_initial_state` runs when `app_student` is installed in the new pico. It stores what it was given, and raises `student:new_relationship_request`. It's a separate rule so we can raise that event again whenever we need another relationship. `make_a_relationship` raises `wrangler:relationship` with the collection's `wellKnown_Tx`, and roles: this pico is a `student`, the other a `registration`. It's what you did in the UI with the form.

Note what it sends to whom. The student asks the Section Collection pico, and that pico's `accept_student` rule (above) approves any request in which its own role is `registration`:

```krl
rule accept_student {
  select when wrangler inbound_pending_relationship_added
    where event:attr("Rx_role") == "registration"
  always {
    raise wrangler event "pending_relationship_approval" attributes event:attrs
  }
}
```

When a relationship arrives, Wrangler raises `wrangler:inbound_pending_relationship_added` with the attributes of the request, seen from the receiver's side: `Rx_role` is the receiver's own role. The rule approves by raising `wrangler:pending_relationship_approval` with the same attributes (which include `Id`). That's the programmatic version of clicking **Approve**.

Don't approve everyone. This rule only accepts the request when its `Rx_role` is `registration`; anything else is left pending. For something more general, see [Accepting relationship requests](/developing/accepting-relationship-requests) for the auto-accept configuration.

### Add a class: introduce a section

With the relationship between a student and the collection established, a student pico can ask to join a class. The rule `add_a_class` in `app_student`, which you've seen in the listing, sends `section:add_request` over the relationship:

```krl
rule add_a_class {
  select when section add_request section_id re#(.+)# setting(section_id)
  pre {
    already_enrolled = classes() >< section_id
    registration = relationship:established("Tx_role", "registration").head()
  }
  if not already_enrolled && registration then
    event:send({
      "sub": registration,
      "domain": "section",
      "type": "add_request",
      "attrs": {
        "wellKnown_Tx": relationship:wellKnown_Rx(){"id"},
        "section_id": section_id,
        "name": ent:name
      }
    })
}
```

The prelude checks that we aren't enrolled already (`classes()` is a function defined in the ruleset, and shared), and finds the relationship whose other end is a `registration`. `relationship:established("Tx_role", "registration")` returns the established relationships whose `Tx_role` is that. `event:send` with `"sub"` sends over a relationship, here the one with the collection, so the student needs no ECI of its own for the collection. It passes the student's well-known ECI, the section, and the student's name.

The collection pico gets `section:add_request`. Its `introduce_section_to_student` rule (in the listing above) *introduces* the section to the student. It sends a `wrangler:relationship` event to the **section's** well-known channel, with the **student's** well-known ECI as `wellKnown_Tx`:

```krl
rule introduce_section_to_student {
  select when section add_request
  pre {
    section_id = event:attr("section_id")
    name = event:attr("name")
  }
  event:send({
    "eci": ent:sections{[section_id, "wellKnown_eci"]},
    "domain": "wrangler",
    "type": "relationship",
    "attrs": {
      "wellKnown_Tx": event:attr("wellKnown_Tx"),
      "Rx_role": "section",
      "Tx_role": "student",
      "name": name + "-" + section_id,
      "section_id": section_id
    }
  })
}
```

This is the same as typing in the section pico's New relationship form, but the collection did it on its behalf. The section pico needs no code for it: `io.picolabs.subscription` handles the event, and the section proposes a relationship to the student, who is sent the `section_id` as well. This is **introduction**: a third pico that knows both well-known channels connects two picos that don't know each other.

### The student accepts a section

Back in `app_student`, these rules see the proposal arrive:

```krl
rule auto_accept_section {
  select when wrangler inbound_pending_relationship_added
    Rx_role re#^student$#
    Tx_role re#^section$#
  pre {
    section_id = event:attr("section_id")
  }
  if section_id then noop()
  fired {
    ent:classes{event:attr("Id")} := section_id
    raise wrangler event "pending_relationship_approval" attributes event:attrs
    last
  }
}

rule reject_everything_else {
  select when wrangler inbound_pending_relationship_added
  always {
    raise wrangler event "inbound_rejection" attributes event:attrs
  }
}
```

The first rule is selected only when `Rx_role` is `student` and `Tx_role` is `section`. If the request carries a `section_id`, the rule records the relationship in `ent:classes`, a map from relationship `Id` to section id, and approves. The relationship is now established at both ends.

`last` ends the processing of this event in this ruleset, and it's essential. Both rules select the same event, and rules run in the order they're written, so the accepting rule must come first. If it fired, the rejecting rule must not run, or the student would approve and reject the same request. A request this ruleset doesn't recognize falls to `reject_everything_else`, which raises `wrangler:inbound_rejection` to refuse it.

### A class list

`ent:classes` maps relationship ids to section ids, so the list of classes is its values:

```krl
classes = function() {
  ent:classes.defaultsTo({}).values()
}
```

The function is shared in `meta`. Try the whole flow: send `section:add_request` with `section_id=CS462-1` to Jane's pico, and check `classes`. Jane's Relationships tab now lists the collection and the section.

Notice that `section:add_request` is used twice: a user sends it to a student pico, and the student pico sends it to the collection pico. The registration application is one application, spread across several rulesets, for several kinds of pico. Events with the same name mean the same thing wherever they go.

## Cancel a relationship

Either pico in an established relationship can end it by raising `wrangler:relationship_cancellation` with the relationship's `Id`. Wrangler removes both ends. This rule, in `app_student`, drops a class:

```krl
rule drop_a_class {
  select when section drop_request section_id re#(.+)# setting(section_id)
  pre {
    rel_id = ent:classes.defaultsTo({})
      .filter(function(v) { v == section_id })
      .keys()
      .head()
  }
  if rel_id then noop()
  fired {
    clear ent:classes{rel_id}
    raise wrangler event "relationship_cancellation" attributes {"Id": rel_id}
  }
}
```

The prelude finds the relationship for that section. `filter` keeps the map entries whose value is the section id, `keys()` turns the remaining map into an array of its keys, and `head()` takes the first, or `null` if there's none. If there is one, the postlude removes it from `ent:classes` and asks Wrangler to cancel. The rule in `io.picolabs.subscription` removes both ends. You can see the same with the **Delete relationship** button in the Relationships tab.

To remove every relationship at once, for example before deleting a pico, raise `wrangler:cancel_subscriptions`.

## Use DIDs instead of a well-known ECI

Everything above is **classic** (ECI-based) relationships, and it's fully supported. Engine 1.6 added **DID-based** relationships, which are what new work should use. A pico has a portable identity, its `did:webvh`, and a relationship between two DID-based picos has its own private pairwise identity, a `did:peer`. DIDs work across meshes and engines without sharing an ECI.

What changes in the code:

| | Classic | DID-based |
|--|---------|-----------|
| What the asker needs to know | The other pico's well-known ECI, `relationship:wellKnown_Rx(){"id"}` | The other pico's DID, `wrangler:myDid()` |
| `wrangler:relationship` attributes | `wellKnown_Tx` | `layer2: true` and `target_did` |
| The established relationship has | `Tx` and `Rx` ECIs | `Tx_did` and `Rx_did` |
| Sending an event | `event:send({"sub": rel, …})` | the same, or `event:send({"did": …, …})` |
| Querying | `relationship:queryOnSub(Id, rid, name, args)` | the same, or `wrangler:picoQuery(did, rid, name, args)` |

In this lesson's application, a section would report `wrangler:myDid()` instead of its well-known channel, and a student asks with `"layer2": true, "target_did": the_did`. Approval, roles, `inbound_pending_relationship_added`, `last`, and cancellation are the same. One thing to know: a pico accepts an introduction by DID from a stranger only if its **public intro** is on. Root picos default to on. Child picos default to off, so a student pico that others will reach by DID has to turn it on (`wrangler:set_public_intro` with `enabled`). See [Relationships](/wrangler/relationships) for the details, and for how a relationship works across engines.

## Where to go next

- [Relationships](/wrangler/relationships): DIDs, public intro, routing, across engines, and the whole API
- [Two picos talking](/cookbook/two_picos/): two picos, a relationship, and queries over it, that you can run in two minutes
- [Accepting relationship requests](/developing/accepting-relationship-requests): auto-accept by configuration
- [Scatter-Gather](/lessons/scatter-gather): what to do once a pico has relationships with many others

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/21659676) (Pico to Pico Subscriptions Lesson, last edited there 2021-03-06), and updated for this engine. "Subscriptions" there are "relationships" here.</small>
