# Patterns and tips

Short techniques for writing KRL and running picos, checked against the current engine. They come from the Pico Labs KRL Cookbook, which was written for earlier engines. The pages here have been updated where KRL or the engine has changed. For runnable examples, see the [Cookbook](/cookbook/) and the developer UI's **Try It!** tab.

## Working with data

| Page | What it covers |
|------|----------------|
| [Initializing entity variables](/patterns_and_tips/initializing-entity-variables) | `defaultsTo`, a guard rule, or a rule that runs on install |
| [Arrays and maps](/patterns_and_tips/arrays-and-maps) | Loops with `reduce`, flattening, and sorting arrays of maps by one key or two |
| [Decoding form-encoded data](/patterns_and_tips/decoding-form-data) | Turning `a=1&b=2` into a map, keeping repeated names, and decoding `+` and `%xx` |
| [Importing tables and CSV](/patterns_and_tips/tabular-data) | Tab- and comma-separated exports to arrays and maps, fetched with `http:get` |
| [Converting time formats](/patterns_and_tips/converting-time-formats) | RSS (RFC 2822) dates to the RFC 3339 form the time library uses |
| [What's in a name?](/patterns_and_tips/names-and-scope) | KRL's separate kinds of names, and how a `pre` declaration shadows a global |

## HTTP and the outside world

| Page | What it covers |
|------|----------------|
| [Events and queries over HTTP](/patterns_and_tips/events-and-queries-over-http) | Event and query URLs, `curl`, POST bodies, `.txt` and `.html` results, and `_headers` |
| [Cookies and redirects](/patterns_and_tips/cookies-and-redirects) | The `_cookie` and `_redirect` directives, reading cookies, and a URL shortener |
| [Events from email](/patterns_and_tips/events-from-email) | A mail webhook to an event, routing by address, and turning message lines into events |
| [Reading the engine's log files](/patterns_and_tips/engine-log-files) | Where the logs are, how they rotate, and one pico's history with `grep` and `jq` |

## Picos working together

| Page | What it covers |
|------|----------------|
| [Querying another pico](/patterns_and_tips/querying-another-pico) | `wrangler:picoQuery`, which channel to use, why a pico can't query itself, and `http:get` |
| [Accepting relationship requests](/patterns_and_tips/accepting-relationship-requests) | An approving rule, wrangler's auto-accept configuration, and a ruleset that accepts later and removes itself |
| [One pico per resource](/patterns_and_tips/singleton-picos) | Giving a device or account its own pico, so requests can't collide |

## Developing rulesets

| Page | What it covers |
|------|----------------|
| [Hosting and checking rulesets](/patterns_and_tips/hosting-and-checking-rulesets) | `file://`, GitHub raw, and engine URLs; flushing; `krl-check` and a Git pre-commit hook |

## Patterns that became demos

These best practices are now runnable demos in the [Cookbook](/cookbook/):

| Pattern | Demo |
|---------|------|
| Idempotency and guard rules; authorize, then use | [Guard rules](/cookbook/guard_rules/) |
| Splitting rules for clarity and extensibility; layering functionality with rulesets; semantic translation (eavesdropping on events) | [Layered rulesets](/cookbook/layered_rulesets/) |
| Collection picos | [Collection](/cookbook/collection/) |
| Access tokens and other secrets; keeping keys safe | [Configuration and secrets](/cookbook/secrets/) |
| Installing a multi-ruleset application; creating a channel for a ruleset; keeping channels clean | [Bootstrap and channels](/cookbook/bootstrap/) |
| An echo server | [Echo](/cookbook/echo/) |
| A score tracker | [Score tracker](/cookbook/score_tracker/) |
| A child pico for an asynchronous task | [Child pico tasks](/cookbook/child_tasks/) |
| Automatic replies to relationship requests; querying over a relationship | [Two picos talking](/cookbook/two_picos/) |
| An event hierarchy across rulesets | [KBlog](/cookbook/kblog/) |

## In the KRL manual

- Using persistent variables: [Persistent variables](/krl/persistent-variables/)
- Writing a `send_warning()` action: [User-defined actions](/krl/krl-expression-language/user-defined-actions)

## Left out

Pages that describe things the current engine no longer has, or that depend on outside services:

- **Sending secure messages** used `engine:signChannelMessage` and its relatives, which are gone. Relationships between picos can use DIDComm now; see the [`dido` library](/krl/libraries/dido/).
- **Shorter URL for a query or event** used `io.picolabs.rewrite` on the root pico, removed in engine 1.0. A ruleset can do the same with `_redirect`: see [Cookies and redirects](/patterns_and_tips/cookies-and-redirects).
- **Account management using the root pico** described owner picos from before engine 1.0.
- **Generate an image with KRL**, **Using Foursquare data**, **Using Wovyn sensors**, **Using Git**, and **Using a Google sheet** are about particular services, devices, or tools rather than KRL.
- **Proposals, experiments, and proofs of concept** (personal channels, generating KRL with KRL, JavaScript rulesets, and others) were experiments on earlier engines.
