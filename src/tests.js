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

            pe.getRootPico(function(err, root_pico){
                if(err) throw err;//throw ensures process is killed with non-zero exit code

                callback(null, {
                    pe: pe,
                    root_eci: root_pico.eci,
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
    var pe;
    var root_eci;
    var stopServer;
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
        // Wrangler tests
        //

        function(next){
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

        //
        // end Wrangler tests
        //
        ////////////////////////////////////////////////////////////////////////
    ], function(err){
        t.end(err);
        stopServer();
        process.exit(err ? 1 : 0);//ensure server stops
    });
});
