var test = require("tape");
var cleanEvent = require("./cleanEvent");

test("event = cleanEvent(event)", function(t){

    try{
        cleanEvent();
    }catch(e){
        t.equals(e + "", "Error: missing event.eci");
    }
    try{
        cleanEvent({eci: 0});
    }catch(e){
        t.equals(e + "", "Error: missing event.eci");
    }
    try{
        cleanEvent({eci: ""});
    }catch(e){
        t.equals(e + "", "Error: missing event.eci");
    }
    try{
        cleanEvent({eci: "  "});
    }catch(e){
        t.equals(e + "", "Error: missing event.eci");
    }
    try{
        cleanEvent({eci: "eci-1", domain: ""});
    }catch(e){
        t.equals(e + "", "Error: missing event.domain");
    }
    try{
        cleanEvent({eci: "eci-1", domain: "foo"});
    }catch(e){
        t.equals(e + "", "Error: missing event.type");
    }
    try{
        cleanEvent({eci: "eci-1", domain: "foo", type: " "});
    }catch(e){
        t.equals(e + "", "Error: missing event.type");
    }

    //bare minimum
    t.deepEquals(cleanEvent({
        eci: "eci123",
        domain: "foo",
        type: "bar",
    }), {
        eci: "eci123",
        eid: "none",
        domain: "foo",
        type: "bar",
        attrs: {},
    });


    //attrs - should not be mutable
    var attrs = {what: {is: ["this"]}};
    var event = cleanEvent({
        eci: "eci123",
        eid: "555",
        domain: "foo",
        type: "bar",
        attrs: attrs
    });
    t.deepEquals(event, {
        eci: "eci123",
        eid: "555",
        domain: "foo",
        type: "bar",
        attrs: attrs,
    });
    t.deepEquals(event.attrs, attrs, "they should match before event.attrs mutates");
    event.attrs.what = "blah";
    t.notDeepEqual(event.attrs, attrs, "oops, attrs was mutable");


    //trim up inputs
    t.deepEquals(cleanEvent({
        eci: "  eci123   ",
        eid: "   3 3 3 3   ",
        domain: "  foo\n ",
        type: "  \t bar  ",
        attrs: {" foo ": " don't trim these   "}
    }), {
        eci: "eci123",
        eid: "3 3 3 3",
        domain: "foo",
        type: "bar",
        attrs: {" foo ": " don't trim these   "}
    });

    //no timestamp
    t.deepEquals(cleanEvent({
        eci: "eci123",
        domain: "foo",
        type: "bar",
        timestamp: new Date(),
    }), {
        eci: "eci123",
        eid: "none",
        domain: "foo",
        type: "bar",
        attrs: {},
    });


    //no for_rid
    t.deepEquals(cleanEvent({
        eci: "eci123",
        domain: "foo",
        type: "bar",
        for_rid: "rid",
    }), {
        eci: "eci123",
        eid: "none",
        domain: "foo",
        type: "bar",
        attrs: {},
    });

    //convert attrs via KRL json encode
    t.deepEquals(cleanEvent({
        eci: "eci123",
        domain: "foo",
        type: "bar",
        attrs: {
            fn: function(){}
        },
    }), {
        eci: "eci123",
        eid: "none",
        domain: "foo",
        type: "bar",
        attrs: {
            fn: "[Function]"
        },
    });

    //attrs must be a map or array
    t.deepEquals(cleanEvent({
        eci: "eci123",
        domain: "foo",
        type: "bar",
        attrs: function(){},
    }), {
        eci: "eci123",
        eid: "none",
        domain: "foo",
        type: "bar",
        attrs: {},
    });
    t.deepEquals(cleanEvent({
        eci: "eci123",
        domain: "foo",
        type: "bar",
        attrs: [0, 1, "a", null, NaN],
    }), {
        eci: "eci123",
        eid: "none",
        domain: "foo",
        type: "bar",
        attrs: [0, 1, "a", null, null],
    });

    t.end();
});
