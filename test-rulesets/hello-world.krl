ruleset io.picolabs.hello_world {
  meta {
    name "Hello World"
    description <<
A first ruleset for the Quickstart
    >>

    author "Phil Windley"
    shares hello, said
  }
  global {
    hello = function(name = "default"){
      msg = "Hello " + name;
      msg;
    }
    said = function(){
      ent:said;
    }
  }
  rule say_hello {
    select when say hello

    always {
      ent:said := event:attrs{"name"}
    }
  }
}
