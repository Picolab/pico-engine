ruleset io.picolabs.pico {
  meta {
    shares myself, parent, children
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
  }

  rule pico_new_child_request {
    select when pico new_child_request
    pre {
      child = engine:newPico()
      child_id = child.id
      child_eci = engine:newChannel(
        { "name": "main", "type": "secret", "pico_id": child_id }).id
      attrs = {
        "parent_id": ent:id,
        "parent_eci": ent:eci,
        "id": child_id,
        "eci": child_eci
      }
    }
    always {
      engine:signalEvent(
        { "eci": ent:eci, "eid": 53,
          "domain": "pico", "type": "child_created",
          "attrs": attrs });
      engine:addRuleset(
        { "pico_id": child_id, "rid": "io.picolabs.pico" });
      engine:signalEvent(
        { "eci": child_eci, "eid": 57,
          "domain": "pico", "type": "child_created",
          "attrs": attrs });
      engine:addRuleset(
         { "pico_id": child_id, "rid": "io.picolabs.visual_params" })
    }
  }

  rule pico_children_reset {
    select when pico children_reset
    always {
      ent:children = [];
      send_directive("reset")
    }
  }

  rule pico_child_created {
    select when pico child_created
    pre {
      parent_id = event:attr("parent_id")
      parent_eci = event:attr("parent_eci")
      id = event:attr("id")
      eci = event:attr("eci")
      new_child = [  { "id": id, "eci": eci } ]
    }
    if ( parent_id == ent:id ) then noop()
    fired {
      ent:children = children().union(new_child)
    } else {
      ent:id = id;
      ent:eci = eci;
      ent:parent = { "id": parent_id, "eci": parent_eci }
    }
  }

  rule pico_root_created {
    select when pico root_created
    pre {
      id = event:attr("id")
      eci = event:attr("eci")
    }
    always {
      ent:id = id;
      ent:eci = eci
    }
  }

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
    if hasChild(child) then noop()
    fired {
      engine:signalEvent(
        { "eci": child.eci, "eid": 59,
          "domain": "pico", "type": "intent_to_orphan",
          "attrs": attrs })
    }
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
    then noop()
    fired {
      engine:signalEvent(
        { "eci": ent:parent.eci, "eid": 60,
          "domain": "pico", "type": "child_is_orphan",
          "attrs": attrs })//;
      //ent:parent = null
    }
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
      ent:children = left_with_children;
      engine:removePico(child_id)
    }
  }
}
