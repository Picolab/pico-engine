ruleset hello.pre {
  rule say_hello {
    select when echo hello
    pre {
      one = 2
      div = function(a, b){
        a / b
      }
    }
    send_directive("say") with
      something = "Hello World"
  }
}
