ruleset io.picolabs.scope {
  meta {
    name "testing scope"
  }
  global {
    g0 = "global 0" 
    getVals = function(){
      {
        "name": ent:ent_var_name,
        "p0": ent:ent_var_p0,
        "p1": ent:ent_var_p1
      }
    }
  }
  rule eventex {
    select when
      scope event0 name re#^(.*)$# setting(my_name)
      or
      scope event1;
    send_directive("say") with
      name = my_name
  }
  rule prelude_scope {
    select when scope prelude name re#^(.*)$# setting(name);

    pre {
      p0 = "prelude 0"
      p1 = "prelude 1"
    }

    send_directive("say") with
      name = name
      p0 = p0
      p1 = p1

    always {
      set ent:ent_var_name name;
      set ent:ent_var_p0 p0;
      set ent:ent_var_p1 p1
    }
  }
}
