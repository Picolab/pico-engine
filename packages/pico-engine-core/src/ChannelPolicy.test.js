var test = require("tape");
var ChannelPolicy = require("./ChannelPolicy");

test("policy = ChannelPolicy.clean(policy)", function(t){
    var cleanIt = ChannelPolicy.clean;

    try{
        cleanIt({});
        t.fail("should throw");
    }catch(e){
        t.equals(e + "", "Error: missing `policy.name`");
    }
    try{
        cleanIt({name: "  "});
        t.fail("should throw");
    }catch(e){
        t.equals(e + "", "Error: missing `policy.name`");
    }


    try{
        cleanIt({
            name: "foo",
            event: {allow: "*"},
        });
        t.fail("should throw");
    }catch(e){
        t.equals(e + "", "Error: `policy.event.<allow|deny>` must be an Array of rules");
    }
    try{
        cleanIt({
            name: "foo",
            query: {allow: "ALL"},
        });
        t.fail("should throw");
    }catch(e){
        t.equals(e + "", "Error: `policy.query.<allow|deny>` must be an Array of rules");
    }


    try{
        cleanIt({
            name: "foo",
            event: {allow: ["wat"]},
        });
        t.fail("should throw..");
    }catch(e){
        t.equals(e + "", "Error: Policy rules must be Maps, not String");
    }
    try{
        cleanIt({
            name: "foo",
            query: {allow: ["wat"]},
        });
        t.fail("should throw..");
    }catch(e){
        t.equals(e + "", "Error: Policy rules must be Maps, not String");
    }

    t.deepEquals(cleanIt({
        name: "foo",
    }), {
        name: "foo",
        event: {
            deny: [],
            allow: [],
        },
        query: {
            deny: [],
            allow: [],
        },
    });

    t.deepEquals(cleanIt({
        name: "foo",
        event: {allow: [{}]},
    }), {
        name: "foo",
        event: {
            deny: [],
            allow: [{}],
        },
        query: {
            deny: [],
            allow: [],
        },
    });

    t.deepEquals(cleanIt({
        name: " foo   ",
        event: {
            allow: [
                {domain: "one ", type: "thrEE", wat: "four"},
                {domain: "  fIVe "},
                {type: "\tsix "},
            ]
        },
    }), {
        name: "foo",
        event: {
            deny: [],
            allow: [
                {domain: "one", type: "thrEE"},
                {domain: "fIVe"},
                {type: "six"},
            ],
        },
        query: {
            deny: [],
            allow: [],
        },
    });

    t.deepEquals(cleanIt({
        name: " foo   ",
        query: {
            allow: [
                {rid: "one ", name: "thrEE", wat: "four"},
                {rid: "  fIVe "},
                {name: "\tsix "},
            ]
        },
    }), {
        name: "foo",
        event: {
            deny: [],
            allow: [],
        },
        query: {
            deny: [],
            allow: [
                {rid: "one", name: "thrEE"},
                {rid: "fIVe"},
                {name: "six"},
            ],
        },
    });

    t.end();
});
