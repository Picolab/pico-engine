# Moving picos demo

A pico and its children move from one engine to another, keeping their did:webvh identity and relationships.

- Overview: [`docs/cookbook/moving_picos/README.md`](../../docs/cookbook/moving_picos/README.md) (on the docs site: https://docs.picolabs.io/#/cookbook/moving_picos/)
- Instructions: [`docs/cookbook/moving_picos/instructions.md`](../../docs/cookbook/moving_picos/instructions.md)

| File | Install on |
|------|------------|
| `io.picolabs.club_gear_demo.krl` | Engine A, the Manifold app pico |
| `io.picolabs.ride_coordinator_demo.krl` | Engine B, the mesh root (optional) |

`docker-compose.cross-engine.yml` mounts `demos/` at `/var/pico-demos`, so install from `file:///var/pico-demos/moving_picos/<file>`.

Both rulesets use `ctx:newChannel` (and `club_gear_demo` uses `ctx:query`), a known exception to the rule that application rulesets go through wrangler.
