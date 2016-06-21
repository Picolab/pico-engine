// testing various EventExpression
ruleset eventexps {
  rule test0 {
    select when web pageview attr re#(.*)# setting(a);
    noop()
  }
  rule test1 {
    select when web pageview aaa re#(.*)# setting(a) and web pageview bbb re#(.*)# setting(b);
    noop()
  }
}
