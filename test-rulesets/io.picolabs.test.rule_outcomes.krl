ruleset io.picolabs.test.rule_outcomes {
  /**
   * Selected but condition is false.
   */
  rule gate {
    select when test probe
    if false then every { noop() }
  }
  /**
   * Same event; needs mode=x in attrs.
   */
  rule narrow {
    select when test probe where event:attr("mode") == "x"
    if true then every { noop() }
  }
}
