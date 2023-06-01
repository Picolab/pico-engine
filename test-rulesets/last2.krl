ruleset io.picolabs.last2 {
    meta {
        name "This second ruleset tests that `last` only stops the current ruleset"
    }
    rule foo {
        select when last all

        send_directive("last2 foo");
    }
}
