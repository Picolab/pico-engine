# Pico views with XMLUI

**Status:** draft (2026-11-04)
**Audience:** engine and wrangler contributors; anyone building UIs for picos (PLAN, Manifold, the IIWF CRM)
**Related:** [`pico-schemas.md`](pico-schemas.md) (annotations, `channelSchema`), [`channel-policy-1.8.md`](channel-policy-1.8.md), [`pico-relationships.md`](pico-relationships.md) (per-user meshes for the IIWF CRM)

---

## Summary

A pico should be able to present its own user interface. The design follows two decades of practice: markup lives in KRL, and a **view is a shared function** that returns it. The new part is the markup language. Views return [XMLUI](https://xmlui.org) markup, a declarative, buildless component language whose `DataSource` and `APICall` components bind directly to a pico's queries and events.

The engine change is deliberately small: serve the XMLUI runtime, and add one route family that maps an XMLUI app's file requests onto queries. Everything else (the app shell, navigation, view discovery, helper components, URL helpers) is a **wrangler-adjacent ruleset shipped with the engine**, `io.picolabs.xmlui`, the same way PDS ships today.

Channel policy governs views exactly as it governs queries. A channel that can't call a view function can't see that view, and the view can only reach the queries and events that channel allows.

---

## Prior art

### Classic KRL (2008–2013)

The classic engine's web actions (`notify`, `replace_inner`, `append`, `after`, `float`, `emit`) changed the DOM of the page that raised `pageview`. HTML was built in KRL heredocs with `#{}` interpolation. `watch(selector, event)` attached browser listeners that raised `web click/change/submit` events back to the engine, where rules read fields with `page:param` and changed the page again. The engine returned JavaScript to a browser runtime (or a directive document for non-browser endpoints). In 2010 `send_directive` generalized this to JSON directives; the Node engine kept only `noop` and `send_directive`.

### PicoStack and PLAN (Bruce Conrad, 2023–)

[PicoStack](https://github.com/b1conrad/PicoStack) and the [Pico Labs Affiliate Network](https://github.com/Picolab/PLAN) use the Node engine as a web app stack, with no engine support beyond the `.html` query suffix and the `_redirect` and `_cookie` directives:

| Piece | PLAN |
|-------|------|
| Pages | Shared functions returning HTML from heredocs, fetched as `/c/{eci}/query/{rid}/{fn}.html` |
| Frame | A library ruleset (`html`, later `html.plan`) provides `header`, `footer`, `cookies`, `session_valid` |
| Apps | `io.picolabs.plan.apps` turns an installed ruleset into an app: a channel per app (events in a domain derived from the RID, queries to that RID only); the first shared function is the home page |
| Forms | HTML forms `POST` to `/sky/event/…`; a rule replies `send_directive("_redirect", {"url": referrer})` |
| Sessions | A `_cookie` directive and a rotating secret checked in KRL |
| Interactivity | Hand-written JavaScript in heredocs |
| Detail pages | Pages take parameters in the query string (`thing.html?eci=…`, `journal(eci)`), reached from a list page |
| Channel rotation | An app's channel ECI is replaced on login or request (`app_eci_rotated`), and older channels with the same tags are deleted |
| Dependencies | An app raises `module_needed` and the apps ruleset installs the module it uses |
| Remote data | The Manifold app reaches another engine over HTTP with a stored host and API key |
| Building apps | The bazaar generates a boilerplate app ruleset from a RID, app name, and event domain; `io.picolabs.plan.ruleset` edits and hosts KRL from the browser |

Some PLAN pages interpolate stored data straight into HTML (journal entries, for example), which is a cross-site scripting risk. This design's rule that view markup carries no data (see Authentication) comes partly from that.

`com.vcpnews.fav-color` / `fav-color-sample` is the clearest small example and is the baseline for this design's first proof of concept.

### What carries over

| Practice | Keep? | In this design |
|----------|-------|----------------|
| Markup in KRL, `#{}` for constants | Yes | View functions return XMLUI markup |
| A view is a shared function | Yes | Same; policy and schema apply unchanged |
| Library ruleset for the frame | Yes | `io.picolabs.xmlui` builds the `App` shell and navigation |
| Channel per app, scoped to its RID | Yes | Recommended convention; the ruleset offers a helper |
| Forms → event → `_redirect` → reload | Replaced | `APICall` raises the event; `DataSource`s refresh in place |
| DOM-editing actions | Replaced | XMLUI's reactive binding |
| Session code in KRL | Retired | The engine's OAuth server (1.5+): the app is an OAuth client of its own engine |
| Hand-written JavaScript | Mostly retired | XMLUI components; expressions where needed |

---

## Goals and non-goals

**Goals**

1. A ruleset can ship one or more views, written in KRL, that appear when the ruleset is installed.
2. A person signed in to their mesh opens an app (a ruleset) on one of the pico's channels and gets navigation listing that app's views the channel can see.
3. Views read with queries and change things with events, through the same channel, under the same policy.
4. The engine change is small enough to review in one sitting; the rest is KRL that can evolve without engine releases.

**Non-goals (v1)**

- Live updates of any kind, push or polling. A view loads its data when it opens and refetches after its own events; data changed elsewhere shows up on the next load.
- Custom React components or XMLUI extension packages.
- Theming beyond XMLUI's defaults and a per-app theme setting.
- Views reaching across picos directly. A view uses its own pico's queries; a pico that needs another pico's data proxies it (as the CRM client pico does for the CRM mesh).

---

## Model

### A view is a shared function

```krl
ruleset com.example.fav_color {
  meta {
    name "Favorite color"
    use module io.picolabs.xmlui alias ui
    shares favColor, colorView
  }
  global {
    /** Current favorite color */
    favColor = function() { {"name": ent:colorname, "code": ent:colorcode} }

    /**
     * Pick a favorite color
     * @view "Favorite color"
     */
    colorView = function() {
      <<<Component name="ColorView">
  <DataSource id="fav" url="#{ui:query_url("favColor")}" />
  <Text when="{!fav.value.name}">You have not yet selected a favorite color.</Text>
  <Card when="{fav.value.name}" title="Your favorite color: {fav.value.name}" />
  <APICall id="pick" method="post" url="#{ui:event_url("fav_color", "fav_color_selected")}"
           body="{$param}" onSuccess="fav.refetch()" />
  <Form onSubmit="(toSave) => pick.execute(toSave)">
    <FormItem bindTo="fav_color" label="Color (#rrggbb)" />
  </Form>
</Component>
>>
    }
  }
  rule recordFavColor {
    select when fav_color fav_color_selected
      fav_color re#^(\#[a-f0-9]{6})$# setting(fav_color)
    fired {
      ent:colorcode := fav_color
    }
  }
}
```

The example is illustrative; exact XMLUI attribute names are settled in the spike. Points to notice:

- `#{}` is evaluated by KRL when the view is generated, for trusted constants (`meta:rid`). Live data comes through XMLUI bindings (`{fav.value.name}`), which XMLUI renders as text, not HTML.
- URLs are absolute, use the public Sky API, and are built by the module: `ui:query_url("favColor")` becomes `/sky/query/{eci}/{rid}/favColor`, where `{eci}` is `meta:eci`, the channel the view was requested on, and `{rid}` defaults to the calling ruleset. The view therefore always talks to the channel it was opened on, and nothing depends on where the browser thinks it is.
- The form hands its fields to the `APICall`, which posts them as the event's attributes (the Sky event routes accept JSON bodies); on success the `DataSource` refetches. No redirect, no reload.

### `@view` annotation

A view is a shared function carrying a `@view "Title"` doc tag. The tag:

- puts the view in the app's navigation, with that title;
- names the XMLUI component (`colorView` → `ColorView`), unless the markup's own `<Component name>` says otherwise. Avoid names that match built-in XMLUI tags (`List`, `Table`, `Form`, …): `Main.xmlui` uses `<List />` for a function named `list`, which loads the framework **List**, not `components/List.xmlui`. Prefer names like `contactsPage` → `<ContactsPage />` (use `@view "Title" /route` when the URL should not match the function name);
- optionally takes a path (`@view "Favorite color" /color`);
- may put **route parameters** in the path (`@view "Organization" /org/:id`). A view with parameters is a detail page: it gets a `Page` but no `NavLink`, and other views link to it (`<Link to="/org/{$item.id}">`). Its component reads the parameters as `{$routeParams.id}` and passes them to its queries as bindings, so the markup still carries no data.

Today the parser records unknown doc tags and `krl check` warns about them (`annotationLint.js`, `lintUnknownDocTags`). Adding `@view` to the known tags and to `rulesetSchema` output is the only toolchain change.

Only functions tagged `@view` are views. There is no fallback convention and no compatibility layer for PLAN's HTML pages; PLAN can be rewritten on this tooling if that becomes worthwhile.

### An app is a ruleset

An app is one ruleset: its `@view` functions are the app's pages, and its `name` is the app's title. There is no notion of an app assembled from several rulesets. KRL already has two ways to divide an app's work, and they cover the cases a multi-ruleset app would:

| Need | Mechanism |
|------|-----------|
| Reuse markup, data shaping, or helpers | **Modules.** A library ruleset `provides` functions that return markup fragments or data; the app ruleset `use`s it and includes the results with `#{}` or calls them from its own shared functions. A module's functions are not views and don't appear in navigation unless the app wraps them in its own `@view` function |
| Reuse behavior | **Events.** The app's rules raise events (or the view's `APICall` raises one) that rules in other installed rulesets handle |

A pico with several app rulesets has several apps, each at its own URL. A channel's policy decides which of them, and which of each app's views, a person can reach.

---

## Engine changes (all of them)

| # | Change | Where | Size |
|---|--------|-------|------|
| E1 | Ship the XMLUI standalone runtime as a static asset (`public/xmlui/<version>.js`): the latest release when the work starts, upgraded with engine releases as needed. Because it ships with the engine, an XMLUI upgrade is just part of an engine release, tested with the example rulesets. XMLUI is MIT, copyright /n software, the same license as the engine | `packages/pico-engine/public/` | Asset only; no CDN at runtime, so it works offline and on a Pi |
| E2 | Route `GET /ui/:eci/:rid/*`: call `io.picolabs.xmlui:file(rid, path)` on that channel and return the string raw with a content type chosen by extension (`.html`, `.xmlui`, `.xs`, `.json`, `.css`); `/ui/:eci/:rid/` maps to `index.html`, and `/ui/:eci/` to a launcher listing the apps visible on the channel | `server.ts` | One handler, beside `handleSkyQuery`. No token: app files are code, not data (see Authentication) |
| E3 | Recognize `@view` in doc comments; include `view: {title, path}` in `rulesetSchema` / `channelSchema` entries | `krl-parser` `docComment.ts`, schema derivation, `annotationLint.js` | Small; follows `@attr` / `@returns` |
| E4 | Ship `io.picolabs.xmlui.krl` in the engine's `krl/` directory as an **optional** ruleset, like `io.picolabs.oauth`: available to install, but not in `BUNDLED_KRL_FILES`, so it is not part of the base set every root pico gets | `krl/` | One file, no code change |

**Why `/ui/` and not `/sky/ui/`.** `/sky/` versions the event and query wire format (it succeeded `/blue/`) for clients that evolve independently of the engine. The UI route has no independent clients: the path-to-file mapping, the shell and its sign-in handshake, and the pinned XMLUI runtime all ship in the same engine release as the route, and the data views exchange already goes through `/sky/query` and `/sky/event`. If the Sky format moves, `ui:query_url` and `ui:event_url` move with it. The UI URL is also something people bookmark, so it should not change with an API version. It is a document route, like the developer UI and `/docs`, and stays unversioned.

The engine does not know what a view, a navigation menu, or an app is. E2 forwards a ruleset id and a path to a query; E3 is annotation plumbing like the rest of 1.8 schemas.

**Why a route rather than more query suffixes.** XMLUI's standalone runtime fetches `Main.xmlui`, `config.json`, and `components/<Name>.xmlui` relative to the page. Query URLs have exactly two path segments after the ECI (`rid`, `name`), so `components/ColorView.xmlui` can't map onto them. One route that hands the whole path to a known ruleset is smaller and more general than teaching `handleSkyQuery` about nested paths and new suffixes.

---

## `io.picolabs.xmlui` (shipped ruleset)

Optional, like `io.picolabs.oauth`: the engine ships it but installs it nowhere by default. A pico gets it when it should serve views, usually from an app's bootstrap (Manifold's, the IIWF CRM client's) or by hand in the developer UI. Without it, `/ui/:eci/*` has nothing to call and returns not found. It provides a module for view authors and answers the route's `file` query.

Because it is optional, an app that uses it makes sure it is installed, the way PLAN apps raise `module_needed`: the app's bootstrap installs `io.picolabs.xmlui` before the app ruleset, or the app's own install rule raises `wrangler install_ruleset_request` for it. The spike checks what `use module io.picolabs.xmlui` requires when the module is registered with the engine but not yet installed on the pico.

### `file(rid, path)`: the virtual app tree

| Path | Returns |
|------|---------|
| `index.html` | Shell: `<base href="/ui/{eci}/{rid}/">`, the runtime `<script src="/xmlui/<version>.js">`, and the small OAuth client that obtains a token before the app loads. Like every app file, it contains no pico data |
| `Main.xmlui` | `<App name="{ruleset name}" layout="vertical-sticky" scrollWholePage="false">` with a `NavPanel` when the app has more than one view (one `NavLink` per non-parametric view visible on the channel) and `Pages` (one `Page` per view rendering its component). The layout attrs avoid XMLUI’s default `condensed-sticky` + document scroll, which breaks page layout in Safari/WebKit. |
| `config.json` | App name, theme, and globals (`eci`, `picoName`) |
| *(launcher, `rid` empty)* | A plain page listing the rulesets on this pico that have `@view` functions visible on the channel, each linking to `/ui/{eci}/{rid}/` |
| `components/<Name>.xmlui` | The view function's output, fetched **through the requesting channel** so policy applies |

**Which views are visible.** `file` reads `wrangler:channelSchema(meta:eci)`, the 1.8 schema for the channel the request came in on, and keeps the shared functions of ruleset `rid` tagged `@view` (for the launcher, every ruleset with at least one). A view whose function the channel's query policy denies never appears. It renders each view by querying itself through the same channel (`wrangler:picoQuery(meta:eci, rid, fn)`), so the ruleset can't widen what the channel allows.

### Module functions (`use module io.picolabs.xmlui alias ui`)

Markup helpers are KRL functions that return XMLUI markup, so view authors don't hand-build URLs and the helpers need no XMLUI extension mechanism. Their output is a trusted constant and goes in with `#{}`.

| Function | Kind | Returns / does |
|----------|------|----------------|
| `ui:query_url(name, rid)` | function | `/sky/query/{meta:eci}/{rid}/{name}`; `rid` defaults to the calling ruleset |
| `ui:event_url(domain, type)` | function | `/sky/event/{meta:eci}/xmlui/{domain}/{type}` (event id `xmlui`) |
| `ui:query(id, name, opts)` | function | `<DataSource id url="{ui:query_url(name)}" headers="{appGlobals.auth}">`; `opts`: `rid` (another ruleset on this pico), `args` (map, sent as query parameters; values may be XMLUI bindings), `select` (`resultSelector`) |
| `ui:event(id, domain, type, opts)` | function | `<APICall id method="post" url="{ui:event_url(domain, type)}" headers="{appGlobals.auth}" body="{$param}">`; `opts`: `refresh` (array of `DataSource` ids to refetch on success), `confirm` (confirmation message) |
| `ui:escape(s)` | function | `s` escaped for inclusion in markup, for constants that may contain markup characters (labels, help text). Not a way to put data in markup: app files are open, so data always goes through bindings |
| `ui:app_url(tags)` | function | The calling ruleset's app URL, `/ui/{eci}/{rid}/`, on the newest channel with `tags` (PLAN's `app_url`) |
| `ui:create_app_channel(tags, domains, queries)` | defaction | Creates a channel whose event policy allows `domains` and whose query policy allows the calling ruleset's `queries` (all its shares when `queries` is null) plus `io.picolabs.xmlui:file`, without which the UI route can't serve anything. PLAN's per-app channel, made reusable |
| `ui:rotate_app_channel(tags)` | defaction | Creates a new channel with the same tags and policy as the newest one with `tags`, then deletes the older ones. The app URL carries the ECI and app files are open, so the ECI acts like a link password; rotating it is how a person retires one that leaked. PLAN's `app_eci_rotated`, made reusable |

