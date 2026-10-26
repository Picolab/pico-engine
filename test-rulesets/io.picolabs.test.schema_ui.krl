ruleset io.picolabs.test.schema_ui {
  /**
   * Smoke test for Testing tab schema queries.
   */
  rule open {
    select when test open
    if true then every { noop() }
  }
}
