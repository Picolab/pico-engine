/**
 * Short links: layered on com.example.invitations. A short link has no c_i
 * parameter, so the base ruleset's rule doesn't select it. This rule selects
 * the same event with a pattern only short links match, looks up the full
 * invitation, and raises invite:new_invitation again with it. That time the
 * base ruleset's rule selects it, and this one doesn't.
 *
 * A real short link would be expanded with http:get and its redirect; this one
 * uses a table so the demo works offline.
 */
ruleset com.example.invitations.short_links {
  meta {
    name "Invitation short links"
    description "Expands short invitation links and passes the full invitation to the base ruleset."
    author "PICOLABS"
  }

  global {
    links = {
      "grace": "https://agents.example/invite?c_i=eyJsYWJlbCI6IkdyYWNlIEhvcHBlciJ9",
      "alan": "https://agents.example/invite?c_i=eyJsYWJlbCI6IkFsYW4gVHVyaW5nIn0="
    }
  }

  /**
   * Expand a short link and raise the event again with the full invitation.
   * @attr url String "a short link, https://short.example/<code>"
   * @example "Grace" { "url": "https://short.example/grace" }
   */
  rule expand_short_link {
    select when invite new_invitation
      url re#^https://short[.]example/(\w+)$#
      setting(code)
    pre {
      full = links{code}
    }
    if full then send_directive("expanded", {"from": event:attr("url"), "to": full})
    fired {
      raise invite event "new_invitation" attributes event:attrs.put("url", full)
    }
    else {
      raise invite event "unknown_short_link" attributes event:attrs
    }
  }
}
