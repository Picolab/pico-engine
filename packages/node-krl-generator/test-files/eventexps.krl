// testing various EventExpression
ruleset eventexps {
  rule test0 {
    select when web pageview aaa re#(.*)# setting(a);
    noop()
  }
  rule test1 {
    select when web pageview aaa re#(.*)#g setting(a);
    noop()
  }
  rule test2 {
    select when web pageview aaa re#(.*)#gi setting(a);
    noop()
  }
  rule test3 {
    select when web pageview aaa re#(.*)#i setting(a);
    noop()
  }
  rule test4 {
    select when
      web pageview aaa re#(.*)# setting(a)
      and
      web pageview bbb re#(.*)# setting(b);
    noop()
  }
  rule test5 {
    select when any 3 (
      web aaa,
      web bbb,
      web ccc
    );
    noop()
  }
}
