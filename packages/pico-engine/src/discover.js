var _ = require("lodash");
var os = require("os");
var tcpp = require("tcp-ping");
var mkKRLfn = require("../mkKRLfn");
var Discover = require("node-discover");
var mkKRLaction = require("../mkKRLaction");

//var hostname = os.hostname();
// find ip taken from https://gist.github.com/szalishchuk/9054346
var address, // Local ip address that we're trying to calculate
    ifaces = os.networkInterfaces(); // Network interfaces
function getIp(ifaces) {
    for (var dev in ifaces) { // Iterate over interfaces ...
        var iface = ifaces[dev].filter(function(details) { // ... and find the one that matches the criteria
            return details.family === "IPv4" && details.internal === false;
        });
        if (iface.length > 0) address = iface[0].address;
    }
    return address;
}


var config = {
    helloInterval: 500, // How often to broadcast a hello packet in milliseconds
    checkInterval: 2000, // How often to to check for missing nodes in milliseconds
    nodeTimeout: 3000, // Consider a node dead if not seen in this many milliseconds
    masterTimeout: 6000, // Consider a master node dead if not seen in this many milliseconds
    mastersRequired: 1, // The count of master processes that should always be available
    //address: '0.0.0.0', // Address to bind to
    port: 8183, // Port on which to bind and communicate with other node-discovery processes
    //ignoreProcess: false,
    ignoreInstance: false
};

var event = {
    eid: "12345",
    domain: "discover",
};

module.exports = function(core) {


    var d, _root_eci="fake", getNodes = function() { return [];};

    function startD(config, d) {

        d = Discover(config);
        //var port = core.port || "8080";
        
        core.getRootECI(function(error,root_eci){
          d.advertise({
              name: "PicoEngine",
              resources: root_eci,// WARNING: BIG security hole.....
          });
        });


        d.on("added", function(obj) {
            core.getRootECI(function(error,root_eci){
                console.log("A node has been added.");
                event.eci = root_eci;
                event.type = "engine_found";
                event.attrs = obj;
                core.signalEvent(event, function(err, response) { /*if(err) return errResp(res, err); */ });
            });
            
        });

        d.on("removed", function(obj) {
            core.getRootECI(function(error,root_eci){
                console.log("A node has been removed.");
                event.eci = root_eci;
                event.type = "engine_lost";
                event.attrs = obj;
                core.signalEvent(event, function(err, response) { /*if(err) return errResp(res, err); */ });
            });
        });
    }

    setTimeout(startD, 7000, config, d); // start discover service after engine starts

    return {
        def: {
            alive: mkKRLfn([
                "ip","port"
            ], function(ctx, args, callback) {
              tcpp.probe(args.ip, args.port, function(err, available) { callback(null, available); });
            }),
            ip: mkKRLfn([], function(ctx, args, callback) {
                callback(null, getIp(ifaces));
            }),
        }
    };
};