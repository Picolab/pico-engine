ruleset io.picolabs.last {
    meta {
        name "testing postlude `last` statement"
    }
    rule foo {
        select when last all;

        send_directive("foo");

        fired {
            last if event:attr("stop") == "foo"
        }
    }
    rule bar {
        select when last all;

        send_directive("bar");

        fired {
            last if event:attr("stop") == "bar"
        }
    }
    rule baz {
        select when last all;

        send_directive("baz");

        fired {
            last
        }
    }
    rule qux {
        select when last all;

        send_directive("qux");
    }
}
