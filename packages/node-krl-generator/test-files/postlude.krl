ruleset postlude {
  rule test0 {
    select when a b
    fired {
      one()
    }
  }
  rule test1 {
    select when a b
    fired {
      one()
    } else {
      two()
    }
  }
  rule test2 {
    select when a b
    fired {
      one()
    } finally {
      three()
    }
  }
  rule test3 {
    select when a b
    fired {
      one()
    } else {
      two()
    } finally {
      three()
    }
  }
  rule test4 {
    select when a b
    always {
      one()
    }
  }
  rule test5 {
    select when a b
    always {
      one();
      two();
      three()
    }
  }
}
