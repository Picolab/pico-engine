# Guard rules: instructions

These steps use the developer UI of a running engine at `http://localhost:3000`. Replace that with your engine's URL. See the [overview](/cookbook/guard_rules/) for what the demo shows.

## The quick way: Try It!

On the root pico in the developer UI, open the **Try It!** tab, click **Guard rules**, then **Run in a new child pico**. The bootstrap raises `archive:needed` five times in a row and adds a note before the archive exists. When it shows **ready**, open **Archive**. The counts read: 1 archive pico, 5 requests, 4 ignored, 1 note refused. The archive holds the one note added after it was created.

## By hand

1. Create a child pico and open its **Rulesets** tab.
2. Install `io.picolabs.xmlui` from the engine: `http://localhost:3000/krl/io.picolabs.xmlui.krl`.
3. Install the archive keeper: `http://localhost:3000/krl/demos/guard_rules/com.example.archive.krl`. It installs `com.example.archive_store` on the Archive child itself, from the same folder.
4. Installing it creates a channel tagged `archive, app`. Click **View** next to `com.example.archive` and open it on that channel.

## Try it

- Click **Add a note** before anything else. The gate refuses it: "Note: refused, no archive yet".
- Click **Request the archive**. "Guard: go ahead", and in a moment the archive is **ready**. The pico has a child named Archive.
- Click **Request the archive** again, several times. Each one says "Guard: already have one, ignored". **Requests** and **Ignored** go up; **Archive picos** stays at 1.
- Add a note. It is stored in the Archive child and listed on the page.
- **Start over** deletes the archive and resets the counts.

## How it works

**The guard.** `archive_needed` answers every `archive:needed` event, but raises `archive:creation_approved` only when there is no archive and none is being created:

```krl
rule archive_needed {
  select when archive needed
  pre {
    allowed = not ent:archive_eci && not ent:creating
  }
  if allowed then send_directive("archive", {"result": "creating"})
  fired {
    ent:creating := true
    raise archive event "creation_approved"
  }
  else {
    ent:ignored := ent:ignored.defaultsTo(0) + 1
  }
  finally {
    ent:requests := ent:requests.defaultsTo(0) + 1
  }
}
```

`create_archive` selects `archive:creation_approved` and asks wrangler for the child. Nothing else raises that event, so the work happens once. When wrangler raises `child_initialized`, `archive_initialized` records the archive, installs the store ruleset on it, and raises `archive:archive_created`.

**Why `ent:creating`.** The archive doesn't exist until `child_initialized` arrives, which is a separate event that comes later. The five requests the bootstrap raises are all handled before then. Checking only `ent:archive_eci` would let all five through. The flag is set the moment the guard approves, so the second request already sees it.

**The gate.** `require_archive` and `store_note` both select `archive:note_added`. Rules in one ruleset that select the same event run in the order they are written, so the gate runs first. When there is no archive, it answers and runs `last`:

```krl
rule require_archive {
  select when archive note_added
  if not ent:archive_eci then send_directive("note", {"result": "refused, no archive yet"})
  fired {
    ent:gated := ent:gated.defaultsTo(0) + 1
    last
  }
}
```

`last` stops the rest of this ruleset's rules for this event, so `store_note` doesn't run. It doesn't stop rules in other rulesets, which is why the gate and the rule it guards are in the same ruleset.

## Change it and watch

The **Try It!** window lists each file with its path on disk. Edit `com.example.archive.krl` there, click **Flush**, and use the page.

- Remove the flag from the guard: make it `allowed = not ent:archive_eci`. Click **Start over**, then run the demo again from **Try It!**: the five quick requests now make five Archive picos. Put the flag back.
- Move `require_archive` below `store_note` in the file. Click **Start over**, then **Add a note**. Nothing is stored and the event fails with `TypeError: eci was null instead of a string` (in the response, and on the **Logging** tab): `store_note` ran first and tried to send the note to an archive that doesn't exist. Move it back.
- Give the guard a second condition, such as a limit of three notes per archive, by adding a guard rule for `note_added` in the same style.
