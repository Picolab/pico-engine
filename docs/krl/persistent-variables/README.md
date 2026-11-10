# Persistent Variables

One of the most important issues in creating effective KRL rulesets is remembering information from one user interaction to the next.

KRL [declarations](/krl/rulesets/rules/prelude/declarations/) cannot cause side effects (i.e. they're *not* variable assignments). That doesn't mean KRL rule sets can't cause persistent changes that are available from one rule-set execution to another. KRL has persistent variables that can be used inside any expression in a rule set and can be changed in the postlude.

KRL has two types of persistent variables. (Persistent variables are currently limited to approximately 1MB each.)

- **Entity variables.** These are used to record persistent data about individuals interacting with rules. Entity variables are identified by the namespace `ent`. KRL programs keep each user's persistent entity variables separate. KRL programs are multi-tenanted automatically.
- **Application variables.** These are used to record persistent data about the application or rule set. Application variables are identified by the namespace `app`.

Entity and application variables share the same syntax and operations. They differ primarily in the scope of their definition. An analogy might help: Entity variables are similar to instance variables, and application variables are similar to class variables in object-oriented languages.

> **Persistent Variables are Like Databases:**
>
> You should beware that you don't treat persistent variables the same way you treat regular variables. In particular, take note that persistence implies that the values for persistent variables are stored in a database. You cannot copy a persistent variable by reference, only by value. Use caution when manipulating large data structures in persistent variables since you may end up copying the values multiple times, making your program very slow.

Persistent variables can be numbers, strings, arrays, or maps, and allow operations on those values.

Historically KRL also had special persistent variables that acted as flags, counters, and trails (stacks). These are deprecated and should not be used.

The following section show how persistent variables are used in various parts of a rule.

- [Using Persistents in Preludes](/krl/persistent-variables/using-persistents-in-preludes)
- [Using Persistents in Conditions](/krl/persistent-variables/using-persistents-in-conditions)
- [Mutating Persistents in the Postlude](/krl/persistent-variables/mutating-persistents-in-the-postlude)
- [Querying Persistent Variables](/krl/persistent-variables/querying-persistent-variables)

The power of persistent variables--especially entity variables--should not be understated. Entity variables allow developers to cerate multi-tenanted application without ever having to manage user identity. The system automatically tracks user sessions and ensures that the user's data is available to the ruleset on demand.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189855) (last edited there 2018-02-06).</small>
