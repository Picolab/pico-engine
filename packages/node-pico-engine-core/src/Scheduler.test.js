var _ = require("lodash");
var test = require("tape");
var Scheduler = require("./Scheduler");

test("Scheduler - at", function(t){

    var log = [];
    var queue_nextEventAt = [];
    var queue_removeEventAt = [];

    var popNextEventAt = function(id, ignore_if_empty){
        //pop off the oldest callback
        var callback = queue_nextEventAt.shift();
        if(ignore_if_empty && !callback){
            return;
        }
        if(!id){
            return callback();
        }
        callback(null, {
            id: id,
            at: new Date(),//doesn't matter
            event: id,//shape doesn't matter here
        });
    };

    var popRemoveEventAt = function(){
        //pop off the oldest callback
        var callback = queue_removeEventAt.shift();
        callback();
    };

    var sch = Scheduler({
        is_test_mode: true,
        db: {
            nextScheduleEventAt: function(callback){
                queue_nextEventAt.push(callback);
            },
            removeScheduleEventAt: function(id, at, callback){
                queue_removeEventAt.push(callback);
            },
        },
        onError: function(err){
            log.push(["ERROR", err]);
        },
        onEvent: function(event){
            log.push(["EVENT", event]);
        },
    });

    sch.update();
    sch.update();
    popNextEventAt("1");
    sch.test_mode_triggerTimeout();
    popNextEventAt("1");
    sch.test_mode_triggerTimeout();
    popRemoveEventAt();
    popNextEventAt(null);

    t.deepEquals(log, [["EVENT", "1"]], "the event should only fire once!");

    log = [];

    sch.update();
    popNextEventAt("foo");
    sch.test_mode_triggerTimeout();
    //notice "foo" has not be removed from the db yet
    sch.update();
    popNextEventAt("foo", true);//"foo" is still in the db, so naturally it will apear here
    sch.test_mode_triggerTimeout();
    popRemoveEventAt();
    popNextEventAt(null, true);
    popNextEventAt(null, true);

    t.deepEquals(log, [["EVENT", "foo"]], "the event should only fire once!");


    t.equals(queue_nextEventAt.length, 0, "should be no outstanding nextEventAt callbacks");
    t.equals(queue_removeEventAt.length, 0, "should be no outstanding removeEventAt callbacks");

    t.end();
});

if(process.env.SKIP_LONG_TESTS === "true"){
    //skip the generative test when running the tests quick i.e. `npm start`
    return;
}

var nTicks = function(n, callback){
    if(n === 0){
        callback();
        return;
    }
    process.nextTick(function(){
        nTicks(n - 1, callback);
    });
};

var randomTick = function(callback){
    //0 means no tick i.e. synchronous
    nTicks(_.random(0, 4), callback);
};

test("Scheduler - at - generative test", function(t){

    var n_events = 50000;

    var log = [];
    var event_queue = [];

    var sch = Scheduler({
        is_test_mode: true,
        db: {
            nextScheduleEventAt: function(callback){
                randomTick(function(){
                    if(event_queue.length === 0){
                        //console.log("popNextEventAt(null)");
                        return callback();
                    }
                    //read the next event to run, then tick again
                    var id = event_queue[0];
                    var next = {
                        id: id,
                        at: new Date(),//doesn't matter for this test
                        event: id,//shape doesn't matter for this test
                    };
                    randomTick(function(){
                        //console.log("popNextEventAt(", id, ")");
                        callback(null, next);
                        nTicks(_.random(1, 4), function(){
                            //console.log("test_mode_triggerTimeout()");
                            sch.test_mode_triggerTimeout();
                        });
                    });
                });
            },
            removeScheduleEventAt: function(id, at, callback){
                randomTick(function(){
                    _.pull(event_queue, id);
                    randomTick(function(){
                        //console.log("popRemoveEventAt()", id);
                        callback();
                        if(id === n_events){
                            process.nextTick(function(){
                                onDone();
                            });
                        }
                    });
                });
            },
        },
        onError: function(err){
            //this test expects no errors to occur
            t.end(err);
        },
        onEvent: function(event){
            log.push(event);
        },
    });
    //console.log("update()");
    sch.update();

    var event_i = 0;

    var tickLoop = function(){
        if(event_i >= n_events){
            return;
        }
        randomTick(function(){
            event_i++;
            event_queue.push(event_i);
            //console.log("update()");
            sch.update();
            tickLoop();
        });
    };
    tickLoop();

    function onDone(){
        var fail = false;
        var i;
        for(i = 0; i < log.length; i++){
            if(log[i] !== (i + 1)){
                fail = true;
                break;
            }
        }
        if(fail){
            t.fail("events out of order! " + log.join(","));
        }else{
            t.ok(true, "events in order");
        }
        t.end();
    }
});
