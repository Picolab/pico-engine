/**
 * Guard rules: this pico needs exactly one Archive child pico, however many
 * times archive:needed arrives. A guard rule decides whether to go ahead and
 * raises an event; a second rule does the work. Asking again changes nothing,
 * so the request is idempotent.
 *
 * Notes are stored in the archive. A gate rule stops archive:note_added with
 * `last` until the archive exists. Rules in one ruleset that select the same
 * event run in the order they are written, and `last` skips the rest of this
 * ruleset's rules for the event, so the gate comes first and lives in the same
 * ruleset as the rule it guards.
 */
ruleset com.example.archive {
  meta {
    name "Archive keeper"
    description "Creates one Archive child however often it is asked, and stores notes in it once it exists."
    author "PICOLABS"

    use module io.picolabs.wrangler alias wrangler
    use module io.picolabs.xmlui alias ui

    shares status, notes, archivePage
  }

  global {
    channel_tags = ["archive", "app"]
    store_rid = "com.example.archive_store"

    archives = function() {
      wrangler:children().filter(function(child) { child{"name"} == "Archive" })
    }

    /**
     * The archive's state and the counts the page shows.
     * @returns Map
     */
    status = function() {
      state = ent:archive_eci => "ready" | ent:creating => "being created" | "none"
      counts = {
        "archive": state,
        "archive_picos": archives().length(),
        "requests": ent:requests.defaultsTo(0),
        "ignored": ent:ignored.defaultsTo(0),
        "gated": ent:gated.defaultsTo(0)
      }
      counts
    }

    /**
     * The notes stored in the archive, oldest first.
     * @returns Array of { text, time }
     */
    notes = function() {
      stored = ent:archive_eci => wrangler:picoQuery(ent:archive_eci, store_rid, "notes") | []
      stored.typeof() == "Array" => stored | []
    }

    /**
     * Ask for the archive as often as you like, and add notes.
     * @view "Archive"
     */
    archivePage = function() {
      status_url = ui:query_url("status", meta:rid, meta:eci)
      notes_url = ui:query_url("notes", meta:rid, meta:eci)
      needed_url = ui:event_url("archive", "needed")
      note_url = ui:event_url("archive", "note_added")
      reset_url = ui:event_url("archive", "reset")
      <<
<Component name="ArchivePage" var.said="">
  <DataSource id="status" url="#{status_url}" headers="{appGlobals.auth}" pollIntervalInSeconds="1" />
  <DataSource id="notes" url="#{notes_url}" headers="{appGlobals.auth}" pollIntervalInSeconds="2" />
  <APICall id="needed" method="post" url="#{needed_url}" headers="{appGlobals.auth}"
           onSuccess="(result) => { said = result.directives.length ? 'Guard: go ahead' : 'Guard: already have one, ignored'; status.refetch(); }" />
  <APICall id="note" method="post" url="#{note_url}" headers="{appGlobals.auth}" body="{$param}"
           onSuccess="(result) => { said = result.directives.length ? 'Note: ' + result.directives[0].options.result : ''; status.refetch(); notes.refetch(); }" />
  <APICall id="reset" method="post" url="#{reset_url}" headers="{appGlobals.auth}"
           onSuccess="said = ''; status.refetch(); notes.refetch();" />
  <PicoTheme>
    <Card title="Archive"
          subtitle="Click Request the archive as often as you like. The guard lets one request through; the rest change nothing." />
    <HStack>
      <Button label="Request the archive" onClick="needed.execute({})" />
      <Button label="Start over" variant="outlined" onClick="reset.execute({})" />
    </HStack>
    <Text when="{said}">{said}</Text>
    <Table data="{[status.value]}">
      <Column bindTo="archive" header="Archive" />
      <Column bindTo="archive_picos" header="Archive picos" />
      <Column bindTo="requests" header="Requests" />
      <Column bindTo="ignored" header="Ignored" />
      <Column bindTo="gated" header="Notes refused" />
    </Table>
    <Form saveLabel="Add a note" onSubmit="(data) => note.execute(data)">
      <FormItem bindTo="text" label="Note" initialValue="Remember the milk" />
    </Form>
    <Table data="{notes}">
      <Column bindTo="text" header="Notes in the archive" />
      <Column bindTo="time" header="Stored" />
    </Table>
  </PicoTheme>
</Component>
>>
    }
  }

  /**
   * Guard: go ahead only when there is no archive and none is being created.
   * The flag ent:creating matters: the child does not exist until
   * child_initialized arrives, and requests can come in before then.
   */
  rule archive_needed {
    select when archive needed
    pre {
      allowed = not ent:archive_eci && not ent:creating
    }
    if allowed then send_directive("archive", {"result": "creating"})
    fired {
      ent:creating := true
      raise archive event "creation_approved"
    }
    else {
      ent:ignored := ent:ignored.defaultsTo(0) + 1
    }
    finally {
      ent:requests := ent:requests.defaultsTo(0) + 1
    }
  }

  // The work: create the archive. Only the guard raises this event.
  rule create_archive {
    select when archive creation_approved
    always {
      raise wrangler event "new_child_request" attributes {"name": "Archive", "archive_role": "store"}
    }
  }

  // The child is set up: give it the store ruleset, and tell anyone listening.
  rule archive_initialized {
    select when wrangler child_initialized where event:attr("archive_role") == "store"
    event:send({
      "eci": event:attr("eci"),
      "domain": "wrangler",
      "type": "install_ruleset_request",
      "attrs": {"absoluteURL": meta:rulesetURI, "rid": store_rid}
    })
    always {
      ent:archive_eci := event:attr("eci")
      ent:creating := false
      raise archive event "archive_created" attributes {"eci": event:attr("eci")}
    }
  }

  /**
   * Gate: no archive, no notes. It comes before store_note, and `last` skips
   * store_note for this event.
   */
  rule require_archive {
    select when archive note_added
    if not ent:archive_eci then send_directive("note", {"result": "refused, no archive yet"})
    fired {
      ent:gated := ent:gated.defaultsTo(0) + 1
      last
    }
  }

  /**
   * Store a note in the archive.
   * @attr text String "the note"
   * @example "milk" { "text": "Remember the milk" }
   */
  rule store_note {
    select when archive note_added
      text re#(.+)#
      setting(text)
    every {
      event:send({
        "eci": ent:archive_eci,
        "domain": "archive",
        "type": "store",
        "attrs": {"text": text}
      })
      send_directive("note", {"result": "stored"})
    }
  }

  /**
   * Delete the archive and the counts, to try again.
   */
  rule reset {
    select when archive reset
    always {
      raise archive event "archives_to_delete" attributes {"archives": archives()}
      ent:archive_eci := null
      ent:creating := false
      ent:requests := 0
      ent:ignored := 0
      ent:gated := 0
    }
  }

  rule delete_archives {
    select when archive archives_to_delete
    foreach event:attr("archives") setting(child)
    always {
      raise wrangler event "child_deletion_request" attributes {"eci": child{"eci"}}
    }
  }

  rule create_app_channel {
    select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
    ui:create_app_channel(channel_tags, ["archive"], ["status", "notes", "archivePage"], meta:rid)
  }
}
