ruleset echo_server {
  meta {
    name "echo"
    description <<
      Playing with an echo endpoint
    >>
    author "Phil Windley"
    logging on
  }

  rule hello_world is active {
    select when echo hello
    send_directive("say", {
      "something": "Hello CS462 Again"
    })
    always {
      "This is my log message".klog("")
    }
  }
  
  rule echo is active {
    select when echo message input re#(.*)# setting(m)
    send_directive("say", {
      "something": m
    })
  }
}
