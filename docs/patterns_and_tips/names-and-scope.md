# What's in a name?

KRL keeps many kinds of names apart: the ruleset id, rule names, event domains and types, attribute names, global and local names, function parameters, and directive names. As an exercise, here is a ruleset where every one of them is `name`:

```krl
ruleset name {
  meta {
    shares name
  }
  global {
    /**
     * @param name String
     */
    name = function(name) {
      name.klog("name") => name | "name"
    }
  }
  rule name {
    select when name name
    pre {
      name = event:attr("name").defaultsTo(name(name), "name")
    }
    send_directive("name", {"name": name || "name"})
  }
  rule name_provided {
    select when name name name re#(.+)# setting(name)
    send_directive("name", {"name": name})
  }
}
```

It works. Most of the uses can't collide: an event domain, a rule name, and a directive name live in different places. One line is worth a closer look:

```krl
name = event:attr("name").defaultsTo(name(name), "name")
```

The right-hand side is evaluated before the binding. At that moment `name` is still the global function, so `name(name)` calls the function with itself as the argument, and it returns itself, because a function is truthy. After the line, `name` is bound to the result, and the global function is shadowed for the rest of the rule.

Raise `name:name` with `name` set to `Ada` and both rules answer `{"name": "Ada"}`. Raise it without the attribute and `defaultsTo` uses the function (logging `"name"`). The directive's `name` is then a function, which doesn't survive conversion to JSON, so the reply shows `{}`.

So: a name declared in `pre` hides a global of the same name for the rest of that rule. That is legal, and usually a mistake. And a name in `pre` can't be declared twice. KRL declarations are not assignments.

*From the Pico Labs KRL Cookbook page "What's in a name?".*
