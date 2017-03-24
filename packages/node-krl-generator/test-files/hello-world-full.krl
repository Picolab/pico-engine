ruleset hello_world {
  meta {
    name "Hello World"
    description <<
A first ruleset for the Quickstart
    >>
    author "Phil Windley"
    logging on
    shares hello
    provides hello
  }
  global {
    hello = function(obj){
      msg = "Hello " + obj;
      msg
    }
  }
  rule hello_world {
    select when echo hello;
    send_directive("say") with
      something = "Hello World"
  }
}
