var path = require("path");
var tempfs = require("temp-fs");
var setupServer = require("./setupServer");
var startPicoEngine = require("./startPicoEngine");

var is_windows = /^win/.test(process.platform);

tempfs.mkdir({
    dir: path.resolve(__dirname, ".."),
    prefix: "pico-engine_test",
    recursive: true,//It and its content will be remove recursively.
    track: !is_windows//Auto-delete it on fail.
}, function (err, dir) {
    if(err) throw err;//fail the test

    //try setting up the engine including registering rulesets
    startPicoEngine(dir.path, function(err, pe){
        if(err) throw err;//fail the test

        //setup the server without throwing up
        setupServer(pe);

        console.log("passed!");
        if(!is_windows){
            dir.unlink();
        }
        process.exit(0);//success
    });
});
