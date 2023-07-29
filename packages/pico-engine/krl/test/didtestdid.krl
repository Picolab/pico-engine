ruleset didtestdid {
    meta {
        name "didtestdid"
        description
        <<
        A Test Ruleset Orchestrator for using DIDs with event:send() and wrangler:picoQuery()
        >>
        author "Josh Mann"
        shares child1DidMap, child2DidMap
        use module io.picolabs.wrangler alias wrangler
        use module io.picolabs.did-o alias didx
    }

    global {
        child1DidMap = function() {
            wrangler:picoQuery(ent:child1, "io.picolabs.did-o", "didMap", {})
        }

        child2DidMap = function() {
            wrangler:picoQuery(ent:child2, "io.picolabs.did-o", "didMap", {})
        }
    }

    rule createChildren {
        select when didtestdid createChildren
        always {
            raise wrangler event "new_child_request" attributes {"name": "child1", "backgroundColor": "#ae85fa"}
            raise wrangler event "new_child_request" attributes {"name": "child2", "backgroundColor": "#fef1b4"}
        }
    }

    rule createDIDRelationshipWithChildren {
        select when didtestdid createDIDRelationshipWithChildren
        foreach ctx:children setting(child)
        pre {
            invitation = didx:generate_invitation()
        }
        event:send({
            "eci": child,
            "domain": "dido",
            "name": "receive_invite",
            "attrs": {"invite": invitation}
        })
    }

    rule saveChildDids {
        select when didtestdid saveChildDids
        always {
            ent:child1 := didx:didMap().keys()[0]
            ent:child2 := didx:didMap().keys()[1]
        }
    }

    rule createDIDRelationship {
        select when didtestdid createDIDRelationship
        pre {
            child1 = ent:child1.klog("Child1: ")
            child2 = ent:child2.klog("Child2: ")
            invitation = wrangler:picoQuery(child1, "io.picolabs.did-o", "generate_invitation", {}).klog("Invitation: ")
        }
        event:send({
            "did": child2,
            "domain": "dido",
            "name": "receive_invite",
            "attrs": {
                "invite": invitation
            }
        })
    }

    rule deleteChildren {
        select when didtestdid deleteChildren
        foreach ctx:children setting(child)
        always {
            raise wrangler event "child_deletion_request" attributes {"eci": child}
        }
    }
}