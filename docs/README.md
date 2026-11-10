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

## A first ruleset

Behavior lives in KRL rulesets. This one remembers a name sent in an event and shares a greeting function:

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

A `say:hello` event sent to the pico stores the name in the entity variable `ent:said`. The `hello` and `said` functions can be called as queries on any channel whose policy allows them.

## Where to go next

| If you want to… | Read |
|---|---|
| Understand what picos are and why | [Persistent Compute Objects](pico-overview.md) |
| Install, configure and run an engine | [Operator guide](pico-engine.md) |
| Write rulesets | [KRL manual](krl/) |
| Use the rulesets every pico has (Wrangler, PDS, relationships) | [Bundled rulesets](rulesets/) |
| Give a pico its own web UI | [Pico views](pico-views.md) |
| Call picos over HTTP | [OpenAPI spec](openapi.yaml) |
| Point a coding agent at these docs | [llms.txt](llms.txt) · [llms-full.txt](llms-full.txt) |
| Contribute | [Contributing](contributing.md) |

## Project

- Source and issues: [github.com/Picolab/pico-engine](https://github.com/Picolab/pico-engine)
- Release history: [CHANGELOG](https://github.com/Picolab/pico-engine/blob/master/CHANGELOG.md)
- Background and history: [Phil Windley's blog](https://www.windley.com/) (older posts are tagged *kynetx* and *krl*)
- License: MIT
