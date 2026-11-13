# Pico views

Seven small rulesets that serve [XMLUI](https://xmlui.org) pages from a pico. Each one adds one idea, from a static page to a view that shows another pico's data. They are also the test fixtures for the engine's view routes.

Read [Pico views](/pico-views) for how views work. To install and open these, follow the [instructions](/cookbook/xmlui/instructions).

## The rulesets

| Ruleset | File | What it shows |
|---------|------|---------------|
| Hello | [`com.example.hello.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/xmlui/com.example.hello.krl) | A `@view` function and nothing else |
| Favorite color | [`com.example.fav_color.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/xmlui/com.example.fav_color.krl) | Reading with `ui:query` and writing with `ui:event`, then refreshing |
| Guestbook | [`com.example.guestbook.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/xmlui/com.example.guestbook.krl) | An app channel created on install with `ui:create_app_channel` |
| Contacts | [`com.example.contacts.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/xmlui/com.example.contacts.krl) | A list page and a detail page (`/contact/:id`), seeded with two contacts |
| Thermostat | [`com.example.thermostat.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/xmlui/com.example.thermostat.krl) | Two channels with different policies (viewer and admin), an app `@component`, and the shared `PicoSettings`, `PicoThemeField`, and `PicoTheme` components |
| Thermostat bootstrap | [`com.example.thermostat.bootstrap.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/xmlui/com.example.thermostat.bootstrap.krl) | Sets up the whole Thermostat demo on a new pico. The developer UI's **Try It!** tab runs it |
| Temperature sensors (data) | [`temperature_sensors.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/xmlui/temperature_sensors.krl) | Sample readings on a data pico |
| Temperature sensors (view) | [`com.example.temperature_sensors_view.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/xmlui/com.example.temperature_sensors_view.krl) | A view on one pico over data on another, reached through a relationship |

## What you need

- A running pico engine. Components (`@component` and the shared `Pico*` components, used by Thermostat) need pico-engine 1.9.4 or later.
- `io.picolabs.xmlui` installed on each pico that serves a view. The engine ships it at `/krl/io.picolabs.xmlui.krl` but does not install it anywhere by default.
