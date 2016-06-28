ruleset io.picolabs.persistent {
  meta {
    shares read
  }
  global {
    read = function(obj){
      "TODO"//ent:name
    }
  }
  rule store_my_name {
    select when echo hello name re#^(.*)$# setting(my_name);

    send_directive("store_name") with
      name = my_name

    always {
      set ent:name my_name
    }
  }
}
