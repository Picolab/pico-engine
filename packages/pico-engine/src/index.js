var path = require("path");
var bunyan = require("bunyan");
var startCore = require("./startCore");
var setupServer = require("./setupServer");
var startDiscover = require("./startDiscover");

module.exports = function(conf){

    var bunyanLog = bunyan.createLogger({
        name: "pico-engine",
        streams: [{
            type: "rotating-file",
            level: "debug",
            path: path.resolve(conf.home, "pico-engine.log"),
            period: "1w",//rotate every week
            count: 12,//keep up to 12 weeks of logs
        }]
    });


    console.log("Starting PicoEngine " + require("../package.json").version);
    console.log(conf);
    bunyanLog.info({conf: conf}, "Starting PicoEngine " + require("../package.json").version);

    conf.bunyanLog = bunyanLog;

    startCore(conf, function(err, pe){
        if(err){
            throw err;
        }

        if(conf.discover){
            startDiscover(pe);
        }

        var app = setupServer(pe);

        app.listen(conf.port, function(){
            console.log(conf.host);
            bunyanLog.info("HTTP server listening on port " + conf.port);
        });
    });
};
