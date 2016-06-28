ruleset io.picolabs.events {
  rule or_op {
    select when echo hello or say hello
  }
  rule and_op {
    select when echo hello and say hello
  }
}
