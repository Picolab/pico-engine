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
  rule map {
    select when foreach basic
    foreach {"a": 1, "b": 2, "c": 3} setting (v, k)

    send_directive("map") with
      k = k
      v = v
  }
}
