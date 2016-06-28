ruleset io.picolabs.events {
  rule or_op {
    select when echo hello or say hello
  }
  rule and_op {
    select when echo hello and say hello
  }
  rule and_or {
    select when (echo a and echo b) or echo c
  }
}
