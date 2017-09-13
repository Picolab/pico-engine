var test = require("tape");
var PicoQueue = require("./PicoQueue");

test("PicoQueue", function(t){

    var log = [];

    var pq = PicoQueue(function(pico_id, data, callback){
        log.push("working_0 [" + pico_id + "] " + data);
        process.nextTick(function(){
            log.push("working_1 [" + pico_id + "] " + data);
            process.nextTick(function(){
                log.push("working_2 [" + pico_id + "] " + data);
                callback();
            });
        });
    });

    var enqueue = function(pico_id, data, done){
        log.push("enqueue [" + pico_id + "] " + data);
        pq.enqueue(pico_id, data, function(){
            log.push("done [" + pico_id + "] " + data);
            if(done){
                done();
            }
        });
    };


    enqueue("A", 0);
    enqueue("A", 1);
    enqueue("B", 0);
    enqueue("A", 2, function(){
        t.deepEquals(log, [
            "enqueue [A] 0",
            "enqueue [A] 1",
            "enqueue [B] 0",
            "enqueue [A] 2",
            "working_0 [A] 0",
            "working_0 [B] 0",//different picos can be concurrent
            "working_1 [A] 0",
            "working_1 [B] 0",
            "working_2 [A] 0",//Now pico A finished work on event 0
            "working_2 [B] 0",
            "done [A] 0",
            "working_0 [A] 1",//Now pico A can start on event 1
            "done [B] 0",
            "working_1 [A] 1",
            "working_2 [A] 1",
            "done [A] 1",
            "working_0 [A] 2",
            "working_1 [A] 2",
            "working_2 [A] 2",
            "done [A] 2"
        ]);
        t.end();
    });
});

test("PicoQueue - error", function(t){
    var pq = PicoQueue(function(pico_id, data, callback){
        process.nextTick(function(){
            if(data === "foobar"){
                callback(new Error(data));
                return;
            }
            callback(null, data);
        });
    });
    t.plan(6);
    pq.enqueue("A", "baz", function(err, data){
        t.equals(err, null);
        t.equals(data, "baz");
    });
    pq.enqueue("A", "foobar", function(err, data){
        t.equals(err + "", "Error: foobar");
        t.equals(data, void 0);
    });
    pq.enqueue("A", "qux", function(err, data){
        t.equals(err, null);
        t.equals(data, "qux");
    });
});
