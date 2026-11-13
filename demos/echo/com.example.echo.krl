/**
 * Echo: the hello world of events and directives. An event comes in; a rule
 * selects on it and answers with a directive, which the sender gets back in the
 * response. The view sends the events and shows the directive.
 */
ruleset com.example.echo {
  meta {
    name "Echo"
    description "Answers echo:hello and echo:message events with a say directive."
    author "PICOLABS"

    use module io.picolabs.xmlui alias ui

    shares echoPage
  }

  global {
    channel_tags = ["echo", "app"]

    /**
     * Send an echo event and see the directive that comes back.
     * @view "Echo"
     */
    echoPage = function() {
      hello_url = ui:event_url("echo", "hello")
      message_url = ui:event_url("echo", "message")
      <<
<Component name="EchoPage" var.reply="">
  <APICall id="hello" method="post" url="#{hello_url}" headers="{appGlobals.auth}"
           onSuccess="(result) => reply = result.directives[0].options.something" />
  <APICall id="say" method="post" url="#{message_url}" headers="{appGlobals.auth}" body="{$param}"
           onSuccess="(result) => reply = result.directives[0].options.something" />
  <PicoTheme>
    <Card title="Echo"
          subtitle="Each button raises an event on this pico. A rule answers with a say directive, shown below." />
    <HStack>
      <Button label="Say hello" onClick="hello.execute({})" />
    </HStack>
    <Form saveLabel="Echo it" onSubmit="(data) => say.execute(data)">
      <FormItem bindTo="input" label="Message" initialValue="KRL programs the Internet!" />
    </Form>
    <Card title="The pico said" subtitle="{reply || '(nothing yet)'}" />
    <Text>The same message event from a terminal:</Text>
    <Text variant="code">curl "#{meta:host}/sky/event/#{meta:eci}/curl/echo/message?input=hello"</Text>
  </PicoTheme>
</Component>
>>
    }
  }

  /**
   * Answer with "Hello World".
   */
  rule hello_world {
    select when echo hello
    send_directive("say", {"something": "Hello World"})
  }

  /**
   * Answer with the message that came in.
   * @attr input String "what to echo"
   * @example "hi" { "input": "hi" }
   */
  rule echo {
    select when echo message input re#(.*)# setting(m)
    send_directive("say", {"something": m})
  }

  rule create_app_channel {
    select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
    ui:create_app_channel(channel_tags, ["echo"], ["echoPage"], meta:rid)
  }
}
