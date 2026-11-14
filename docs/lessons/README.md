# Pico Programming Lessons

Short, hands-on lessons that take you from a fresh install to systems of cooperating picos. Each one builds on the last: you write KRL, install it in a running engine, and watch what the pico does.

## Before you begin

Start with the [Quickstart](/lessons/quickstart). It installs the engine, registers your passkey, and gets a first ruleset running. You need [Node.js](https://nodejs.org/) 20 or later.

## The lessons

Do them in order. Each one assumes what the earlier ones taught.

| # | Lesson | You learn |
|---|--------|-----------|
| 1 | [Quickstart](/lessons/quickstart) | Install and run the engine, meet your root pico, install and flush `hello_world` |
| 2 | [Events and Queries](/lessons/events-and-queries) | Channels and policies, sending events and queries over HTTP, the Testing and Logging tabs, `klog` |
| 3 | [Pico State](/lessons/pico-state) | Entity variables, `defaultsTo` and `\|\|`, maps with path assignment, `clear` |
| 4 | [Modules and External APIs](/lessons/modules-and-apis) | `use module`, `provides`, `configure using`, calling web APIs, secrets in install configuration |
| 5 | [Pico views](/lessons/pico-views) | Giving a pico a web page of its own |
| 6 | [Pico-Based Systems](/lessons/pico-based-systems) | Children, and systems made of many picos |
| 7 | [Relationships](/lessons/relationships) | Picos that stay connected over time, and how they talk (called subscriptions in older material) |
| 8 | [Scatter-Gather](/lessons/scatter-gather) | Asking many picos at once and combining their answers |
| 9 | [Gossip Lab](/lessons/gossip) | Optional pointer to the BYU CS 462 gossip lab (video only here) |

Complete lessons 1 through 7 in order. **Scatter-Gather** is an optional advanced pattern lesson. The **Gossip Lab** page is only a pointer to the course video; the assignment itself isn't in these docs.

> **A note on names.** These lessons say **relationships**. Older lessons, blog posts, and the KRL module that implements them, `io.picolabs.subscription`, say *subscriptions*. They're the same thing; the module name stays for compatibility. See [Relationships](/wrangler/relationships).

## How the lessons work

- **Run everything.** Each lesson has code to install and things to try. Use the developer UI at `http://localhost:3000` or `curl`.
- **The Testing tab builds forms from the ruleset's schema**, which comes from `/** … */` doc comments on rules and functions. You'll see `@attr`, `@param`, and `@example` in the lessons' KRL.
- **Use wrangler.** Picos create children and channels through [wrangler](/wrangler/) events and functions, not by reaching into the engine.
- **Check your KRL.** `krl-check`, in the `krl-compiler` package, finds errors before you install. See [Hosting and checking rulesets](/patterns_and_tips/hosting-and-checking-rulesets).

## Runnable examples beside the lessons

The [Cookbook](/cookbook/) has demos you can run in a new child pico with one click, from the **Try It!** tab on your root pico. They're a good parallel to the lessons:

| After | Try |
|-------|-----|
| [Quickstart](/lessons/quickstart) and [Events and Queries](/lessons/events-and-queries) | [Echo](/cookbook/echo/): a rule answers an event with a directive, from a page or from `curl` |
| [Pico State](/lessons/pico-state) | [Score tracker](/cookbook/score_tracker/): a contest pico with a leaderboard kept in entity variables |
| [Modules and External APIs](/lessons/modules-and-apis) | [Configuration and secrets](/cookbook/secrets/), and [Bootstrap and channels](/cookbook/bootstrap/) |
| [Pico views](/lessons/pico-views) | [Pico view demos](/cookbook/xmlui/) |
| [Pico-Based Systems](/lessons/pico-based-systems) | [Child pico tasks](/cookbook/child_tasks/) |
| [Relationships](/lessons/relationships) | [Two picos talking](/cookbook/two_picos/) and [Collection](/cookbook/collection/) |

## Reference while you work

- [Persistent Compute Objects](/pico-overview): what picos are and why
- [Pico Engine](/pico-engine): installing, configuring, and operating the engine
- [KRL manual](/krl/)
- [Event Exchange Protocol](/exp/): the HTTP event and query APIs
- [Patterns and tips](/patterns_and_tips/)

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1185969/Pico+Programming+Lessons) (last edited there 2023-10-10), and updated for this engine.</small>
