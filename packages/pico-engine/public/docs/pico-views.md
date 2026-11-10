# Pico views

A **view** is a shared function that returns [XMLUI](https://xmlui.org) markup. Install the ruleset, open it on a channel that may call that function, and the engine serves the page.

The engine ships the XMLUI runtime (`/xmlui/0.12.7.js`) and the optional ruleset `io.picolabs.xmlui`. That ruleset builds the app shell, navigation, and the markup helpers. It is not installed on every pico. Install it from the engine:

`/krl/io.picolabs.xmlui.krl`

Channel policy applies to views the same way it applies to any other query. A channel that cannot call the function does not get that page. Live data still comes from `/sky/query` and `/sky/event` on that same channel.

Examples live in `demos/xmlui/` in the pico-engine repository. The design record is `docs/design/pico-views-xmlui.md`.

## Write a view

Tag the function with `@view` and return one `<Component>`:

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

`@view "Title"` sets the navigation label. The shell turns the function name into the component tag by capitalizing the first letter (`hello` → `<Hello />`). The `<Component name>` in the markup has to be that same name.

Give the function a path when you want a specific URL:

```krl
@view "Settings" /settings
```

With one view and no path, the page is `/`. With several views and no path, each page is `/` plus the function name. A path that contains `:` is a detail page (`@view "Contact" /contact/:id`). It is left out of the navigation. The component reads `{$routeParams.id}`. Other views link to it with `<Link to="/contact/{$item.id}">`.

Do not name a view after a built-in XMLUI tag (`List`, `Table`, `Form`, `Text`, …). A function named `list` becomes `<List />`, which is the framework list, not your page. Name it `contactsPage` and, if you want the URL to be `/list`, set the path.

`#{}` runs in KRL while the page is generated. Use it for constants: `meta:rid`, labels, and the helpers below. Do not put entity variables or query results in `#{}`. Those values belong in a `DataSource`, which XMLUI renders as text. `krl check` warns when a `@view` function interpolates `ent:` and when the heredoc is not well-formed XML.

## Open it

| URL | What it serves |
|-----|----------------|
| `/ui/{eci}` | A list of rulesets on this channel that have a view the channel may call |
| `/ui/{eci}/{rid}/` | That ruleset's app. Routes are hash URLs under this path |

The shell (`index.html`), `Main.xmlui`, and `config.json` come from `io.picolabs.xmlui:file`. `components/<Name>.xmlui` is the view function itself, queried on the channel in the URL.

In the developer UI, a ruleset with at least one `@view` function has a **View** button on the Rulesets tab. Pick the channel, then open the app.

The channel must allow:

- `io.picolabs.xmlui` / `file`, or the shell does not load
- the view function, or that component is not found
- every query and event the page calls

A policy denial on these routes is HTTP 403. Anything else the route cannot serve is HTTP 404.

These `/ui/` files are the ruleset's markup plus the ECI and RID already in the URL. They are served without a bearer token. Pico data is not in them. When the engine requires a bearer on `/sky/*`, the shell signs in and sends that token as `appGlobals.auth` on each `DataSource` and `APICall`.

## Read and write

`use module io.picolabs.xmlui alias ui`. The helpers return markup, so they go in the heredoc with `#{}`.

| Call | Result |
|------|--------|
| `ui:query(id, name, opts)` | A `DataSource`. `opts.rid` defaults to this ruleset. `opts.args` is a map of query parameters (values may be XMLUI bindings such as `"{$routeParams.id}"`). `opts.select` sets `resultSelector`. |
| `ui:event(id, domain, type, opts)` | An `APICall` that posts the form body. `opts.refresh` is a list of `DataSource` ids to refetch. `opts.confirm` sets a confirmation message. |
| `ui:query_url(name, rid, eci)` | `/sky/query/…` for this channel, ruleset, and query. |
| `ui:event_url(domain, type, eci)` | `/sky/event/{eci}/xmlui/{domain}/{type}`. |
| `ui:app_url(tags, app_rid)` | `/ui/{eci}/{rid}/` for the newest channel with those tags, or `null`. |
| `ui:escape(s)` | Escape `&`, `<`, `>`, and `"` for text placed in markup. |

A guestbook view:

```krl
meta {
  name "Guestbook"
  use module io.picolabs.xmlui alias ui
  shares entries, book
}
global {
  /** Guestbook entries, newest first. @returns Array */
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
  </Table>
</Component>
>>
  }
}
```

The matching rule selects `guestbook signed`. After it fires, `entries.refetch()` reloads the table. The full ruleset is `demos/xmlui/com.example.guestbook.krl`.

## App channel

`ui:create_app_channel(tags, domains, queries, app_rid)` creates a channel whose events are limited to `domains` (each name is `*`) and whose queries are `queries` on `app_rid`. When `queries` is `null`, every shared function of `app_rid` is allowed. The query policy always includes `io.picolabs.xmlui` / `file`.

```krl
rule create_app_channel {
  select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
  ui:create_app_channel(["guestbook", "app"], ["guestbook"], null, meta:rid)
}
```

`ui:rotate_app_channel(tags)` creates a new channel with the same tags and policy as the newest channel that already has those tags.

## What a view does not do

A view does not subscribe to changes made somewhere else. It loads when the page opens and refetches the `DataSource`s named in `opts.refresh` after its own event. Another pico's data is reached by a query on this pico that calls out, not by pointing a `DataSource` at the other pico. See `demos/xmlui/com.example.temperature_sensors_view.krl`.
