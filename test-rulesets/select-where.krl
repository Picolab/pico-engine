ruleset io.picolabs.select_where {
    rule all {
        select where true

        send_directive("all", {
            "domain": event:domain,
            "name": event:name,
            "attrs": event:attrs
        });
    }
    rule set_watcher {
        select where (event:domain == "set") && (event:name == "watcher")
        always {
            ent:watcher := event:attrs{"domain"}
        }
    }
    rule watcher {
        select where event:domain == ent:watcher

        send_directive("watcher matched!");
    }
}
