# Global Section

A ruleset consists of three main sections, as defined in the KRL [grammar](https://picolabs.atlassian.net/wiki/spaces/docs/pages/223117313/Grammar). In order they are:

1. The `meta` section which gives general information about the ruleset and how it is intended to be used. See the [Meta Section](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189908/Meta+Section) page.
2. The `global` section, described herein.
3. Rules, defined in a lexical order.

The `global` sections consists of a sequence of [declarations](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189835/Declarations). Each declaration binds a globally available name to a value, specified by a KRL expression. The name will be in scope throughout the entire ruleset from the point of declaration on.

The `global` section is evaluated at the moment when the ruleset is installed in a pico. So the expressions can only include things that are available at the time it is evaluated.

In particular, entity variables are *not* available at the point in time when a ruleset is installed in the pico. However, references to entity variables can be wrapped in a `function` or `defaction`. For example:

```
global {
     baseUrl = "https://api.twilio.com/2010-04-01"
     authString = function(){
            {"username": ent:sessionId, "password": ent:apiKey}
     }
     ...
}
...
rule ... {
     ...
     authString()
     ...
}
```

If for any reason, the `global` section of a ruleset you are installing cannot be evaluated, you will received a message like, “Error: Not installed RID” (where “RID” will be the ruleset identifier).

Expressions bound to names in the `global` block can include:

- function definitions
- action definitions
- literals
- names declared earlier
- expressions involving the preceding items

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189936) (last edited there 2021-03-03).</small>
