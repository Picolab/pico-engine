ruleset eventexp {
  meta {
    name "eventexp"
    description "eventexp"
    author "farskipper"
    logging on
    sharing on
  }
  rule test_or {
    select when
      eventexp a val re#(.*)# setting(a_val)
      or
      eventexp b val re#(.*)# setting(b_val)

    noop();
    always {
      log "a:" + a_val + " b:" + b_val;
    }
  }
}
