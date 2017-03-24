ruleset io.picolabs.with {
  meta {
    shares add, inc, foo
  }
  global {
    add = function(a, b){
      a + b
    }
    inc = function(n){
      add(1) with
        b = n
    }
    foo = function(a){
      add() with
        a = a * 2
        and
        b = a
    }
  }

}
