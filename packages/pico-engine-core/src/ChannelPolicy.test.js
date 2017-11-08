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
            event: {},
        });
        t.fail("should throw");
    }catch(e){
        t.equals(e + "", "Error: `policy.event.type` must be \"whitelist\" or \"blacklist\"");
    }
    try{
        cleanIt({
            name: "foo",
            event: {type: "BlackList"},
        });
        t.fail("should throw");
    }catch(e){
        t.equals(e + "", "Error: `policy.event.type` must be \"whitelist\" or \"blacklist\"");
    }

    try{
        cleanIt({
            name: "foo",
            event: {type: "blacklist", events: ["wat"]},
        });
        t.fail("should throw");
    }catch(e){
        t.equals(e + "", "Error: `policy.event.events` must have `domain` and/or `type`");
    }
    try{
        cleanIt({
            name: "foo",
            event: {type: "blacklist", events: [{}]},
        });
        t.fail("should throw");
    }catch(e){
        t.equals(e + "", "Error: `policy.event.events` must have `domain` and/or `type`");
    }

    t.deepEquals(cleanIt({
        name: "foo",
        event: {
            type: "blacklist",
        }
    }), {
        name: "foo",
        event: {
            type: "blacklist",
            events: [],
        }
    });

    t.deepEquals(cleanIt({
        name: " foo   ",
        event: {
            type: "whitelist",
            events: [
                {domain: "one ", type: "thrEE", wat: "four"},
                {domain: "  fIVe "},
                {type: "\tsix "},
            ]
        }
    }), {
        name: "foo",
        event: {
            type: "whitelist",
            events: [
                {domain: "one", type: "thrEE"},
                {domain: "fIVe"},
                {type: "six"},
            ],
        }
    });

    t.end();
});
