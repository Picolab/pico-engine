/**
 * Notifier: posts messages to a webhook. The webhook URL carries a secret, so
 * it is not in this file. The pico's operator sends it in a
 * notifier_config:new_webhook event, and until then the rule that posts is not
 * selected (`where ent:webhook_url`). The ruleset can be installed on a working
 * pico and does nothing until it is configured.
 *
 * The operator event is in its own domain. The app channel allows notifier
 * events only, so the page can send messages but cannot change the webhook.
 * Nothing this ruleset shares returns the URL itself.
 */
ruleset com.example.notifier {
  meta {
    name "Notifier"
    description "Posts messages to a webhook whose secret URL the operator sends in an event."
    author "PICOLABS"

    use module io.picolabs.xmlui alias ui

    shares status, deliveries, notifierPage
  }

  global {
    channel_tags = ["notifier", "app"]

    masked = function(url) {
      url => url.replace(re#token=.*$#, "token=(hidden)") | null
    }

    /**
     * Whether the webhook is set, and where it points with its token hidden.
     * @returns Map
     */
    status = function() {
      result = {
        "configured": ent:webhook_url => true | false,
        "webhook": masked(ent:webhook_url),
        "since": ent:configured_at,
        "not_sent": ent:not_sent.defaultsTo(0)
      }
      result
    }

    /**
     * Every post to the webhook and the HTTP status it got, oldest first.
     * @returns Array of { text, status, time }
     */
    deliveries = function() {
      ent:deliveries.defaultsTo([])
    }

    /**
     * Send messages and see whether they were delivered.
     * @view "Notifier"
     */
    notifierPage = function() {
      status_url = ui:query_url("status", meta:rid, meta:eci)
      deliveries_url = ui:query_url("deliveries", meta:rid, meta:eci)
      message_url = ui:event_url("notifier", "message")
      <<
<Component name="NotifierPage">
  <DataSource id="status" url="#{status_url}" headers="{appGlobals.auth}" pollIntervalInSeconds="2" />
  <DataSource id="deliveries" url="#{deliveries_url}" headers="{appGlobals.auth}" pollIntervalInSeconds="2" />
  <APICall id="send" method="post" url="#{message_url}" headers="{appGlobals.auth}" body="{$param}"
           onSuccess="status.refetch(); deliveries.refetch();" />
  <PicoTheme>
    <Card title="Notifier"
          subtitle="{status.value.configured ? 'Posting to ' + status.value.webhook : 'Not configured: messages are not sent until the operator sets the webhook.'}" />
    <Form saveLabel="Send" onSubmit="(data) => send.execute(data)">
      <FormItem bindTo="text" label="Message" initialValue="The build finished" />
    </Form>
    <Text>{'Messages not sent because the webhook was not set: ' + status.value.not_sent}</Text>
    <Table data="{deliveries}">
      <Column bindTo="text" header="Message" />
      <Column bindTo="status" header="HTTP status" />
      <Column bindTo="time" header="Sent" />
    </Table>
  </PicoTheme>
</Component>
>>
    }
  }

  /**
   * Set the webhook URL. It is a secret: send this event from the Testing tab
   * or a script, not from a page.
   * @attr webhook_url String "the webhook URL, with its token"
   */
  rule set_webhook {
    select when notifier_config new_webhook
      webhook_url re#^(https?://.+)$#
      setting(url)
    always {
      ent:webhook_url := url
      ent:configured_at := time:now()
    }
  }

  /**
   * Forget the webhook URL. Messages stop being sent.
   */
  rule forget_webhook {
    select when notifier_config webhook_forgotten
    always {
      ent:webhook_url := null
      ent:configured_at := null
    }
  }

  /**
   * Post a message to the webhook. Not selected until the webhook is set.
   * @attr text String "the message"
   * @example "build" { "text": "The build finished" }
   */
  rule notify {
    select when notifier message where ent:webhook_url
    pre {
      text = event:attr("text") || "Hello from a pico"
    }
    http:post(ent:webhook_url, json = {"text": text}) setting(response)
    fired {
      ent:deliveries := deliveries().append({"text": text, "status": response{"status_code"}, "time": time:now()})
    }
  }

  rule not_configured {
    select when notifier message where not ent:webhook_url
    send_directive("not sent", {"reason": "the webhook is not set"})
    fired {
      ent:not_sent := ent:not_sent.defaultsTo(0) + 1
    }
  }

  rule create_app_channel {
    select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
    ui:create_app_channel(channel_tags, ["notifier"], ["status", "deliveries", "notifierPage"], meta:rid)
  }
}
