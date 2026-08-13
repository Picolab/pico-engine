# Discovery

Every pico has a **`discovery`** channel. Integrators send a single event to learn what the pico can do. Each installed ruleset that participates in discovery responds with a **`discovery capability`** directive.

This is event-based (not a query on a specific ruleset) so the engine can aggregate responses from every ruleset that implements discovery.

## Discovery channel

Wrangler creates a channel tagged `discovery` on every pico. Its policy allows **only** the discovery event:

| Direction | Allowed |
|-----------|---------|
| Events in  | `discovery capabilities` |
| Queries    | none |

Find the channel with `wrangler:discoveryChannel()` or `wrangler:channels(["discovery"])`.

## Integrator flow

1. Obtain the target pico's discovery channel ECI (via relationship metadata, parent query, etc.).
2. Send `discovery capabilities` on that channel.
3. Optionally include an **`eci`** attribute — the channel the integrator will use for subsequent queries and events on this pico.
4. Collect **`discovery capability`** directives from the event response.

When `eci` is present, each ruleset filters its bindings so the integrator only sees capabilities that channel's policy **allows**. Denied operations are omitted, not listed and blocked later.

Example (HTTP):

```http
POST /sky/event/{discovery_eci}/discovery/capabilities/wait
Content-Type: application/json

{"eci": "{caller_eci}"}
```

## Ruleset author pattern

Discovery is opt-in per ruleset. Add:

1. An **`app`** map — short metadata (`name`, `version`, optional `title`, `description`, `iconURL`).
2. A **`bindings()`** function — the integrator contract (queries, events, notifications).
3. A **discovery rule** that selects on `discovery capabilities` and sends a directive.

```krl
ruleset io.picolabs.myapp {
  meta {
    use module io.picolabs.wrangler alias wrangler
  }
  global {
    app = {
      "name": "myapp",
      "title": "My App",
      "version": "1.0",
      "description": "One sentence explaining what this app does on the pico."
    };

    bindings = function() {
      {
        "version": 1,
        "queries": [
          {
            "name": "getStatus",
            "description": "Return the current status map."
          }
        ],
        "events": [
          {
            "domain": "myapp",
            "name": "refresh",
            "attrs": [],
            "description": "Ask the app to refresh its state."
          }
        ]
      }
    }
  }

  rule discovery {
    select when discovery capabilities
    send_directive("discovery capability", {
      "app": app,
      "rid": meta:rid,
      "bindings": wrangler:filterBindingsForCaller(
        bindings(),
        event:attr("eci"),
        meta:rid
      ),
      "iconURL": "https://example.com/myapp.svg"
    });
  }
}
```

### Bindings shape

`bindings()` describes what an integrator may use — not internal rule names.

| Key | Purpose |
|-----|---------|
| `version` | Bindings schema version (currently `1`) |
| `queries` | `[{"name": "...", "args": [...], "description": "..."}]` callable via `/sky/query/` |
| `events` | `[{"domain": "...", "name": "...", "attrs": [...], "description": "..."}]` sendable to this pico |
| `notifications` | Optional block with `trigger`, `forward`, and `channels` for notification routing |

### App metadata

| Field | Purpose |
|-------|---------|
| `name` | Short id (e.g. `journal`) |
| `title` | Human-readable label (e.g. `Journal`) |
| `version` | App version string |
| `description` | What the app does on this pico — shown to integrators during discovery |

### Policy filtering

Use `wrangler:filterBindingsForCaller(bindings, caller_eci, rid)` in your discovery rule:

- **`caller_eci`** — from `event:attr("eci")`; pass through when null (unfiltered).
- **`rid`** — `meta:rid` for this ruleset (used to check query policy).

Filtering uses `wrangler:allowsEventForChannel` and `wrangler:allowsQueryForChannel`, which evaluate the caller channel's policy from `ctx:channels` on this pico.

## Directive: `discovery capability`

Each participating ruleset may emit one directive:

```json
{
  "name": "discovery capability",
  "options": {
    "app": {
      "name": "myapp",
      "title": "My App",
      "version": "1.0",
      "description": "One sentence explaining what this app does."
    },
    "rid": "io.picolabs.myapp",
    "bindings": { "version": 1, "queries": [], "events": [] },
    "iconURL": "https://example.com/myapp.svg"
  }
}
```

The engine merges directives from all selecting rules. Integrators should handle zero, one, or many capabilities per pico.
