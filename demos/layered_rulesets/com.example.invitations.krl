/**
 * Invitations: the base ruleset. It accepts a full invitation, an http(s) URL
 * with a c_i parameter that encodes who is inviting, and records the
 * connection. Its one rule does one thing, then raises invite:connection_made
 * so other rulesets can react. It doesn't end the chain.
 *
 * Other rulesets layer on top without changing this one:
 * com.example.invitations.short_links selects the same event with a different
 * URL pattern, and com.example.invitations.welcome selects connection_made.
 *
 * The demo page installs them one at a time (layers:next_layer_requested), so
 * you can see what each one changes. That rule is demo scaffolding: on a real
 * pico the operator installs rulesets, and a page can't.
 */
ruleset com.example.invitations {
  meta {
    name "Invitations"
    description "Accepts full invitation URLs and records connections; other rulesets layer on top."
    author "PICOLABS"

    use module io.picolabs.wrangler alias wrangler
    use module io.picolabs.xmlui alias ui

    shares connections, layers, invitationsPage
  }

  global {
    channel_tags = ["invitations", "app"]
    add_ons = ["com.example.invitations.short_links", "com.example.invitations.welcome"]
    full_invitation = "https://agents.example/invite?c_i=eyJsYWJlbCI6IkFkYSBMb3ZlbGFjZSJ9"
    short_link = "https://short.example/alan"

    labelOf = function(code) {
      invitation = math:base64decode(code).decode()
      label = invitation.typeof() == "Map" => invitation{"label"} | null
      label || "someone"
    }

    /**
     * Every connection made, oldest first.
     * @returns Array of { label, url, time }
     */
    connections = function() {
      ent:connections.defaultsTo([])
    }

    /**
     * The add-on rulesets, in the order they are layered on, and whether each
     * is installed on this pico.
     * @returns Array of { rid, installed }
     */
    layers = function() {
      installed = wrangler:installedRIDs()
      add_ons.map(function(rid) { {"rid": rid, "installed": installed >< rid} })
    }

    nextLayer = function() {
      layers().filter(function(layer) { not layer{"installed"} }).head(){"rid"}
    }

    /**
     * Try the base ruleset alone, then add one layer at a time and see what
     * each one changes.
     * @view "Invitations"
     */
    invitationsPage = function() {
      connections_url = ui:query_url("connections", meta:rid, meta:eci)
      layers_url = ui:query_url("layers", meta:rid, meta:eci)
      invite_url = ui:event_url("invite", "new_invitation")
      next_url = ui:event_url("layers", "next_layer_requested")
      <<
<Component name="InvitationsPage" var.answered="">
  <DataSource id="connections" url="#{connections_url}" headers="{appGlobals.auth}" />
  <DataSource id="layers" url="#{layers_url}" headers="{appGlobals.auth}" pollIntervalInSeconds="3" />
  <APICall id="invite" method="post" url="#{invite_url}" headers="{appGlobals.auth}" body="{$param}"
           onSuccess="(result) => { answered = result.directives.map((d) => d.name).join(', ') || 'nothing: no rule selected that URL'; connections.refetch(); }" />
  <APICall id="nextLayer" method="post" url="#{next_url}" headers="{appGlobals.auth}"
           onSuccess="answered = ''; layers.refetch();" />
  <PicoTheme>
    <Card title="Invitations"
          subtitle="Start with the base ruleset alone. Try both kinds of invitation, then add a layer and try them again. The reply lists the directive of every rule that ran, from every ruleset on this pico." />

    <Card when="{layers.value &amp;&amp; layers.value.filter((l) => l.installed).length === 0}"
          title="Step 1 of 3: the base ruleset alone">
      <Text>Only com.example.invitations is installed. Its rule selects full invitations, the ones with a c_i parameter.</Text>
      <Text>Expect: the full invitation answers "connected". The short link answers "nothing", because no rule selects it.</Text>
    </Card>
    <Card when="{layers.value &amp;&amp; layers.value.filter((l) => l.installed).length === 1}"
          title="Step 2 of 3: short links layered on">
      <Text>com.example.invitations.short_links selects the same event, but only for short links. It expands the link and raises the event again with the full invitation, which the base rule now selects.</Text>
      <Text>Expect: the short link answers "expanded, connected". The full invitation still answers "connected": the new layer didn't select it.</Text>
    </Card>
    <Card when="{layers.value &amp;&amp; layers.value.filter((l) => l.installed).length === 2}"
          title="Step 3 of 3: welcome layered on">
      <Text>com.example.invitations.welcome selects invite:connection_made, the event the base rule raises after every connection, however it was made.</Text>
      <Text>Expect: the short link answers "expanded, connected, welcome", and the full invitation "connected, welcome". The base ruleset never changed.</Text>
    </Card>

    <HStack wrapContent="true">
      <Button label="Try the full invitation" onClick="invite.execute({url: '#{full_invitation}'})" />
      <Button label="Try the short link" onClick="invite.execute({url: '#{short_link}'})" />
      <Button label="{'Add the next layer: ' + layers.value.filter((l) => !l.installed)[0].rid}"
              when="{layers.value &amp;&amp; layers.value.filter((l) => !l.installed).length > 0}"
              variant="outlined" onClick="nextLayer.execute({})" />
    </HStack>
    <Card title="The pico answered" subtitle="{answered || '(nothing yet)'}" />

    <Form saveLabel="Accept" onSubmit="(data) => invite.execute(data)">
      <FormItem bindTo="url" label="Or paste any invitation URL" initialValue="https://short.example/grace" />
    </Form>
    <Table data="{connections}">
      <Column bindTo="label" header="Connected to" />
      <Column bindTo="url" header="From" />
    </Table>
    <Table data="{layers}">
      <Column bindTo="rid" header="Layer" />
      <Column bindTo="installed" header="Installed" />
    </Table>
  </PicoTheme>
</Component>
>>
    }
  }

  /**
   * Accept a full invitation and record the connection.
   * @attr url String "an http(s) URL with a c_i parameter"
   * @example "Ada" { "url": "https://agents.example/invite?c_i=eyJsYWJlbCI6IkFkYSBMb3ZlbGFjZSJ9" }
   */
  rule accept_invitation {
    select when invite new_invitation
      url re#^(https?://[^?]+[?](?:.*&)?c_i=([A-Za-z0-9+/_=-]+).*)$#
      setting(url, code)
    pre {
      label = labelOf(code)
    }
    send_directive("connected", {"label": label})
    fired {
      ent:connections := connections().append({"label": label, "url": url, "time": time:now()})
      raise invite event "connection_made" attributes {"label": label, "url": url}
    }
  }

  /**
   * Demo scaffolding: install the next add-on that isn't installed yet, from
   * the folder this ruleset came from. Only the add-ons listed in this ruleset
   * can be installed this way.
   */
  rule add_next_layer {
    select when layers next_layer_requested
    pre {
      rid = nextLayer()
    }
    if rid then send_directive("add_next_layer", {"rid": rid})
    fired {
      raise wrangler event "install_ruleset_request" attributes {"absoluteURL": meta:rulesetURI, "rid": rid}
    }
  }

  rule create_app_channel {
    select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
    ui:create_app_channel(channel_tags, ["invite", "layers"], ["connections", "layers", "invitationsPage"], meta:rid)
  }
}
