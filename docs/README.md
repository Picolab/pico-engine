# Pico Engine

**Picos** (persistent compute objects) are small, always-on actors that each stand in for one thing (a person, a device, a place, an organization) and keep their own identity, state and behavior. The **pico engine** is the open-source Node.js runtime that hosts them.

Each pico:

- has a **persistent identity**: a portable `did:webvh` that survives moving between engines
- keeps its **own state**, isolated from every other pico, with no external database
- runs **rules** written in KRL that react to events and answer queries
- talks to other picos through **channels** and **relationships**, on the same engine or across engines

Networks of picos model the world one entity at a time. Read [Persistent Compute Objects](pico-overview.md) for the full model.

## Quick start

You need [Node.js](https://nodejs.org/) 20 or later.

```sh
npm install -g pico-engine
pico-engine
```

Open <http://localhost:3000>. Your first visit registers a passkey and creates your root pico. From the UI you can create child picos, install rulesets, send test events and inspect the logs.

Configuration, Docker, multiple engines and security settings are in the [operator guide](pico-engine.md).

## Try It!

The fastest way to see what picos can do is the **Try It!** tab on the root pico, in pico-engine 1.9.5 and later. It lists demos that ship with the engine, each with a sentence on the patterns it's built to show. Open one and click **Run in a new child pico**. The tab creates a child pico and installs the demo's bootstrap ruleset, which sets up everything else: more rulesets, more child picos, channels, relationships, sample data. When the demo shows **ready**, open its links.

Each demo's window also has:

- **What to look for and try**: where to look in the developer UI, and things to do with the demo.
- **The code**: every ruleset the demo uses, with its path on disk. Edit one, click **Flush**, and watch the running demo change.
- **Read more in the cookbook**: the demo's page in the [Cookbook](cookbook/), with how it works.

The demos start simple (Echo, a rule answering an event) and build up to apps of several cooperating rulesets and picos (Collection, KBlog). Operators can show the tab on every pico, or hide it, with `show_tryit_menu` in the [engine configuration](pico-engine.md).

## How a ruleset is structured

Behavior lives in KRL rulesets. This small one shows the parts: a `meta` block that names the ruleset and says what it shares, a `global` block of functions, and a rule that selects an event and changes the pico's state. It remembers a name sent in an event and shares a greeting function:

```krl
ruleset io.picolabs.hello_world {
  meta {
    name "Hello World"
    shares hello, said
  }
  global {
    hello = function(name = "default") {
      "Hello " + name
    }
    said = function() {
      ent:said
    }
  }
  rule say_hello {
    select when say hello
    always {
      ent:said := event:attrs{"name"}
    }
  }
}
```

A `say:hello` event sent to the pico stores the name in the entity variable `ent:said`. The `hello` and `said` functions can be called as queries on any channel whose policy allows them. To see rulesets like this one running, with pages, channels, and other picos, use the **Try It!** tab. To write your own, see the [KRL manual](krl/) and [Patterns and tips](patterns_and_tips/).

## Where to go next

| If you want to… | Read |
|---|---|
| Understand what picos are and why | [Persistent Compute Objects](pico-overview.md) |
| Install, configure and run an engine | [Operator guide](pico-engine.md) |
| Write rulesets | [KRL manual](krl/) |
| Use the rulesets every pico has (Wrangler, PDS, relationships) | [Bundled rulesets](rulesets/) |
| Give a pico its own web UI | [Pico views](pico-views.md) |
| Install and run worked examples, from the **Try It!** tab or by hand | [Cookbook](cookbook/) |
| Learn short techniques for KRL and picos | [Patterns and tips](patterns_and_tips/) |
| Call picos over HTTP | [OpenAPI spec](openapi.yaml) |
| Point a coding agent at these docs | [llms.txt](llms.txt) · [llms-full.txt](llms-full.txt) |
| Contribute | [Contributing](contributing.md) |

## Project

- Source and issues: [github.com/Picolab/pico-engine](https://github.com/Picolab/pico-engine)
- Release history: [CHANGELOG](https://github.com/Picolab/pico-engine/blob/master/CHANGELOG.md)
- Background and history: [Phil Windley's blog](https://www.windley.com/) (older posts are tagged *kynetx* and *krl*)
- License: MIT
