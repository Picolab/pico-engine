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

    __testing = { "queries": [ { "name": "myself" },
                               { "name": "parent" },
                               { "name": "children" },
                               { "name": "__testing" } ] }

    hasChild = function(child){
      temp = children().union(child);
      temp.length() == children().length()
    }

    newPico = function(){
      child = engine:newPico();
      child_id = child.id;
      channel = engine:newChannel(
        { "name": "main", "type": "secret", "pico_id": child_id });
      child_eci = channel.id;
      { "id": child_id, "eci": child_eci }
    }
  }

// create a new pico and connect to it

  rule pico_new_child_request {
    select when pico new_child_request
    pre {
      new_child = newPico()
      attrs = { "parent":    myself(),
                "new_child": new_child,
                "rs_attrs":  event:attrs() }
    }
    if true
    then
      event:send(
        { "eci": new_child.eci, "eid": 151,
          "domain": "pico", "type": "child_created",
          "attrs": attrs })
    always {
      engine:installRuleset(
        { "pico_id": new_child.id, "rid": "io.picolabs.pico" });
      ent:children := children().union([new_child])
    }
  }

// connect new child pico to its parent

  rule pico_child_created {
    select when pico child_created
    pre {
      parent    = event:attr("parent")
      new_child = event:attr("new_child")
      rs_attrs  = event:attr("rs_attrs")
    }
    if true
    then
      event:send(
        { "eci": parent.eci, "eid": "child-initialized",
          "domain": "pico", "type": "child_initialized",
          "attrs": event:attrs() })
    fired {
      ent:id := new_child.id;
      ent:eci := new_child.eci;
      ent:parent := parent;
      raise pico event "new_ruleset"
        attributes rs_attrs.put({ "rid": "io.picolabs.visual_params" })
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
        { "eci": child.eci, "eid": 51,
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
        { "eci": ent:parent.eci, "eid": "child-is-orphan",
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
      base = event:attr("base")
      url = event:attr("url")
      new_attrs = rid => { "pico_id": ent:id, "rid": rid }
                       | { "pico_id": ent:id, "base": base, "url": url }
    }
    always {
      real_rid = engine:installRuleset( new_attrs );
      raise pico event "ruleset_added" for real_rid
        attributes event:attrs()
    }
  }
}
