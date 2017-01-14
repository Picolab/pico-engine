ruleset io.picolabs.foreach {
  meta {
    name "testing foreach"
  }
  global {
    getVals = function(){
      [1, 2, 3]
    }
  }
  rule basic {
    select when foreach basic
    foreach [1, 2, 3] setting (x)

    send_directive("basic") with
      x = x
  }
}