---

## Example rulesets

Five rulesets, from smallest to the patterns the IIWF CRM needs. They follow the engine's KRL conventions and are written to be the spike's test fixtures (`demos/xmlui/`). XMLUI attribute names are as documented today; the spike confirms them.

### 1. Hello: a view and nothing else

The minimum: one shared function tagged `@view`. No module, no channel setup; open any channel whose query policy allows `hello` and `io.picolabs.xmlui:file`.

```krl
ruleset com.example.hello {
  meta {
    name "Hello"
    shares hello
  }
  global {
    /**
     * A first view
     * @view "Hello"
     */
    hello = function() {
      <<<Component name="Hello">
  <H1>Hello</H1>
  <Text>This view is a shared function in #{meta:rid}.</Text>
</Component>
>>
    }
  }
}
```

### 2. Guestbook: read, write, and an app channel

A list and a form on one view, using the markup helpers, plus a channel scoped to this ruleset (PLAN's per-app channel) created at install time.

```krl
ruleset com.example.guestbook {
  meta {
    name "Guestbook"
    use module io.picolabs.xmlui alias ui
    shares entries, book
  }
  global {
    /**
     * Guestbook entries, newest first
     * @returns array
     */
    entries = function() {
      ent:entries.defaultsTo([]).reverse()
    }

    /**
     * Sign and read the guestbook
     * @view "Guestbook"
     */
    book = function() {
      <<<Component name="Book">
  #{ui:query("entries", "entries")}
  #{ui:event("sign", "guestbook", "signed", {"refresh": ["entries"]})}
  <Form onSubmit="(toSave) => sign.execute(toSave)">
    <FormItem bindTo="name" label="Name" />
    <FormItem bindTo="message" label="Message" type="textarea" />
  </Form>
  <Table data="{entries}">
    <Column bindTo="name" header="Name" />
    <Column bindTo="message" header="Message" />
    <Column bindTo="time" header="Signed" />
  </Table>
</Component>
>>
    }

    channel_tags = ["guestbook", "app"]
  }

  /**
   * Add an entry
   * @attr name Who is signing
   * @attr message What they wrote
   */
  rule sign {
    select when guestbook signed
      name re#(.+)# setting(name)
    pre {
      message = event:attr("message") || ""
    }
    fired {
      ent:entries := ent:entries.defaultsTo([])
        .append({"name": name, "message": message, "time": time:now()})
    }
  }

  rule create_app_channel {
    select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
    ui:create_app_channel(channel_tags, ["guestbook"], null)
  }
}
```

The person opens `ui:app_url(["guestbook", "app"])`. That channel allows only the `guestbook` domain and this ruleset's queries, so its launcher lists only the Guestbook app even if other rulesets on the pico have views.

### 3. Thermostat: two views, and policy deciding which you see

A dashboard and a settings view, served on two channels. The viewer channel can't query `settings`, so the Settings view doesn't appear there, and it can't raise `thermostat` events either. One app, two channels, and policy alone decides how much of it each person sees.

```krl
ruleset com.example.thermostat {
  meta {
    name "Thermostat"
    use module io.picolabs.xmlui alias ui
    shares readings, threshold, dashboard, settings
  }
  global {
    /**
     * Recent readings, newest first
     * @returns array
     */
    readings = function() {
      ent:readings.defaultsTo([]).reverse()
    }

    /**
     * Alert threshold in degrees F
     * @returns number
     */
    threshold = function() {
      ent:threshold.defaultsTo(80)
    }

    /**
     * Current temperature and history
     * @view "Dashboard"
     */
    dashboard = function() {
      <<<Component name="Dashboard">
  #{ui:query("readings", "readings")}
  #{ui:query("threshold", "threshold")}
  <Card title="Now: {readings.value[0].temperature} F"
        subtitle="Alert above {threshold.value} F" />
  <Table data="{readings}">
    <Column bindTo="time" header="Time" />
    <Column bindTo="temperature" header="Temperature (F)" />
  </Table>
</Component>
>>
    }

    /**
     * Change the alert threshold
     * @view "Settings"
     */
    settings = function() {
      <<<Component name="Settings">
  #{ui:query("threshold", "threshold")}
  #{ui:event("setThreshold", "thermostat", "threshold_set",
             {"refresh": ["threshold"], "confirm": "Change the alert threshold?"})}
  <Form data="{{ threshold: threshold.value }}"
        onSubmit="(toSave) => setThreshold.execute(toSave)">
    <FormItem bindTo="threshold" label="Alert above (F)" type="integer" />
  </Form>
</Component>
>>
    }

    viewer_tags = ["thermostat", "viewer"]
    admin_tags = ["thermostat", "admin"]
  }

  /**
   * Record a temperature reading (shown on the Dashboard view).
   * @attr temperature Number Degrees Fahrenheit
   * @example "room temperature" { "temperature": "72" }
   */
  rule record_reading {
    select when thermostat new_reading
      temperature re#(.+)# setting(temperature)
    fired {
      ent:readings := ent:readings.defaultsTo([])
        .append({"temperature": temperature.as("Number"), "time": time:now()})
    }
  }

  /**
   * Set the alert threshold (same as the Settings view form).
   * @attr threshold Number Degrees Fahrenheit
   * @example "alert at 80 F" { "threshold": "80" }
   */
  rule set_threshold {
    select when thermostat threshold_set
      threshold re#^(\d+)$# setting(threshold)
    fired {
      ent:threshold := threshold.as("Number")
    }
  }

  rule create_app_channels {
    select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
    every {
      ui:create_app_channel(viewer_tags, [], ["readings", "threshold", "dashboard"])
      ui:create_app_channel(admin_tags, ["thermostat"], null)
    }
  }
}
```

### 3b. Split data and view: two picos (e.g. `temperature_sensors` and `temperature_sensors_view`)

KRL **`use module` imports another ruleset on the *same* pico** so shared functions run in-process. A view ruleset installed only on a **different** pico cannot `use module` to call `com.example.temperature_sensors` on the data pico; those functions are not in its module graph.

Instead, the view pico **proxies** a query to the data pico:

- **Layer 2 (DID) relationships:** use `io.picolabs.subscription:queryOnSub` with the **relationship id** (`Id` on the Developer UI Relationships tab). Do **not** pass `Remote Tx DID` (`did:peer:…`) to `wrangler:picoQuery` — that string is not a channel ECI; `queryOnSub` dispatches over DIDComm correctly.
- **Legacy (ECI) relationships:** the established bus has a **Remote Tx ECI**; `wrangler:picoQuery` on that ECI is fine, or you can still use `queryOnSub` with the same `Id`.

```krl
ruleset com.example.temperature_sensors_view {
  meta {
    name "Temperature sensors (view pico)"
    use module io.picolabs.subscription alias sub
    use module io.picolabs.xmlui alias ui
    shares latestReadingsForView, dashboard
  }
  global {
    sensors_rid = "com.example.temperature_sensors"

    /**
     * Latest readings from the sensors pico (requires ent:sensors_relationship_id = established Id).
     * @returns array
     */
    latestReadingsForView = function() {
      sub:queryOnSub(ent:sensors_relationship_id, sensors_rid, "latestReadings", {})
    }

    /**
     * @view "Dashboard"
     */
    dashboard = function() {
      <<<Component name="Dashboard">
  #{ui:query("readings", "latestReadingsForView")}
  <Table data="{readings}">
    <Column bindTo="temperature" header="Temperature (F)" />
    <Column bindTo="time" header="Time" />
  </Table>
</Component>
>>
    }
  }
}
```

The `@view` markup still binds only to **this** pico’s shared functions (`latestReadingsForView`); those functions perform the cross-pico query.

### 4. CRM client: a view over another pico's data

Views use only their own pico's queries and events. When the data lives elsewhere (here, the IIWF CRM mesh, reached through a relationship), the person's own pico proxies it. The view binds to local functions; the relationship's role on the CRM side decides what the proxy can get. This is the client pattern from the IIWF CRM design (§6.9 there).

```krl
ruleset org.iiwfoundation.client.sponsors {
  meta {
    name "IIWF sponsorships"
    use module io.picolabs.wrangler alias wrangler
    use module io.picolabs.xmlui alias ui
    shares summary, sponsorsView
  }
  global {
    staff_rid = "org.iiwfoundation.staff"

    /**
     * Sponsorship summary for one event, fetched from the CRM over the relationship
     * @param event_number IIW number, e.g. 44
     * @returns map
     */
    summary = function(event_number) {
      wrangler:picoQuery(ent:staff_tx, staff_rid, "eventSummary", {"event": event_number})
    }

    /**
     * Sponsorships for an event, with a way to propose a status change
     * @view "Sponsorships"
     */
    sponsorsView = function() {
      <<<Component name="SponsorsView">
  <TextBox id="ev" label="Event" initialValue="44" />
  #{ui:query("sum", "summary", {"args": {"event_number": "{ev.value}"}})}
  #{ui:event("propose", "crm_client", "propose_status", {"refresh": ["sum"]})}
  <Text>Sold {sum.value.sold} of {sum.value.available}; paid {sum.value.paid}</Text>
  <Table data="{sum.value.orgs}">
    <Column bindTo="name" header="Organization" />
    <Column bindTo="status" header="Outreach" />
    <Column header="">
      <Button label="Mark declined"
              onClick="propose.execute({org: $item.id, event: ev.value, status: 'declined'})" />
    </Column>
  </Table>
</Component>
>>
    }
  }

  /**
   * Send a proposed outreach status to the CRM; it waits there for confirmation
   * @attr org CRM org id
   * @attr event IIW number
   * @attr status Proposed outreach status
   */
  rule forward_proposal {
    select when crm_client propose_status
    event:send({
      "eci": ent:staff_tx,
      "domain": "crm",
      "type": "propose_status",
      "attrs": event:attrs.delete("_headers")
    })
  }
}
```

Three things to notice: the `"{ev.value}"` inside the `#{}` map is passed through as an XMLUI binding, so the query reruns when the event number changes; `_headers` is removed before forwarding, because the Sky routes add the browser's request headers to every event's attributes; and the button proposes rather than commits, matching the agent and approver split in the CRM design.

### 5. Contacts: a list page and a detail page

A list view in the navigation, and a detail view with a route parameter that the list links to. The detail view never sees the id when its markup is generated; it reads it from the route in the browser and sends it as a query argument.

```krl
ruleset com.example.contacts {
  meta {
    name "Contacts"
    use module io.picolabs.xmlui alias ui
    shares contacts, contact, contactsPage, detail
  }
  global {
    /**
     * All contacts, sorted by name
     * @returns array
     */
    contacts = function() {
      ent:contacts.defaultsTo({}).values()
        .sort(function(a, b) { a{"name"} cmp b{"name"} })
    }

    /**
     * One contact
     * @param id Contact id
     * @returns map
     */
    contact = function(id) {
      ent:contacts{id}
    }

    /**
     * Everyone, linking to each person's page
     * @view "Contacts" /list
     */
    contactsPage = function() {
      <<<Component name="ContactsPage">
  #{ui:query("contacts", "contacts", {"rid": meta:rid})}
  #{ui:event("add", "contacts", "contact_added", {"rid": meta:rid, "refresh": ["contacts"]})}
  <Form onSubmit="(data) => add.execute(data)">
    <FormItem bindTo="name" label="Name" required />
    <FormItem bindTo="email" label="Email" />
  </Form>
  <Table data="{contacts}">
    <property name="noDataTemplate">
      <Text value="No contacts" variant="strong" />
    </property>
    <Column header="Name">
      <Link to="/contact/{$item.id}">{$item.name}</Link>
    </Column>
    <Column bindTo="email" header="Email" />
  </Table>
</Component>
>>
    }

    /**
     * One person's details and notes
     * @view "Contact" /contact/:id
     */
    detail = function() {
      <<<Component name="Detail">
  #{ui:query("person", "contact", {"args": {"id": "{$routeParams.id}"}})}
  #{ui:event("note", "contacts", "note_added", {"refresh": ["person"]})}
  <H2>{person.value.name}</H2>
  <Text>{person.value.email}</Text>
  <List data="{person.value.notes}">
    <Text>{$item}</Text>
  </List>
  <Form onSubmit="(toSave) => note.execute({id: $routeParams.id, text: toSave.text})">
    <FormItem bindTo="text" label="Add a note" type="textarea" />
  </Form>
</Component>
>>
    }
  }

  /**
   * Add a contact
   * @attr name Full name
   * @attr email Email address
   */
  rule add_contact {
    select when contacts contact_added
      name re#(.+)# setting(name)
    pre {
      id = random:uuid()
    }
    fired {
      ent:contacts{id} := {"id": id, "name": name, "email": event:attr("email"), "notes": []}
    }
  }

  /**
   * Add a note to a contact
   * @attr id Contact id
   * @attr text The note
   */
  rule add_note {
    select when contacts note_added
      id re#(.+)#
      text re#(.+)#
      setting(id, text)
    pre {
      notes = ent:contacts{[id, "notes"]}
    }
    if notes then noop()
    fired {
      ent:contacts{[id, "notes"]} := notes.append(text)
    }
  }
}
```

The navigation shows only Contacts. Clicking a name follows XMLUI's in-app route to `/contact/{id}`, where Detail fetches `contact` with that id through the same channel. Whether XMLUI's standalone routing uses hash URLs under `/ui/{eci}/{rid}/` is one of the details the spike confirms.

---

## Authentication, authorization, and safety

| Concern | Approach |
|---------|----------|
| Which API views use | Only the public Sky API (`/sky/query`, `/sky/event`). `/c/` routes are internal to the engine and wrangler, and views never use them. A view is therefore just another Sky client, on the same footing as Home Assistant or any integrator |
| Who can open the app | In a mesh that requires OAuth on Sky routes, the shell is an **OAuth client of its own engine**: authorization code with PKCE (1.5+), the person signs in to their mesh with a passkey and approves, and the token is scoped to that mesh. The shell keeps the token in memory and exposes it to XMLUI as `appGlobals.auth`, which the markup helpers attach to every `DataSource` and `APICall`. In a mesh without OAuth, the ECI is the capability, as it is for every Sky client today. In the per-user mesh pattern, people open **their own** pico's UI |
| What they can see | Views visible = `@view` functions the channel's query policy allows (via `channelSchema`) |
| What they can do | The view's `APICall`s go to the same channel; event policy decides. 1.8 deny-overrides-permit is what makes a narrow channel stay narrow |
| Cross-site requests | Bearer tokens in a header, not cookies, so the usual CSRF exposure of cookie-authenticated `POST`s does not arise |
| App files are open | Everything under `/ui/` (shell, `Main.xmlui`, view components, launcher) is served without a token. These files are the app's code, the same markup that is in the ruleset source, plus the ECI and RID that are already in the URL. XMLUI's own components come from the runtime bundle. The rule that makes this safe: **view markup never carries pico data**. Data reaches the browser only through `/sky/query` and `/sky/event`, which require the token where the mesh requires OAuth. The cost is that someone holding a channel's ECI can see which apps and views it exposes, which is what the channel's discovery schema already shows |
| Injection and data in markup | XMLUI renders bound values as text. `#{}` inserts raw text into markup, so it is only for constants (`meta:rid`, labels, URLs from the helpers). `krl check` warns when a `@view` function interpolates entity variables, PDS reads, or other data, since that would put data in an open file and bypass escaping |
| Code in views | XMLUI expressions are JavaScript, so a view is code. Views come only from installed rulesets, so installing a ruleset is the trust decision, as it already is for its rules |

---

## Developer experience

- **Developer UI:** a "View" link beside each ruleset that has `@view` functions, opening `/ui/{eci}/{rid}/` on a chosen channel, next to the Docs and Testing tabs.
- **`krl check`:** validates that a `@view` function's heredoc is well-formed XML; warns on interpolated entity variables (above).
- **Agents:** views are in `channelSchema`, so the 1.8 MCP and coding agents can list and fetch them. An agent can write a view the same way it writes a rule.
- **Heredocs:** XMLUI markup rarely contains `>>`, but the spike should confirm nothing in normal markup collides with the heredoc terminator.

---

## Decisions settled during review

| Question | Decision |
|----------|----------|
| Annotation or convention | `@view` only; no PLAN compatibility layer |
| Installed by default | No; `io.picolabs.xmlui` is optional, like `io.picolabs.oauth` |
| Multi-ruleset apps | No; an app is one ruleset, which divides work with modules and events |
| Live updates | None in v1 (no push, no polling) |
| XMLUI version | Latest release when work starts; upgraded with engine releases; MIT |
| Route prefix | `/ui/:eci/:rid/*`, unversioned |
| Tokens for app files | Not needed; app files are open, and data goes only through token-guarded Sky calls |
| Event-then-query | Not in v1. Views raise the event, then refetch. A public `/sky/` version of the combined route is added only if real views show the extra round trip matters. A rule can also return new state with `send_directive`, which the view's `APICall` receives in its response |

No open questions remain; the spike (S0) checks the XMLUI details the examples assume.

---

## Plan

| Step | Scope | Exit |
|------|-------|------|
| **S0 Spike** | Hand-written shell + `Main.xmlui` served from a test ruleset via `.html` and a temporary route; Fav Color and the Hello example as XMLUI views | Both work end to end; heredoc, URL, and XMLUI attribute questions answered; what `use module` needs when `io.picolabs.xmlui` isn't installed yet |
| **S1 Engine** | E1–E4 | `GET /ui/{eci}/{rid}/` renders an app on a test pico, with and without mesh OAuth; ava suite `test:views` |
| **S2 Ruleset** | `io.picolabs.xmlui`: `file`, shell, navigation from `channelSchema`, markup helpers, `create_app_channel` | Examples 1–3 and 5 run as written; the thermostat viewer channel hides Settings; the launcher lists the three apps on a channel that can see them |
| **S3 Tooling** | Developer UI "View" link; `krl check` XML validation and interpolation warning; docs page under `public/docs/` | A new view can be written, checked, and opened without leaving the developer UI |
| **S4 Adoption** | IIWF CRM client views (example 4); a Manifold dashboard view | Used by a real app |

## References

- [PicoStack](https://github.com/b1conrad/PicoStack) and its blog (picostack.org); [PLAN](https://github.com/Picolab/PLAN), especially `krl/html.plan.krl`, `krl/io.picolabs.plan.apps.krl`, `krl/samples/com.vcpnews.fav-color.krl`
- Picolabs docs: (Classic) Web Actions; (Classic) `send_directive`
- Windley, "Forms, Events, and Dialoging in KRL" (2010); "A Big, Programmable Event Loop in the Cloud" (2010)
- XMLUI documentation: architecture (standalone mode, `Main.xmlui`, `components/`), `DataSource`, `APICall`
- This repo: `packages/pico-engine/src/server.ts` (`handleSkyQuery`, Sky routes and `requireSkyBearerIfOAuth`, `_redirect` / `_cookie`), `src/oauth/` (authorization code + PKCE), `src/bundledKrl.ts`, `krl-parser/src/docComment.ts`, `krl-compiler/src/annotationLint.js`
