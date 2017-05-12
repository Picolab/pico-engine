ruleset io.picolabs.error {
  rule basic {
    select when error basic;
    fired {
      error info "some info error";
    }
  }
}
