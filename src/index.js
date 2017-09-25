var setupServer = require("./setupServer");
var startPicoEngine = require("./startPicoEngine");

module.exports = function(conf){
    console.log("Staring PicoEngine " + require("../package.json").version);
    console.log(conf);

    startPicoEngine(conf, function(err, pe){
        if(err){
            throw err;
        }
        var app = setupServer(pe);

        app.listen(conf.port, function(){
            console.log(conf.host);
        });
    });
};
