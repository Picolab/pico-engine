//var _ = require("lodash");
var test = require("tape");
var http = require("http");
var cocb = require("co-callback");
var event_module = require("./event");

test("module - event:attr(name)", function(t){
    cocb.run(function*(){
        var kevent = event_module();

        t.equals(
            yield kevent.def.attr({event: {attrs: {foo: "bar"}}}, ["foo"]),
            "bar"
        );

        //just null if no ctx.event, or it doesn't match
        t.equals(yield kevent.def.attr({}, ["baz"]), null);
        t.equals(
            yield kevent.def.attr({event: {attrs: {foo: "bar"}}}, ["baz"]),
            null
        );

    }, function(err){
        t.end(err);
    });
});

test("module - event:send(event, host = null)", function(t){
    var server_reached = false;
    var server = http.createServer(function(req, res){
        server_reached = true;

        t.equals(req.url, "/sky/event/some-eci/none/some-d/some-t?foo=bar");

        res.end();
        server.close();
        t.end();
    });
    server.listen(0, function(){
        var host = "http://localhost:" + server.address().port;
        cocb.run(function*(){

            var kevent = event_module();

            t.equals(
                yield kevent.actions.send({}, {
                    event: {
                        eci: "some-eci",
                        domain: "some-d",
                        type: "some-t",
                        attrs: {foo: "bar"},
                    },
                    host: host,
                }),
                void 0//returns nothing
            );
            t.equals(server_reached, false, "should be async, i.e. server not reached yet");
        }, function(err){
            if(err){
                t.end(err);
            }
        });
    });
});
