/**
 * Answerer (Alice): knows some facts and shares answer(question). Another pico
 * reaches answer() through a relationship. This ruleset accepts relationship
 * requests from an asker automatically.
 */
ruleset com.example.two_picos.answerer {
  meta {
    name "Answerer"
    description "Shares answers to questions over relationships, and accepts askers automatically."
    author "PICOLABS"

    use module io.picolabs.wrangler alias wrangler
    use module io.picolabs.xmlui alias ui

    shares answer, facts, factList, factsPage
  }

  global {
    channel_tags = ["two_picos", "answerer"]
    initial_facts = {
      "name": "Alice",
      "favorite color": "blue",
      "cat": "Pixel",
      "hometown": "Provo"
    }

    /**
     * Everything this pico knows.
     * @returns Map
     */
    facts = function() {
      ent:facts.defaultsTo(initial_facts)
    }

    /**
     * The facts as rows, sorted by topic.
     * @returns Array of { topic, value }
     */
    factList = function() {
      facts().keys().sort()
        .map(function(topic) { {"topic": topic, "value": facts(){topic}} })
    }

    /**
     * Answer a question by topic, such as "favorite color".
     * @param question String "the topic to ask about"
     * @returns String
     */
    answer = function(question) {
      topic = question.defaultsTo("").lc()
      known = facts(){topic}
      known => "My " + topic + " is " + known + "." | "I don't know my " + topic + " yet."
    }

    /**
     * What this pico knows, and a form to teach it more.
     * @view "Facts"
     */
    factsPage = function() {
      facts_url = ui:query_url("factList", meta:rid, meta:eci)
      learn_url = ui:event_url("two_picos", "fact_learned")
      <<
<Component name="FactsPage">
  <DataSource id="known" url="#{facts_url}" headers="{appGlobals.auth}" />
  <APICall id="learn" method="post" url="#{learn_url}" headers="{appGlobals.auth}" body="{$param}"
           onSuccess="known.refetch()" />
  <PicoTheme>
    <Card title="What Alice knows"
          subtitle="Bob reaches these through his relationship with Alice. Teach Alice something, then ask Bob to ask about it." />
    <Table data="{known}">
      <Column bindTo="topic" header="Topic" />
      <Column bindTo="value" header="Answer" />
    </Table>
    <Form saveLabel="Teach Alice" onSubmit="(data) => learn.execute(data)">
      <FormItem bindTo="topic" label="Topic" initialValue="favorite food" />
      <FormItem bindTo="value" label="Answer" initialValue="pizza" />
    </Form>
  </PicoTheme>
</Component>
>>
    }
  }

  // Accept a relationship request from an asker: in the request, this pico's
  // role is answerer.
  rule accept_asker {
    select when wrangler inbound_pending_subscription_added
      where event:attr("Rx_role") == "answerer"
    always {
      raise wrangler event "pending_subscription_approval" attributes event:attrs
    }
  }

  /**
   * Learn a fact. Topics are lowercased.
   * @attr topic String "what it is about"
   * @attr value String "the answer"
   * @example "food" { "topic": "favorite food", "value": "pizza" }
   */
  rule learn_fact {
    select when two_picos fact_learned
      topic re#(.+)#
      value re#(.+)#
      setting(topic, value)
    always {
      ent:facts{topic.lc()} := value
    }
  }

  rule installed {
    select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
    every {
      ui:create_app_channel(channel_tags, ["two_picos"], ["answer", "facts", "factList", "factsPage"], meta:rid)
      event:send({
        "eci": wrangler:parent_eci(),
        "domain": "two_picos",
        "type": "child_ready",
        "attrs": {"role": "answerer"}
      })
    }
    always {
      ent:facts := initial_facts
    }
  }
}
