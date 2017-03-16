var path = require("path");
var setupServer = require("./setupServer");
var startPicoEngine = require("./startPicoEngine");

module.exports = function(opts){
    opts = opts || {};
    var port = opts.port || 8080;
    var pico_engine_home = opts.pico_engine_home || path.resolve(__dirname, "..");

    startPicoEngine(pico_engine_home, function(err, pe){
        if(err){
            throw err;
        }
        var app = setupServer(pe);

        app.listen(port, function () {
            console.log("http://localhost:" + port);
        });
    });
};
