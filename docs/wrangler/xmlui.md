# Pico views: io.picolabs.xmlui

*Optional. Not installed by default. Install it on each pico that serves pages.*

`io.picolabs.xmlui` lets a pico serve web pages built with [XMLUI](https://xmlui.org). A ruleset function tagged `@view` is a page, at `/ui/<eci>/<rid>/`. One tagged `@component` is a reusable part that pages use as a tag. This ruleset supplies the app shell and navigation, the helpers a view uses to read and write the pico, and shared components: `PicoTheme`, `PicoSettings`, `PicoThemeField`, and `PicoAccessTokenField`.

## Install it

From a pico's **Rulesets** tab, install it from the engine:

```
http://localhost:3000/krl/io.picolabs.xmlui.krl
```

Or from a ruleset, the way the Try It! demos' bootstraps do:

```krl
raise wrangler event "install_ruleset_request" attributes {"url": meta:host + "/krl/io.picolabs.xmlui.krl"}
```

Install it before the rulesets that use it as a module.

## Use it

```krl
meta {
  use module io.picolabs.xmlui alias ui
  shares hello
}
global {
  /**
   * A greeting.
   * @view "Hello"
   */
  hello = function() {
    <<
<Component name="Hello">
  <Text>Hello from #{meta:rid}</Text>
</Component>
>>
  }
}
```

Its main helpers:

| Helper | Use |
|--------|-----|
| `ui:query_url(name, rid, eci)`, `ui:event_url(domain, type, eci)` | URLs for a page's `DataSource` and `APICall` |
| `ui:query(id, name, opts)`, `ui:event(id, domain, type, opts)` | The `DataSource` and `APICall` markup itself. Pass `{"rid": meta:rid}` to `ui:query` |
| `ui:create_app_channel(tags, domains, queries, rid)` | A channel for the app: events in `domains`, its queries, and what the page shell needs |
| `ui:rotate_app_channel(tags)` | A new channel like the newest one with those tags |
| `ui:app_url(tags, rid)` | The page's URL on the newest channel with those tags |

When a pico's set of rulesets changes, this ruleset adds any missing component queries to the channels that serve pages.

## Read more

- [Pico views](/pico-views): the full guide, including channels, components, and OAuth meshes.
- The [Pico views demos](/cookbook/xmlui/), and every Try It! demo, which all use it.
