ruleset com.example.guestbook {
  meta {
    name "Guestbook"
    use module io.picolabs.xmlui alias ui
    shares entries, book
  }
  global {
    /**
     * Guestbook entries, newest first
     * @returns Array
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
  #{ui:query("entries", "entries", {"rid": meta:rid})}
  #{ui:event("sign", "guestbook", "signed", {"rid": meta:rid, "refresh": ["entries"]})}
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
    ui:create_app_channel(channel_tags, ["guestbook"], null, meta:rid)
  }
}
