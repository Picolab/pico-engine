# Moving picos: instructions

Engine **A** is the club's mesh at `http://localhost:3001`. Engine **B** is the recipient at `http://localhost:3002`. The move target is **Gravel Bike #7** and its child, **Bike #7 Computer**. **Bike #3** and **Trail Ride Community** stay on A. See the [overview](/cookbook/moving_picos/) for the scenario.

## Prepare

1. From the repository root, start both engines and wait until they are healthy:

   ```sh
   docker compose -f docker-compose.cross-engine.yml up -d
   ```

2. Optional: start from fresh engine data, or run `cleanup` (Act 7) on the demo picos from a previous run.
3. **Engine A, Manifold app pico:**
   - Install `io.picolabs.club_gear_demo` from `file:///var/pico-demos/moving_picos/io.picolabs.club_gear_demo.krl`.
   - Install `io.picolabs.portable_subtree` from the KRL directory on the Rulesets tab.
   - Flush the current manifold-api rulesets: `manifold_pico`, `manifold_portable_thing`, `community`, and their dependencies. For example, `https://raw.githubusercontent.com/Picolab/manifold-api/refs/heads/main/io.picolabs.manifold_portable_thing.krl`.
4. **Engine B, mesh root (owner):** install `io.picolabs.ride_coordinator_demo` from `file:///var/pico-demos/moving_picos/io.picolabs.ride_coordinator_demo.krl`. Optional, but needed for the Layer 2 part of the story.
5. **Engine B, Manifold app pico:** flush the same manifold-api rulesets as on A.
6. Sign in on both engines.
7. Pick an export secret, such as `demo-secret-iiw`, and keep it handy.

## Act 1: build the club on Engine A (2 to 3 minutes)

On **3001**, open Manifold and the pico with `club_gear_demo` installed.

1. On the **Testing** tab, raise `club_gear_demo` `setup` with no attributes.
2. Query `demoState` until it returns `ready: true` and `stage: "done"`.
3. In Manifold, show the children: **Trail Ride Community**, **Gravel Bike #7**, and **Gravel Bike #3**. Expand Bike #7 to show **Bike #7 Computer**.
4. Open **Gravel Bike #7**, then its **Relationships** tab. Expect `Manifold:Gravel Bike #7` and `Trail Ride Community:Gravel Bike #7`.
5. From `demoState`, copy these for later:
   - `bikePicoId` or `bikeEci`
   - `bikeDid`
   - `bikeManifoldKey` (the registry id), optional
   - `communityPicoId` and the names, optional

The community and two bikes are on A. Only Bike #7 will move.

## Act 2: Layer 2 coordinator on B, before the export (optional, 2 minutes)

Skip this act if you only want to show the Manifold import. Run it to show that a did:webvh Layer 2 relationship survives the move.

On **3002**, open the mesh root pico with `ride_coordinator_demo`.

1. Query `demoState` and note `demoEci`, the demo channel. Use this ECI for the coordinator's events, not the root's default channel.
2. On `demoEci`, raise `ride_coordinator_demo` `setup` with `bikeDid` set to A's `demoState().bikeDid` and `bikeName` set to `"Gravel Bike #7"`.
3. Wait until `demoState().stage` is `connecting`. Setup stops there on purpose.

Back on **3001**, open **Gravel Bike #7** (its ECI is in A's `demoState().bikeEci`).

4. Query `io.picolabs.subscription` `inbound` and find the pending `Ride Participants:Gravel Bike #7`.
5. Raise `wrangler` `pending_subscription_approval` with `Id` set to that pending relationship's id.

On **3002**, on `demoEci`:

6. Raise `ride_coordinator_demo` `sync`. It is an internal checkpoint and isn't listed on the Testing tab, so send it from the Events view on the demo channel.
7. Optional: query `demoState` until `ready: true`.

Thing picos don't accept inbound relationships on their own: the owner approves on the bike. The introduction between engines uses did:webvh, not an ECI.

## Act 3: export Bike #7 on A (1 to 2 minutes)

On **3001**, use the **Manifold app** channel. That is not the `club_gear_demo` pico unless Manifold lives there in your tree.

