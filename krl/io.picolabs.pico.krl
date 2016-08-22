ruleset io.picolabs.pico {
  rule pico_child_created {
    select when pico child_created
    pre {
      parent_id = event:attr("parent_id")
      parent_eci = event:attr("parent_eci")
      id = event:attr("id")
      eci = event:attr("eci")
      new_child = [  { "id": id, "eci": eci } ]
    }
    if ( parent_id == ent:id ) then send_directive("noop")
    fired {
      //ent:children = ent:children.defaultsTo([]).append(new_child);
      ent:children = new_child.klog("new child:")
    } else {
      ent:id = id;
      ent:eci = eci;
      ent:parent_id = parent_id.klog("new parent:");
      ent:parent_eci = parent_eci
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
}
