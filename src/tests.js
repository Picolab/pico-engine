var test = require("tape");
var path = require("path");
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
    }, function (err, dir) {
        if(err) return callback(err);

        //try setting up the engine including registering rulesets
        startPicoEngine({
            host: "http://localhost:8080",
            home: dir.path,
            no_logging: true,
        }, function(err, pe){
            if(err) return callback(err);

            //setup the server without throwing up
            setupServer(pe);

            callback(null, pe, function stopServer(){
                if(!is_windows){
                    dir.unlink();
                }
                process.exit(0);//success
            });
        });
    });
};

test("wrangler", function(t){
    startTestServer(function(err, pe, stopServer){
        if(err) return t.end(err);

        //TODO

        t.end();
        stopServer();
    });
});
