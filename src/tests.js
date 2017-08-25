var test = require("tape");
var path = require("path");
var async = require("async");
var tempfs = require("temp-fs");
var setupServer = require("./setupServer");
var startPicoEngine = require("./startPicoEngine");

var startTestServer = function(callback){
    var is_windows = /^win/.test(process.platform);

    tempfs.mkdir({
        dir: path.resolve(__dirname, ".."),
        prefix: "pico-engine_test",
        recursive: true,//It and its content will be remove recursively.
        track: !is_windows//Auto-delete it on fail.
    }, function(err, dir){
        if(err) throw err;//throw ensures process is killed with non-zero exit code

        //try setting up the engine including registering rulesets
        startPicoEngine({
            host: "http://localhost:8080",
            home: dir.path,
            no_logging: true,
        }, function(err, pe){
            if(err) throw err;//throw ensures process is killed with non-zero exit code

            //setup the server without throwing up
            setupServer(pe);

            pe.getRootECI(function(err, root_eci){
                if(err) throw err;//throw ensures process is killed with non-zero exit code

                callback(null, {
                    pe: pe,
                    root_eci: root_eci,
                    stopServer: function(){
                        if(!is_windows){
                            dir.unlink();
                        }
                    },
                });
            });
        });
    });
};

test("pio-engine", function(t){
    var pe, root_eci, stopServer, child_count;//, child;
    async.series([
        function(next){
            startTestServer(function(err, tstserver){
                if(err) return next(err);
                pe = tstserver.pe;
                root_eci = tstserver.root_eci;
                stopServer = tstserver.stopServer;
                next();
            });
        },

        ////////////////////////////////////////////////////////////////////////
        //
        //                      Wrangler tests
        //

        function(next){ // example , call myself function check if eci is the same as root.
            pe.runQuery({
                eci: root_eci,
                rid: "io.picolabs.pico",
                name: "myself",
                args: {},
            }, function(err, data){
                if(err) return next(err);

                t.equals(data.eci, root_eci);

                next();
            });
        },
        ///////////////////////////////// create child tests ///////////////
        function(next){// store created children
            pe.runQuery({
                eci: root_eci,
                rid: "io.picolabs.pico",
                name: "children",
                args: {},
            }, function(err, data){
                if(err) return next(err);
                child_count = data.length;
                next();
            });
        },
        function(next){// create child
            pe.signalEvent({
                eci: root_eci,
                eid: "84",
                domain: "pico",
                type: "new_child_request",
                attrs: {"dname":"ted"}
            }, function(err, response){
                if(err) return next(err);
                console.log("this is the response:",response);
                pe.emitter.on("episode_start", function(context){
                    if (context.event && context.event.type == "child_created"){
                        console.log("this is the context:",context);
                        //store child information from event for deleting
                    }
                });
                next();
            });
        },
        function(next){// list children and check for new child
            pe.runQuery({
                eci: root_eci,
                rid: "io.picolabs.pico",
                name: "children",
                args: {},
            }, function(err, data){
                if(err) return next(err);
                t.equals(data.length > child_count, true); // created a child
                t.equals(data.length , child_count+1); // created only 1 child
                //check that child is the same from the event above
                next();
            });
        },

        //
        //                      end Wrangler tests
        //
        ////////////////////////////////////////////////////////////////////////
    ], function(err){
        t.end(err);
        stopServer();
        process.exit(err ? 1 : 0);//ensure server stops
    });
});
