ruleset io.picolabs.execution-order2 {
    meta {
        shares getOrder
    }
    global {
        getOrder = function(){
            ent:order
        }
    }
    rule reset_order {
        select when execution_order reset_order;
        send_directive("2 - reset_order")
        always {
            ent:order := []
        }
    }
    rule foo_or_bar {
        select when execution_order foo
            or
            execution_order bar;
        send_directive("2 - foo_or_bar")
        always {
            ent:order := ent:order.append("2 - foo_or_bar")
        }
    }
    rule foo {
        select when execution_order foo;
        send_directive("2 - foo")
        always {
            ent:order := ent:order.append("2 - foo")
        }
    }
    rule bar {
        select when execution_order bar;
        send_directive("2 - bar")
        always {
            ent:order := ent:order.append("2 - bar")
        }
    }
}
