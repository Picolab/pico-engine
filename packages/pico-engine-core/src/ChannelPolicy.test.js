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
        cleanIt({name: "foo"});
        t.fail("should throw");
    }catch(e){
        t.equals(e + "", "Error: missing `policy.event`");
    }
    try{
        cleanIt({
            name: "foo",
            event: {allow: ["wat"]},
        });
        t.fail("should throw..");
    }catch(e){
        t.equals(e + "", "Error: `policy.event.<deny|allow>` must be maps with `domain` and/or `type`");
    }

    t.deepEquals(cleanIt({
        name: "foo",
        event: {}
    }), {
        name: "foo",
        event: {
            deny: [],
            allow: [],
        }
    });

    t.deepEquals(cleanIt({
        name: "foo",
        event: {allow: [{}]}
    }), {
        name: "foo",
        event: {
            deny: [],
            allow: [{}],
        }
    });

    t.deepEquals(cleanIt({
        name: " foo   ",
        event: {
            allow: [
                {domain: "one ", type: "thrEE", wat: "four"},
                {domain: "  fIVe "},
                {type: "\tsix "},
            ]
        }
    }), {
        name: "foo",
        event: {
            deny: [],
            allow: [
                {domain: "one", type: "thrEE"},
                {domain: "fIVe"},
                {type: "six"},
            ],
        }
    });

    t.end();
});
