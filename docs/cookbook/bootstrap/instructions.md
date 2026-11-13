# Bootstrap and channels: instructions

These steps use the developer UI of a running engine at `http://localhost:3000`. Replace that with your engine's URL. See the [overview](/cookbook/bootstrap/) for what the demo shows.

## The quick way: Try It!

On the root pico in the developer UI, open the **Try It!** tab, click **Bootstrap and channels**, then **Run in a new child pico**. The stage names each ruleset as it is installed. When it shows **ready**, open **Visitor log**.

## By hand

Installing the app by hand is the job the bootstrap does for you:

1. Create a child pico and open its **Rulesets** tab.
2. Install `http://localhost:3000/krl/io.picolabs.xmlui.krl`.
3. Install `http://localhost:3000/krl/demos/bootstrap/com.example.visitors.format.krl`. It has to come before the app, which uses it as a module.
4. Install `http://localhost:3000/krl/demos/bootstrap/com.example.visitors.krl` with the configuration `{"greeting": "Welcome"}`. Leave the configuration out and visitors are greeted with "Hello".
5. Its install rule creates a channel tagged `visitors, app`. Click **View** next to `com.example.visitors` and open it on that channel.

## Try it

- Sign in. The greeting comes from the install configuration.
- **How the bootstrap set up this pico** lists the installed rulesets in install order. On the **Logging** tab, follow the `wrangler:ruleset_installed` events, each followed by the next install request.
- **This app's channel** shows the channel the install rule made, and the events its policy allows.
- Click **Run the channel rule again**. The answer is `set_up_channel`, and the channel's id is unchanged.
- Click **Make a duplicate, the naive way** twice: three channels with the same tags, the way a create-only install rule leaves a pico after a few reinstalls.
- Click **Clean up duplicates**. Every channel except the one this page uses is deleted.

## How it works

**The bootstrap** chains installs on `wrangler:ruleset_installed`. Each rule waits for the ruleset the next one needs:

```krl
rule install_app {
  select when wrangler ruleset_installed where event:attr("rids") >< format_rid
  always {
    raise wrangler event "install_ruleset_request" attributes
      {"absoluteURL": meta:rulesetURI, "rid": app_rid, "config": {"greeting": "Welcome"}}
  }
}
```

`absoluteURL: meta:rulesetURI` with a `rid` installs `<rid>.krl` from the folder the bootstrap came from, so the app installs the same way from the engine, from GitHub, or from a `file://` URL. `config` becomes the app's `meta:rulesetConfig`.

**The app's install rule** selects its own install (the `where` keeps it from running when other rulesets are installed later), and also an event you can send to run it again:

```krl
rule set_up_channel {
  select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
           or visitor_channel check_requested
  pre {
    existing = wrangler:channels(channel_tags).head()
  }
  if existing then every {
    wrangler:updateChannel(existing{"id"}, channel_tags, eventPolicy(), queryPolicy())
    send_directive("set_up_channel", {"result": "updated", "id": existing{"id"}})
  }
  notfired {
    raise visitor_setup event "channel_missing"
  }
}
```

When there is no channel yet, `create_channel` makes one. `updateChannel` keeps the id, so links and pages that use the channel keep working.

**The policy** comes from the ruleset's schema, `wrangler:rulesetSchema(meta:rid)`. Its `operations` list the events each rule selects, and its `queries` list the shared functions. Both include only rules and functions with doc comments. `eventPolicy()` allows those events, except `wrangler`'s. `queryPolicy()` allows those functions plus what the page shell needs from `io.picolabs.xmlui`. `create_channel` has no doc comment, so the event that starts it isn't on the channel.

**Flushing** reloads a ruleset's code, but it doesn't raise `wrangler:ruleset_installed` again, because the ruleset was already installed. Channels made on install keep their old policy until the install rule runs again. That's what **Run the channel rule again** is for.

## Change it and watch

The **Try It!** window lists each file with its path on disk. Edit a file there, click **Flush**, and use the page.

- Add a documented rule to `com.example.visitors.krl` that selects `visitor waved`. After **Flush**, `visitor/waved` on the page's channel is refused. Click **Run the channel rule again**: now it is allowed.
- Change the greeting word in the bootstrap's `install_app`, and run the demo again in a new child.
- Make the bootstrap uninstall itself when it's done, by raising `wrangler:uninstall_ruleset_request` with `{"rid": meta:rid}` after the app is installed. The app still works. The Try It! tab loses track of it, though, because it asks the bootstrap's `tryIt()` for progress.
