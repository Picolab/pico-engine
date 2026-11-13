/**
 * Visitor log: signs visitors in and greets them. Its greeting word comes from
 * the configuration it was installed with, and it uses
 * com.example.visitors.format as a module.
 *
 * On install it creates its own channel, with a policy built from this
 * ruleset's schema: every event its documented rules select (except
 * wrangler's) and every function it shares and documents. The schema is the
 * ruleset's documented API, so undocumented rules stay off the channel. If the channel already exists, the same rule updates it
 * in place, so the channel id, and every link that uses it, stays the same.
 * Flushing doesn't run install rules again, so the page has a button that does.
 */
ruleset com.example.visitors {
  meta {
    name "Visitor log"
    description "Signs visitors in and greets them; creates its own channel on install."
    author "PICOLABS"

    use module com.example.visitors.format alias format
    use module io.picolabs.wrangler alias wrangler
    use module io.picolabs.xmlui alias ui

    shares visitors, setup, visitorsPage
  }

  global {
    channel_tags = ["visitors", "app"]
    xmlui_rid = "io.picolabs.xmlui"

    greetingWord = function() {
      meta:rulesetConfig{"greeting"} || "Hello"
    }

    schema = function(rid) {
      wrangler:rulesetSchema(rid).defaultsTo({})
    }

    unique = function(list) {
      list.reduce(function(acc, item) { acc >< item => acc | acc.append([item]) }, [])
    }

    // Every event a documented rule selects, except wrangler's. The schema has
    // only rules and functions with doc comments.
    eventPolicy = function() {
      allow = schema(meta:rid){"operations"}.defaultsTo([])
        .map(function(op) { op{"entry"}.defaultsTo([]) })
        .reduce(function(a, b) { a.append(b) }, [])
        .filter(function(e) { e{"domain"} && e{"domain"} != "wrangler" })
        .map(function(e) { {"domain": e{"domain"}, "name": e{"name"} || "*"} })
      policy = {"allow": unique(allow), "deny": []}
      policy
    }

    // Every function this ruleset shares, and what the page shell needs.
    queryPolicy = function() {
      mine = schema(meta:rid){"queries"}.defaultsTo([])
        .map(function(q) { {"rid": meta:rid, "name": q{"name"}} })
      shell = schema(xmlui_rid){"queries"}.defaultsTo([])
        .filter(function(q) { not q{"component"}.isnull() })
        .map(function(q) { {"rid": xmlui_rid, "name": q{"name"}} })
        .append([{"rid": xmlui_rid, "name": "file"}])
      policy = {"allow": mine.append(shell), "deny": []}
      policy
    }

    /**
     * Everyone signed in, oldest first.
     * @returns Array of { name, message, time }
     */
    visitors = function() {
      ent:visitors.defaultsTo([])
    }

    /**
     * How this pico was set up: its rulesets, this ruleset's install
     * configuration, and the channels tagged visitors, app.
     * @returns Map
     */
    setup = function() {
      channels = wrangler:channels(channel_tags).map(function(c) {
        {
          "id": c{"id"},
          "events": c{["eventPolicy", "allow"]}.defaultsTo([])
            .map(function(r) { r{"domain"} + ":" + r{"name"} }).join(", "),
          "queries": c{["queryPolicy", "allow"]}.defaultsTo([]).length(),
          "this_page": c{"id"} == meta:eci => "yes" | ""
        }
      })
      result = {
        "rulesets": wrangler:installedRIDs().map(function(rid) { {"rid": rid} }),
        "config": meta:rulesetConfig.encode(),
        "channels": channels
      }
      result
    }

    /**
     * Sign in, and see how the bootstrap set this pico up.
     * @view "Visitor log"
     */
    visitorsPage = function() {
      setup_url = ui:query_url("setup", meta:rid, meta:eci)
      visitors_url = ui:query_url("visitors", meta:rid, meta:eci)
      arrived_url = ui:event_url("visitor", "arrived")
      check_url = ui:event_url("visitor_channel", "check_requested")
      duplicate_url = ui:event_url("visitor_channel", "duplicate_requested")
      cleanup_url = ui:event_url("visitor_channel", "cleanup_requested")
      <<
<Component name="VisitorsPage" var.said="">
  <DataSource id="setup" url="#{setup_url}" headers="{appGlobals.auth}" pollIntervalInSeconds="2" />
  <DataSource id="visitors" url="#{visitors_url}" headers="{appGlobals.auth}" />
  <APICall id="arrive" method="post" url="#{arrived_url}" headers="{appGlobals.auth}" body="{$param}"
           onSuccess="(result) => { said = result.directives.length ? result.directives[0].options.message : ''; visitors.refetch(); }" />
  <APICall id="check" method="post" url="#{check_url}" headers="{appGlobals.auth}"
           onSuccess="(result) => { said = result.directives.map((d) => d.name).join(', '); setup.refetch(); }" />
  <APICall id="duplicate" method="post" url="#{duplicate_url}" headers="{appGlobals.auth}"
           onSuccess="(result) => { said = result.directives.map((d) => d.name).join(', '); setup.refetch(); }" />
  <APICall id="cleanup" method="post" url="#{cleanup_url}" headers="{appGlobals.auth}"
           onSuccess="(result) => { said = result.directives.map((d) => d.name).join(', ') || 'nothing to clean up'; setup.refetch(); }" />
  <PicoTheme>
    <Card title="Visitor log"
          subtitle="A bootstrap ruleset installed this app: a formatting module first, then this ruleset with a greeting in its install configuration. On install, this ruleset made the channel this page uses." />
    <Form saveLabel="Sign in" onSubmit="(data) => arrive.execute(data)">
      <FormItem bindTo="name" label="Your name" initialValue="Ada" />
    </Form>
    <Card title="The pico said" subtitle="{said || '(nothing yet)'}" />
    <Table data="{visitors}">
      <Column bindTo="name" header="Visitor" />
      <Column bindTo="message" header="Greeted with" />
    </Table>

    <Card title="How the bootstrap set up this pico"
          subtitle="{'This ruleset was installed with the configuration ' + setup.value.config}" />
    <Table data="{setup.value.rulesets}">
      <Column bindTo="rid" header="Installed rulesets, in order" />
    </Table>

    <Card title="This app's channel"
          subtitle="Its policy was built from this ruleset's schema when the ruleset was installed. Try the buttons and watch the table." />
    <Table data="{setup.value.channels}">
      <Column bindTo="id" header="Channel" />
      <Column bindTo="events" header="Events it allows" />
      <Column bindTo="queries" header="Queries" />
      <Column bindTo="this_page" header="This page" />
    </Table>
    <HStack wrapContent="true">
      <Button label="Run the channel rule again" onClick="check.execute({})" />
      <Button label="Make a duplicate, the naive way" variant="outlined" onClick="duplicate.execute({})" />
      <Button label="Clean up duplicates" variant="outlined" onClick="cleanup.execute({})" />
    </HStack>
  </PicoTheme>
</Component>
>>
    }
  }

  /**
   * Sign a visitor in and greet them.
   * @attr name String "the visitor's name"
   * @example "Ada" { "name": "Ada" }
   */
  rule greet_visitor {
    select when visitor arrived
      name re#(\S.*)#
      setting(name)
    pre {
      message = format:greeting(greetingWord(), name)
    }
    send_directive("greeting", {"message": message})
    fired {
      ent:visitors := visitors().append({"name": name, "message": message, "time": time:now()})
      raise visitor event "greeted" attributes {"name": name}
    }
  }

  /**
   * On install, or when asked: update this app's channel if it exists, so its
   * id stays the same. Otherwise raise visitor_setup:channel_missing.
   */
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

  // No doc comment, so it isn't in the schema, and the channel doesn't allow
  // its event: only set_up_channel raises it.
  rule create_channel {
    select when visitor_setup channel_missing
    every {
      wrangler:createChannel(channel_tags, eventPolicy(), queryPolicy())
      send_directive("create_channel")
    }
  }

  /**
   * The naive way: create a channel every time, whether or not one exists.
   */
  rule make_duplicate {
    select when visitor_channel duplicate_requested
    every {
      wrangler:createChannel(channel_tags, eventPolicy(), queryPolicy())
      send_directive("make_duplicate")
    }
  }

  /**
   * Delete every channel tagged visitors, app except the one this request came
   * in on, which is the one the page is using.
   */
  rule clean_up_channels {
    select when visitor_channel cleanup_requested
    foreach wrangler:channels(channel_tags).filter(function(c) { c{"id"} != meta:eci }) setting(channel)
    every {
      wrangler:deleteChannel(channel{"id"})
      send_directive("clean_up_channels", {"deleted": channel{"id"}})
    }
  }
}
