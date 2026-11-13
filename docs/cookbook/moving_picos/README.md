# Moving picos

A pico and its children move from one pico engine to another. The pico keeps its did:webvh identity, and its relationships keep working on the new engine. Follow the [instructions](/cookbook/moving_picos/instructions) to run it.

## The scenario

A bike club owns bikes that members borrow, and uses communities to coordinate rides. A ride coordinator runs her own mesh. The club sells **Gravel Bike #7**, so the bike moves from the club's mesh to the new owner's mesh.

Three meshes on two engines, all running [Manifold](https://github.com/Picolab/manifold-api):

| Mesh | Engine | What's there |
|------|--------|--------------|
| Club gear | A, `http://localhost:3001` | Trail Ride Community, Gravel Bike #7 (with a Bike #7 Computer child), and Gravel Bike #3 |
| Ride coordinator | B, `http://localhost:3002` | A coordinator with a Layer 2 relationship to Bike #7 (optional) |
| New owner | B | The Manifold that imports Bike #7 |

Bike #7 and its computer move. Bike #3 and the community stay on A.

## What it shows

- **Portable identity.** The did:webvh SCID survives the move. The host in the DID changes to the new engine's.
- **Subtree move.** Export produces a portable blob of state and identity, not a copy of the engine's database.
- **Manifold.** The new owner's Manifold makes its own relationship to the bike.
- **Communities.** A community can stay on the old engine while one of its things moves.
- **Layer 2.** A DID relationship made before the export (coordinator and bike) still works after the import.

## The rulesets

| Ruleset | File | Install on |
|---------|------|------------|
| `io.picolabs.club_gear_demo` | [`io.picolabs.club_gear_demo.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/moving_picos/io.picolabs.club_gear_demo.krl) | Engine A, the Manifold app pico. Builds the club, the bikes, and the community; releases Bike #7 after the move |
| `io.picolabs.ride_coordinator_demo` | [`io.picolabs.ride_coordinator_demo.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/moving_picos/io.picolabs.ride_coordinator_demo.krl) | Engine B, the mesh root. Optional; sets up the coordinator's relationship to Bike #7 |

Export and import use `io.picolabs.portable_subtree` (bundled with the engine) and `io.picolabs.manifold_portable_thing` from manifold-api.

## What you need

- Docker, to run both engines with `docker-compose.cross-engine.yml` from the repository root. It mounts `demos/` at `/var/pico-demos`, so the rulesets install from `file:///var/pico-demos/moving_picos/…`.
- The current manifold-api rulesets, including `io.picolabs.manifold_portable_thing`.
- About 10 to 14 minutes for the full story, or 7 to 9 without the coordinator.

## Known exception

Both demo rulesets call `ctx:newChannel`, and `club_gear_demo` calls `ctx:query`. Application rulesets should use wrangler instead. Setup needs a channel to exist before Manifold raises its events, and wrangler's `new_channel_request` doesn't yet return one in time. A wrangler-based setup is the intended fix.
