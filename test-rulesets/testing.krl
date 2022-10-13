ruleset io.picolabs.testing {
    global {
        __testing = {
            "queries": [{"name": "joke"}],
            "event": __testing["events"]
        }
    }
    rule say_hello {
        select when say hello
        always {
            ent:said := event:attrs{"name"}
        }
    }
}
