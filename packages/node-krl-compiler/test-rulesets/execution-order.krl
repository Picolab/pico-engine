ruleset io.picolabs.execution-order {
  meta {
    shares getOrder
  }
  global {
    getOrder = function(){
      ent:order
    }
  }
  rule first {
    select when execution_order all;
    send_directive("first")
    fired {
      ent:order := ent:order.append("first-fired")
    } finally {
      ent:order := ent:order.append("first-finally")
    }
  }
  rule second {
    select when execution_order all;
    send_directive("second")
    fired {
      ent:order := ent:order.append("second-fired")
    } finally {
      ent:order := ent:order.append("second-finally")
    }
  }
}
