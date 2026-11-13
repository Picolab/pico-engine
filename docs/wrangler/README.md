# Wrangler

Wrangler is the operating system for picos. The engine itself provides primitives: picos, channels, events, queries, persistence, identity. Wrangler is a set of KRL rulesets, installed on every pico, that wraps those primitives in events and functions your rulesets use: create and delete child picos, install rulesets, make channels, form relationships with other picos, and keep a pico's profile and data.

Use Wrangler rather than the engine's `ctx:` primitives from application rulesets. Wrangler is the supported API for a pico's life cycle. If something you need isn't there, treat it as out of bounds, or [file an engine issue](https://github.com/Picolab/pico-engine/issues).

## The rulesets on every pico

The engine installs these on the root pico, and Wrangler installs them on every child it creates:

| Ruleset | What it does | Guide | API reference |
|---------|--------------|-------|---------------|
| `io.picolabs.wrangler` | A pico's life cycle: child picos, rulesets, channels, and queries to other picos | [The wrangler ruleset](/wrangler/wrangler) | [io.picolabs.wrangler](/rulesets/io.picolabs.wrangler) |
| `io.picolabs.subscription` | Relationships between picos (called subscriptions before engine 1.6.2) | [Relationships](/wrangler/relationships) | [io.picolabs.subscription](/rulesets/io.picolabs.subscription) |
| `io.picolabs.pds` | The pico's profile and its shared, namespaced data | [Pico data store](/wrangler/pds) | [io.picolabs.pds](/rulesets/io.picolabs.pds) |
| `io.picolabs.pico-engine-ui` | What the developer UI needs: its channel, the pico's box, Testing tab history | — | [io.picolabs.pico-engine-ui](/rulesets/io.picolabs.pico-engine-ui) |

Channels are the engine's, but Wrangler is how rulesets manage them: see [Managing channels](/wrangler/channels).

## Optional rulesets

The engine ships these too, at `/krl/<rid>.krl`, but doesn't install them. Install one from a pico's **Rulesets** tab, or with `wrangler:install_ruleset_request`, when you need it:

| Ruleset | What it does | Guide |
|---------|--------------|-------|
| `io.picolabs.xmlui` | Pages served from a pico (pico views) and the components they share | [Pico views](/wrangler/xmlui) |
| `io.picolabs.oauth` | Root pico only: require OAuth access tokens on the mesh's `/sky/*` traffic, and manage OAuth credentials | [OAuth](/wrangler/oauth) |
| `io.picolabs.portable_subtree` | Export a pico and its children, and import them under another parent, on this engine or another | [Portable subtrees](/wrangler/portable-subtree) |

## Using Wrangler from a ruleset

Each Wrangler ruleset works two ways:

- **Events.** Raise or send an event that a Wrangler rule selects, such as `wrangler:new_child_request` or `wrangler:install_ruleset_request`. When the work is done, Wrangler raises an event saying so, such as `wrangler:child_initialized` or `wrangler:ruleset_installed`, which your rules can select.
- **Functions and actions.** Use the ruleset as a module and call what it provides:

  ```krl
  meta {
    use module io.picolabs.wrangler alias wrangler
  }
  ```

  Then `wrangler:children()`, `wrangler:channels(["myapp", "app"])`, `wrangler:createChannel(...)`, and so on. Shared functions can also be queried from outside the pico, on a channel whose policy allows them.

The guides explain how the pieces fit together. The API reference pages list every event and function each ruleset supports, generated from the rulesets' own doc comments.

Wrangler and the engine know nothing about any particular application. Frameworks such as Manifold build on Wrangler to give a mesh of picos its own vocabulary.