1. Raise `manifold` `enable_portable_thing`, once per Manifold, if it isn't already enabled.
2. Query `io.picolabs.manifold_portable_thing` `exportPortableThing` with:
   - the first argument: `bikePicoId` or `bikeEci` from A's `demoState`
   - the second argument: your secret
3. Save the result's `blob`, `name`, and `donorQueryEci`. Copy the blob to a file or the clipboard.
4. Optional: show Bike #7's did:webvh on A, unchanged before the import.

The export is a portable subtree, a snapshot of state and identity, not a copy of the database.

## Act 4: import on Engine B (2 minutes)

On **3002**, open the **Manifold app** pico.

1. Raise `manifold` `enable_portable_thing` if needed.
2. Raise `manifold` `import_portable_thing` with:
   - `blob`
   - `secret`, the same one you exported with
   - `name`, from the export result
   - `donorQueryEci`, from the export result
   - `renewIngress`: `true`
3. Wait for `import_portable_thing_done`, or refresh the UI.
4. Show that **Gravel Bike #7** is in B's Manifold (`getThings`, or the UI), with **Bike #7 Computer** under it.
5. Open the imported bike's **Relationships** tab. It has a Manifold relationship. The community relationship may stay on A, depending on the export: say what the audience should see.

The did:webvh SCID is the same on B. B's Manifold has a new relationship to the bike.

## Act 5: show it works across meshes (2 minutes)

If you ran Act 2:

1. On **3002**, on `demoEci`, query `demoState`. The relationship should reach `done` without running `setup` again. If it doesn't, approve again and raise `sync` on B, and mention reconciliation.
2. On B, open **Gravel Bike #7** → **Relationships**. The coordinator's DID relationship is there.

Either way:

3. On **3001**, the community still has Bike #3. Bike #7 may still appear until Act 6.
4. Optional: compare the `communities` query on Bike #7 on B with the community on A. The community stayed on A; the bike moved.

On B, local peer reconciliation updates other picos that still pointed at the bike's old ECI or DID.

## Act 6: clean up on A (1 minute)

On **3001**, open the `club_gear_demo` pico.

1. Raise `club_gear_demo` `release_bike7`. It removes the old bike from Manifold and from the community on A.
2. Check that A's Manifold no longer lists Bike #7, and that Bike #3 and the community remain.

The old engine can let go of the moved bike. B is now authoritative for it.

## Act 7: reset (optional)

- On A, raise `club_gear_demo` `cleanup`, then query `demoState` until `stage: "idle"`.
- On B, raise `ride_coordinator_demo` `cleanup` on `demoEci`.
- On B, remove the imported thing through Manifold if you want an empty Manifold for another run.

## If something fails

| Symptom | Check |
|---------|-------|
| `setup` never reaches `ready` | A's Manifold logs and `demoState().stage`; flush `community` and `manifold_pico` |
| The export query is missing | Raise `enable_portable_thing` on A's Manifold; flush `manifold_portable_thing` |
| The import has no child | The secret and blob match; flush the portable rulesets on B; watch for `import_portable_thing_done` |
| The coordinator is stuck | Approve `pending_subscription_approval` on the **bike's** ECI, then raise `sync` on B's `demoEci` |
| `cleanup` fails | Flush `club_gear_demo` again; cleanup uses Manifold registry keys (`manifoldKey`) |

## Talking points

Pick three to five:

1. **Portable identity.** The did:webvh SCID survives. The host and path in the DID change with the engine's URL.
2. **Subtree move.** An export and import blob, not a federation of whole engines.
3. **Manifold.** The new owner's Manifold makes a new relationship to the bike, named Manifold on the Relationships tab.
4. **Communities.** A community can stay on the old engine while its thing moves.
5. **Layer 2.** The coordinator and bike relationship uses DIDs; the bike's owner approves it; it survives the move when made before the export.
6. **Operators.** Passkeys, two engines on localhost, rulesets installed from manifold-api and this repository.
7. **Autonomy.** Picos are persistent objects with relationships, not app session tokens.

The developer UI in this demo is for developers to observe and change picos. It is not an end-user interface.

## Timing

| Run | Time |
|-----|------|
| The full story (Acts 1 to 6) | 10 to 14 minutes |
| Manifold only (skip Act 2 and the coordinator part of Act 5) | 7 to 9 minutes |
| Preparation and reset, off camera | 5 more minutes |
