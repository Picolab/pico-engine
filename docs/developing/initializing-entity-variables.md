# Initializing entity variables

Each ruleset installed in a pico gives the pico its own entity variables, specific to that pico and that ruleset. Until a rule's postlude first assigns one, its value is `null`. There are three ways to deal with that.

## Use `defaultsTo` wherever you read it

`defaultsTo` supplies a value when the variable is `null`. Suppose `ent:owners` will be a map but might not exist yet:

```krl
nameExists = function(ownername) {
  ent:owners.defaultsTo({}) >< ownername
}
```

The first time the map is stored, start from the same default:

```krl
rule owner_token {
  select when owner token_created
  pre {
    name = event:attr("name")
    new_owner = event:attr("owner")
  }
  fired {
    ent:owners := ent:owners.defaultsTo({}).put(name, new_owner)
  }
}
```

With this technique, every use of `ent:owners` in the ruleset needs `defaultsTo`. A shared function that returns `ent:owners.defaultsTo({})` keeps that in one place.

## Initialize it in a guard rule

Put a rule before the others that select the same event, and have it create the variable when it is missing:

```krl
rule guard_owners_map {
  select when owner token_created
  if ent:owners.isnull() then noop()
  fired {
    ent:owners := {}
  }
}
```

Rules in one ruleset that select the same event run in the order they are written, so this one runs first. The rules after it can then use a path assignment, which is also faster for a large map:

```krl
rule owner_token {
  select when owner token_created
  pre {
    name = event:attr("name")
    new_owner = event:attr("owner")
  }
  fired {
    ent:owners{name} := new_owner
  }
}
```

Functions still need `defaultsTo`, in case a query arrives before any event does.

## Initialize it when the ruleset is installed

A rule that selects the ruleset's own `wrangler:ruleset_installed` runs before anything else can use the ruleset:

```krl
rule initialization {
  select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
  if ent:owners.isnull() then noop()
  fired {
    ent:owners := {}
  }
}
```

The `where` clause matters. Many rulesets are installed in a pico over its life, and without it this rule would run every time. Checking `isnull()` first is good practice too.

Installing again from the same URL, or flushing, does not raise `ruleset_installed` again. A rule like this runs once per install.

See also: [Persistent variables](/krl/persistent-variables/) in the KRL manual, and the [Guard rules](/cookbook/guard_rules/) demo.

*From the Pico Labs KRL Cookbook page "Initializing entity variables".*
