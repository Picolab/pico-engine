ruleset io.picolabs.with {
  meta {
    shares foo
  }
  global {
    add = function(a, b){
      a + b
    }
    foo = function(a){
      add() with
        a = 1
        b = 2
    }
    inc = function(n){
      add(3) with
        b = n
    }
  }
}
