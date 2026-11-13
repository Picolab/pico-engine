/**
 * Hook service: stands in for an outside service that accepts webhook posts,
 * such as a chat app. Its webhook URL carries a token, and that token is the
 * secret: a post with the wrong token, or none, is refused.
 *
 * The token comes from the configuration this ruleset was installed with
 * (meta:rulesetConfig), one of the two ways to get a secret into a ruleset.
 * The other, an event, is how the notifier gets this URL.
 */
ruleset com.example.hook_service {
  meta {
    name "Hook service"
    description "Accepts webhook posts that carry its token and refuses the rest."
    author "PICOLABS"

    use module io.picolabs.wrangler alias wrangler
    use module io.picolabs.xmlui alias ui

    shares inbox, refused, inboxPage
  }

  global {
    channel_tags = ["hook_service", "app"]
    webhook_tags = ["hook_service", "webhook"]

    token = function() {
      meta:rulesetConfig{"token"}
    }

    /**
     * Every message received with the right token, oldest first.
     * @returns Array of { text, time }
     */
    inbox = function() {
      ent:inbox.defaultsTo([])
    }

    /**
     * How many posts were refused for a missing or wrong token.
     * @returns Number
     */
    refused = function() {
      ent:refused.defaultsTo(0)
    }

    /**
     * The messages this service received.
     * @view "Inbox"
     */
    inboxPage = function() {
      inbox_url = ui:query_url("inbox", meta:rid, meta:eci)
      refused_url = ui:query_url("refused", meta:rid, meta:eci)
      <<
<Component name="InboxPage">
  <DataSource id="messages" url="#{inbox_url}" headers="{appGlobals.auth}" pollIntervalInSeconds="2" />
  <DataSource id="refused" url="#{refused_url}" headers="{appGlobals.auth}" pollIntervalInSeconds="2" />
  <PicoTheme>
    <Card title="Hook service inbox"
          subtitle="{'Posts with the right token land here. Refused so far: ' + refused.value}" />
    <Table data="{messages}">
      <Column bindTo="text" header="Message" />
      <Column bindTo="time" header="Received" />
    </Table>
  </PicoTheme>
</Component>
>>
    }
  }

  /**
   * A webhook post with the right token.
   * @attr token String "must match this service's token"
   * @attr text String "the message"
   */
  rule receive {
    select when hook post where event:attr("token") == token()
    pre {
      text = event:attr("text") || ""
    }
    send_directive("received", {"text": text})
    fired {
      ent:inbox := inbox().append({"text": text, "time": time:now()})
    }
  }

  rule refuse {
    select when hook post where event:attr("token") != token()
    send_directive("refused")
    fired {
      ent:refused := refused() + 1
    }
  }

  rule installed {
    select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
    every {
      wrangler:createChannel(webhook_tags, {"allow": [{"domain": "hook", "name": "post"}], "deny": []}, {"allow": [], "deny": []})
      ui:create_app_channel(channel_tags, [], ["inbox", "refused", "inboxPage"], meta:rid)
    }
    fired {
      raise hook_service event "channels_created"
    }
  }

  // Hand the webhook URL to the parent pico, the way a service shows you yours
  // once. It travels in an event, so it is in the engine's logs from here on.
  rule hand_out_webhook_url {
    select when hook_service channels_created
    pre {
      channel = wrangler:channels(webhook_tags).head()
      url = meta:host.replace(re#/$#, "") + "/sky/event/" + channel{"id"} + "/webhook/hook/post?token=" + token()
    }
    event:send({
      "eci": wrangler:parent_eci(),
      "domain": "hook_service",
      "type": "webhook_url_issued",
      "attrs": {"webhook_url": url}
    })
  }
}
