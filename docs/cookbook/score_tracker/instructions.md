# Score tracker: instructions

These steps use the developer UI of a running engine at `http://localhost:3000`. Replace that with your engine's URL. See the [overview](/cookbook/score_tracker/) for what the demo shows.

## The quick way: Try It!

On the root pico in the developer UI, open the **Try It!** tab, click **Score tracker**, then **Run in a new child pico**. The bootstrap installs the ruleset and seeds three contestants: Ada Lovelace (45 points), Grace Hopper (40), and Alan Turing (25). When it shows **ready**, open **Leaderboard**.

## By hand

1. Create a child pico and open its **Rulesets** tab.
2. Install `io.picolabs.xmlui` from the engine: `http://localhost:3000/krl/io.picolabs.xmlui.krl`.
3. Install the score tracker: `http://localhost:3000/krl/demos/score_tracker/com.example.score_tracker.krl`.
4. Installing it creates a channel tagged `score_tracker, app`. Click **View** next to `com.example.score_tracker` and open it on that channel. The leaderboard is empty until someone registers.

## Try it

- Register with your name. The subtitle changes to "You are …", and the form becomes **Add points**. The page keeps your participant id in the browser tab's session storage.
- Add points a few times and watch your rank change. Negative points work too.
- Open the leaderboard in a second browser window and register as someone else. Both windows share one pico.
- In another window, register under a name that is already on the board. You get that contestant's id back, not a second entry.
- Send events from a terminal on the app channel. Replace `<eci>` with its id (shown in the page URL after `/ui/`):

  ```sh
  curl "http://localhost:3000/sky/event/<eci>/demo/score/new_participant?first=Katherine&last=Johnson"
  curl "http://localhost:3000/sky/cloud/<eci>/com.example.score_tracker/currentRanks"
  ```

- Try something the channel does not allow:

  ```sh
  curl "http://localhost:3000/sky/event/<eci>/demo/wrangler/new_child_request?name=intruder"
  ```

  The engine answers `{"error":"Error: Not allowed by channel policy"}`.

## How it works

Each contestant is one entry in the entity variable `ent:participants`, keyed by participant id. `new_participant` requires both names, through attribute regexes in `select when`. It returns the id in a directive, so whoever registered learns their id from the response:

```krl
rule new_participant {
  select when score new_participant
    first re#(.+)#
    last re#(.+)#
    setting(first, last)
  pre {
    existing = findByName(first, last)
    pid = existing => existing{"pid"} | event:attr("pid") || random:uuid()
  }
  send_directive("registered", {"pid": pid, "name": first + " " + last, "new": existing => false | true})
  always {
    ent:participants{pid} := {"pid": pid, "first": first, "last": last, "points": []}
      if not existing
  }
}
```

`new_points` adds an entry to that participant's list with a path assignment, `ent:participants{[pid, "points"]} := …`. It does nothing (and logs a warning) when the id is unknown.

`currentRanks` is a function the ruleset `shares`. It totals each contestant's points, sorts with `<=>`, and adds a rank. The leaderboard page reads it with a `DataSource`. After registering or adding points, the page refetches it.

The policy is set on install by `ui:create_app_channel(channel_tags, ["score"], ["currentRanks", "participant", "leaderboard"], meta:rid)`. Its event policy allows the `score` domain, and its query policy allows those three functions. That policy, not anything in the page, is what keeps contestants out of the rest of the pico.

The bootstrap registers the seed contestants with one `foreach` rule. When the last one is done (`on final`), it raises an event that starts the rule adding the seed points.

## Change it and watch

The **Try It!** window lists each file with its path on disk. Edit `com.example.score_tracker.krl` there, click **Flush**, and reload the leaderboard.

- Change `initialValue="10"` on the **Points** field to `100`.
- Add a column. `currentRanks` already returns `pid`, so add `<Column bindTo="pid" header="Id" />` to the table.
- Cap a single award: in `new_points`, make the condition `if p && points.as("Number") <= 50 then …`. Larger awards are skipped, so change the `else` warning to say why.
