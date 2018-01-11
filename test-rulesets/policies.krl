ruleset io.picolabs.policies {
    meta {
        shares one, two, three
    }
    global {
        one = 1
        two = 2
        three = 3
    }
    rule foo {
        select when policies foo
    }
    rule bar {
        select when policies bar
    }
    rule baz {
        select when policies baz
    }
    rule foo2 {
        select when other foo
    }
    rule bar2 {
        select when other bar
    }
    rule baz2 {
        select when other baz
    }
}
