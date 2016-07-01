ruleset io.picolabs.persistent {
  meta {
    shares getName, getAppVar
  }
  global {
    getName = function(){
      ent:name
    }
    getAppVar = function(){
      app:appvar
    }
  }
  rule store_my_name {
    select when store name name re#^(.*)$# setting(my_name);

    send_directive("store_name") with
      name = my_name

    always {
      ent:name = my_name
    }
  }
  rule store_appvar {
    select when store appvar appvar re#^(.*)$# setting(my_appvar);

    send_directive("store_appvar") with
      appvar = my_appvar

    always {
      app:appvar = my_appvar
    }
  }
}
