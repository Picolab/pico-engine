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
    rule reset_order {
        select when execution_order reset_order;
        send_directive("reset_order")
        always {
            ent:order := []
        }
    }
    rule foo_or_bar {
        select when execution_order foo
            or
            execution_order bar;
        send_directive("foo_or_bar")
        always {
            ent:order := ent:order.append("foo_or_bar")
        }
    }
    rule foo {
        select when execution_order foo;
        send_directive("foo")
        always {
            ent:order := ent:order.append("foo")
        }
    }
    rule bar {
        select when execution_order bar;
        send_directive("bar")
        always {
            ent:order := ent:order.append("bar")
        }
    }
}
