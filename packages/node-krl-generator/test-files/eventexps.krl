// testing various EventExpression
ruleset eventexps {
  rule test0 {
    select when web pageview attr re#(.*)# setting(a);
    noop()
  }
}
