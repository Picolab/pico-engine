var startCore = require("./startCore");
var setupServer = require("./setupServer");

module.exports = function(conf){
    console.log("Staring PicoEngine " + require("../package.json").version);
    console.log(conf);

    startCore(conf, function(err, pe){
        if(err){
            throw err;
        }
        var app = setupServer(pe);

        app.listen(conf.port, function(){
            console.log(conf.host);
        });
    });
};
