ruleset io.picolabs.test.bad_install {
  meta { }
  x
  rule broken {
    select when test broken
    if true then noop()
  }
}
