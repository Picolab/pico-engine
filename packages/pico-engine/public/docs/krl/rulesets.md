# KRL Rulesets

A ruleset is the primary means of program organization in KRL. A ruleset is a collection of rules. Each rule is designed to respond to a specific event.

Each ruleset can have the following sections.

- `meta`
- `global`
- `rule`(s)

```
ruleset <rid> {
    version <string>
    meta {
        <configuration>
    }
    global {
        <global declarations>
    }
    rule one {
        ...
    }
    rule two {
        ...
    }
    ...
}
```


## meta

The meta section stores information about a ruleset. Meta sections are optional and may be empty.

The following are allowed in a meta section:

### version

Rulesets are versioned. Version strings follow [Semantic Versioning](https://semver.org/). i.e `1.2.3` where `<major>.<minor>.<patch>`.

During development you can set the version to `"draft"` or omit it completely. This way you can make frequent changes and see them reflected immediately on the picos that use the "draft" version.


TODO

## global

TODO

## rule

TODO

### select

Select statements are the initial condition on whether or not to run a rule.

There are 2 variants of select

- `select when <event-expression>`
- `select where <expression>`

#### select when

TODO

#### select where

The rule will select when the `<expression>` evaluates truthy.

### prelude

TODO

### action

TODO

### postlude

TODO
