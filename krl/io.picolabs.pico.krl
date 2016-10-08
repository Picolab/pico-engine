ruleset io.picolabs.pico {
  meta {
    provides myself, parent, children
    shares myself, parent, children, __testing
  }
  global {
    myself = function(){
      { "id": ent:id, "eci": ent:eci }
    }
    parent = function(){
      ent:parent.defaultsTo({})
    }
    children = function(){
      ent:children.defaultsTo([])
    }
    hasChild = function(child){
      temp = children().union(child);
      temp.length() == children().length()
    }

    __testing = { "queries": [ { "name": "myself" },
                               { "name": "parent" },
                               { "name": "children" },
                               { "name": "__testing" } ] }
  }

// create a new pico and its main channel

  rule pico_new_child_request {
    select when pico new_child_request
    pre {
      child_dname = event:attr("dname")
      child_color = event:attr("color")
      child = engine:newPico()
      child_id = child.id
      channel = engine:newChannel(
        { "name": "main", "type": "secret", "pico_id": child_id })
      child_eci = channel.id
      attrs = {
        "parent_id": ent:id,
        "parent_eci": ent:eci,
        "id": child_id,
        "eci": child_eci
      }
    }
    if true
    then
      engine:addRuleset(
        { "pico_id": child_id, "rid": "io.picolabs.pico" })
      event:send(
        { "eci": child_eci, "eid": 57,
          "domain": "pico", "type": "child_created",
          "attrs": attrs })
      event:send(
         { "eci": child_eci, "eid": 59,
           "domain": "pico", "type": "new_ruleset",
           "attrs": { "rid": "io.picolabs.visual_params",
                      "dname": child_dname, "color": child_color } })
    always {
      engine:signalEvent( // raise pico event "child_created"
        { "eci": ent:eci, "eid": 53,
          "domain": "pico", "type": "child_created",
          "attrs": attrs })
    }
  }

// connect parent and new child pico

  rule pico_child_created {
    select when pico child_created
    pre {
      parent_id = event:attr("parent_id")
      parent_eci = event:attr("parent_eci")
      id = event:attr("id")
      eci = event:attr("eci")
      new_child = { "id": id, "eci": eci }
    }
    if ( parent_id != ent:id )
    then // must be running for the new child pico
      event:send(
        { "eci": parent_eci, "eid": 59,
          "domain": "pico", "type": "child_initialized",
          "attrs": attrs })
    fired {
      ent:id := id;
      ent:eci := eci;
      ent:parent := { "id": parent_id, "eci": parent_eci }
    } else {
      ent:children := children().append(new_child)
    }
  }

// this pico is the primary pico

  rule pico_root_created {
    select when pico root_created
    pre {
      id = event:attr("id")
      eci = event:attr("eci")
    }
    always {
      ent:id := id;
      ent:eci := eci;
      ent:children := []
    }
  }

// this pico deletes one of its child picos

  rule pico_delete_child_request {
    select when pico delete_child_request
    pre {
      attrs = {
        "parent_id": ent:id,
        "parent_eci": ent:eci,
        "id": event:attr("id"),
        "eci": event:attr("eci")
      }
      child = { "id": attrs.id, "eci": attrs.eci }
    }
    if hasChild(child)
    then
      event:send(
        { "eci": child.eci, "eid": 59,
          "domain": "pico", "type": "intent_to_orphan",
          "attrs": attrs })
  }

  rule pico_intent_to_orphan {
    select when pico intent_to_orphan
    pre {
      attrs = {
        "parent_id": ent:parent.id,
        "parent_eci": ent:parent.eci,
        "id": ent:id,
        "eci": ent:eci
      }
    }
    if event:attr("id") == ent:id
      && event:attr("eci") == ent:eci
      && event:attr("parent_id") == ent:parent.id
      && event:attr("parent_eci") == ent:parent.eci
      && children().length() == 0
    then
      event:send(
        { "eci": ent:parent.eci, "eid": 60,
          "domain": "pico", "type": "child_is_orphan",
          "attrs": attrs })
  }

  rule pico_child_is_orphan {
    select when pico child_is_orphan
    pre {
      child_id = event:attr("id")
      child_eci = event:attr("eci")
      child = { "id": child_id, "eci": child_eci }
      left_with_children = children().difference( [ child ] )
                                     .klog("remaining children:")
    }
    if left_with_children.length() < children().length()
      && event:attr("parent_id") == ent:id
      && event:attr("parent_eci") == ent:eci
    then noop()
    fired {
      ent:children := left_with_children;
      engine:removePico(child_id)
    }
  }

// this pico adds a ruleset to itself
// the new ruleset may wish to handle the pico event "ruleset_added"

  rule pico_new_ruleset {
    select when pico new_ruleset
    pre {
      rid = event:attr("rid")
    }
    engine:addRuleset( { "pico_id": ent:id, "rid": rid })
    always {
      engine:signalEvent( // raise pico event "ruleset_added" for rid
        { "eci": ent:eci, "eid": 56,
          "domain": "pico", "type": "ruleset_added",
          "attrs": event:attrs() } )
    }
  }
}
