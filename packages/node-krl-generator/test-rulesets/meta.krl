ruleset io.picolabs.meta {
    meta {
        name "testing meta module"
        description <<
some description for the meta test module
        >>

        author "meta author"
        shares metaQuery
    }
    global {
        metaQuery = function(){
            {
                "rid": meta:rid,
                "host": meta:host,
                "rulesetName": meta:rulesetName,
                "rulesetDescription": meta:rulesetDescription,
                "rulesetAuthor": meta:rulesetAuthor,
                "rulesetURI": meta:rulesetURI,
                "ruleName": meta:ruleName,
                "inEvent": meta:inEvent,
                "inQuery": meta:inQuery,
                "eci": meta:eci
            };
        }
    }
    rule meta_event {
        select when meta event;

        send_directive("event", {
            "rid": meta:rid,
            "host": meta:host,
            "rulesetName": meta:rulesetName,
            "rulesetDescription": meta:rulesetDescription,
            "rulesetAuthor": meta:rulesetAuthor,
            "rulesetURI": meta:rulesetURI,
            "ruleName": meta:ruleName,
            "inEvent": meta:inEvent,
            "inQuery": meta:inQuery,
            "eci": meta:eci
        });
    }
}
