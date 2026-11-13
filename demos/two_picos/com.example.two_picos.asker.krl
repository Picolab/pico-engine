/**
 * Asker (Bob): when introduced to an answerer's well-known channel, asks for a
 * relationship. Once the answerer accepts, it asks questions by calling the
 * answerer's answer() over the relationship with subscription:queryOnSub, and
 * keeps the conversation.
 */
ruleset com.example.two_picos.asker {
  meta {
    name "Asker"
    description "Asks another pico questions over a relationship and keeps the conversation."
    author "PICOLABS"

    use module io.picolabs.wrangler alias wrangler
    use module io.picolabs.subscription alias subscription
    use module io.picolabs.xmlui alias ui

    shares conversation, conversationPage
  }

  global {
    channel_tags = ["two_picos", "asker"]
    answerer_rid = "com.example.two_picos.answerer"

    /**
     * Every question asked and the answer that came back, oldest first.
     * @returns Array of { question, answer, time }
     */
    conversation = function() {
      ent:conversation.defaultsTo([])
    }

    /**
     * The conversation, and a form to ask another question.
     * @view "Conversation"
     */
    conversationPage = function() {
      conversation_url = ui:query_url("conversation", meta:rid, meta:eci)
      ask_url = ui:event_url("two_picos", "ask")
      <<
<Component name="ConversationPage">
  <DataSource id="talk" url="#{conversation_url}" headers="{appGlobals.auth}" />
  <APICall id="ask" method="post" url="#{ask_url}" headers="{appGlobals.auth}" body="{$param}"
           onSuccess="talk.refetch()" />
  <PicoTheme>
    <Card title="Bob asks Alice"
          subtitle="Each question is a query from Bob's pico to Alice's, over the relationship between them." />
    <Table data="{talk}">
      <Column bindTo="question" header="Bob asked" />
      <Column bindTo="answer" header="Alice said" />
    </Table>
    <Form saveLabel="Ask Alice" onSubmit="(data) => ask.execute(data)">
      <FormItem bindTo="question" label="Ask about" initialValue="cat" />
    </Form>
  </PicoTheme>
</Component>
>>
    }
  }

  /**
   * Ask for a relationship with the answerer whose well-known channel this is.
   * @attr wellKnown_Tx String "the answerer's wellKnown_Rx channel id"
   */
  rule introduce {
    select when two_picos introduce
      wellKnown_Tx re#(.+)#
      setting(well_known)
    always {
      raise wrangler event "subscription" attributes {
        "wellKnown_Tx": well_known,
        "name": "Bob and Alice",
        "Rx_role": "asker",
        "Tx_role": "answerer"
      }
    }
  }

  // The answerer accepted: tell the parent, and ask a first question.
  rule connected {
    select when wrangler subscription_added
      where event:attr("bus"){"Tx_role"} == "answerer"
    event:send({
      "eci": wrangler:parent_eci(),
      "domain": "two_picos",
      "type": "connected",
      "attrs": {}
    })
    always {
      raise two_picos event "ask" attributes {"question": "favorite color"}
    }
  }

  /**
   * Ask the answerer about a topic and record the answer.
   * @attr question String "the topic, such as favorite color"
   * @example "cat" { "question": "cat" }
   */
  rule ask {
    select when two_picos ask
      question re#(.+)#
      setting(question)
    pre {
      bus = subscription:established("Tx_role", "answerer").head()
      reply = bus => subscription:queryOnSub(bus{"Id"}, answerer_rid, "answer", {"question": question})
        | "(Bob has no relationship with an answerer yet.)"
    }
    always {
      ent:conversation := conversation().append({"question": question, "answer": reply, "time": time:now()})
    }
  }

  rule installed {
    select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
    every {
      ui:create_app_channel(channel_tags, ["two_picos"], ["conversation", "conversationPage"], meta:rid)
      event:send({
        "eci": wrangler:parent_eci(),
        "domain": "two_picos",
        "type": "child_ready",
        "attrs": {"role": "asker"}
      })
    }
  }
}
