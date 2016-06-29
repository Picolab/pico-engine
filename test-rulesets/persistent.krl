ruleset io.picolabs.persistent {
  meta {
    shares getName
  }
  global {
    getName = function(){
      ent:name
    }
  }
  rule store_my_name {
    select when store name name re#^(.*)$# setting(my_name);

    send_directive("store_name") with
      name = my_name

    always {
      set ent:name my_name
    }
  }
}
