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
    getUser = function(){
      ent:user
    }
    getUserFirstname = function(){
      ent:user{["firstname"]}
    }
  }
  rule store_my_name {
    select when store name name re#^(.*)$# setting(my_name);

    send_directive("store_name") with
      name = my_name

    always {
      ent:name := my_name
    }
  }
  rule store_appvar {
    select when store appvar appvar re#^(.*)$# setting(my_appvar);

    send_directive("store_appvar") with
      appvar = my_appvar

    always {
      app:appvar := my_appvar
    }
  }
  rule store_user_firstname {
    select when store user_firstname name re#^(.*)$# setting(my_name);

    send_directive("store_user_firstname") with
      name = my_name

    always {
      ent:user := {};

      //this what we really want to test
      ent:user{["firstname"]} := name
    }
  }
}
