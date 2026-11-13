/**
 * Archive store: installed on the Archive child pico. Keeps the notes its
 * parent sends and shares them back.
 */
ruleset com.example.archive_store {
  meta {
    name "Archive store"
    description "Keeps the notes the archive keeper sends."
    author "PICOLABS"

    shares notes
  }

  global {
    /**
     * Every note, oldest first.
     * @returns Array of { text, time }
     */
    notes = function() {
      ent:notes.defaultsTo([])
    }
  }

  /**
   * Keep a note.
   * @attr text String "the note"
   */
  rule store {
    select when archive store
      text re#(.+)#
      setting(text)
    always {
      ent:notes := notes().append({"text": text, "time": time:now()})
    }
  }
}
