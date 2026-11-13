# Pico views: instructions

These steps use the developer UI of a running engine at `http://localhost:3000`. Replace that with your engine's URL. See the [overview](/cookbook/xmlui/) for what each ruleset shows.

## The quick way: Try It!

Open the root pico in the developer UI and choose the **Try It!** tab. (Operators can show the tab on every pico, or hide it, with `show_tryit_menu` in the engine config.) Click **Thermostat**, then **Run in a new child pico**. The tab creates a child pico and installs `com.example.thermostat.bootstrap` on it. That one ruleset installs `io.picolabs.xmlui` and the thermostat, and records three readings. When the demo shows **ready**, open the dashboard links. **Remove** deletes the child.

The same window shows **the code**: the bootstrap and the rulesets it installed, each with its path on the engine's machine. Change one. For example, in `com.example.thermostat.krl` change `ent:threshold.defaultsTo(80)` to `65`, click **Flush**, and reload the dashboard: it says "Alert above 65 F". To contribute a change, make it in a clone of the [pico-engine repository](https://github.com/Picolab/pico-engine) and open a pull request.

The steps below do the same by hand, for every demo.

## 1. Prepare a pico

1. Open the developer UI and sign in.
2. Pick the pico that will serve the views. A new child pico keeps the demos apart from everything else.
3. On its **Rulesets** tab, install `io.picolabs.xmlui` from the engine:

   ```
   http://localhost:3000/krl/io.picolabs.xmlui.krl
   ```

## 2. Install a demo

On the same **Rulesets** tab, install the demo by URL. Use the raw GitHub file:

```
https://raw.githubusercontent.com/Picolab/pico-engine/master/demos/xmlui/com.example.hello.krl
```

or a `file://` URL to your checkout of the repository:

```
file:///path/to/pico-engine/demos/xmlui/com.example.hello.krl
```

Install the others the same way: `com.example.fav_color.krl`, `com.example.guestbook.krl`, `com.example.contacts.krl`, `com.example.thermostat.krl`.

## 3. Open it

A ruleset with a `@view` function has a **View** button on the Rulesets tab. Click it, pick a channel, and open the app. The page is at:

```
http://localhost:3000/ui/<eci>/<rid>/
```

`http://localhost:3000/ui/<eci>/` lists every app that channel can open.

The channel must allow `io.picolabs.xmlui` / `file` and the view's functions. Guestbook, Contacts, and Thermostat create channels like that when they are installed. Use those channels (tags `guestbook, app`, `contacts, app`, `thermostat, viewer`, `thermostat, admin`).

## 4. Try each demo

**Hello.** The page shows a heading and the ruleset id. There is nothing to click.

**Favorite color.** Enter a color such as `#3366cc` and submit. The card shows the color you picked. Reload the page: the pico remembers it.

**Guestbook.** Open it on the `guestbook, app` channel. Sign with a name and a message. The table refreshes with your entry.

**Contacts.** Open it on the `contacts, app` channel. It starts with Ada Lovelace and Grace Hopper. Add a contact, then click a name to open its detail page and add a note.

**Thermostat.** It has no readings until you send some. On the **Testing** tab, raise `thermostat` `new_reading` with `temperature` set to `72`, then `75`. Then open it on each of its channels:

- `thermostat, viewer` shows only the Dashboard. The Settings page is not reachable on this channel.
- `thermostat, admin` shows Dashboard and Settings. Settings changes the alert threshold.

On the Dashboard, **Display** opens a theme picker built from the shared `PicoSettings` and `PicoThemeField` components. The readings table is the ruleset's own `ReadingHistory` component.

**Temperature sensors (two picos).**

1. Create two child picos, one for the data and one for the view.
2. On the data pico, install `temperature_sensors.krl`.
3. On the view pico, install `io.picolabs.xmlui` and `com.example.temperature_sensors_view.krl`.
4. Create a relationship between the two picos. On the view pico's **Relationships** tab, note the relationship's `Id`. It is the same on both picos.
5. On the view pico, raise `temperature_sensors_view` `link_data_pico` with `relationship_id` set to that `Id`.
6. Open the view on its `temperature_sensors_view, app` channel. The table shows the data pico's readings.

## If something doesn't load

| Symptom | Check |
|---------|-------|
| HTTP 403 | The channel's query policy does not allow `io.picolabs.xmlui` / `file`, or the view function |
| HTTP 404, or a component not found | `io.picolabs.xmlui` is not installed on this pico, or the function is not a `@view` or `@component` the channel allows |
| The page loads but shows no data | The channel does not allow the page's queries or events, or (on an OAuth mesh) no access token is set |
| A change to the KRL doesn't show | Flush the ruleset on the Rulesets tab, then reload the page |
