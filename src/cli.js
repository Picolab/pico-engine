var _ = require("lodash");
var mkdirp = require("mkdirp");
var readPkgUp = require("read-pkg-up");

//parse the CLI args
var args = require("minimist")(process.argv.slice(2), {
    "boolean": ["help", "version"],
    "alias": {
        "help": "h"
    }
});

if(args.help){
    console.log("");
    console.log("USAGE");
    console.log("");
    console.log("    pico-engine [--version] [--help|-h]");
    console.log("");
    console.log("Environment variables");
    console.log("    PORT - what port the http server should listen on. By default it's 8080");
    console.log("    PICO_ENGINE_HOME - where the database and other files should be stored. By default it's ~/.pico-engine/");
    console.log("");
    return;
}
if(args.version){
    console.log(require("../package.json").version);
    return;
}


////////////////////////////////////////////////////////////////////////////////
// setup the configuration
var conf = {};


//get the conf from the nearest package.json
var pconf = _.get(readPkgUp.sync(), ["pkg", "pico-engine"], {});


conf.port = _.isFinite(pconf.port)
    ? pconf.port
    : process.env.PORT || 8080
;


conf.host = _.isString(pconf.host)
    ? pconf.host
    : process.env.PICO_ENGINE_HOST || null
;
if( ! _.isString(conf.host)){
    conf.host = "http://localhost:" + conf.port;
}


conf.home = _.isString(pconf.home)
    ? pconf.home
    : process.env.PICO_ENGINE_HOME || null
;
if( ! _.isString(conf.home)){
    conf.home = require("home-dir")(".pico-engine");
}

//make the home dir if it doesn't exist
mkdirp.sync(conf.home);


conf.modules = {};
_.each(pconf.modules, function(path, id){
    conf.modules[id] = require(path);
});


////////////////////////////////////////////////////////////////////////////////
// start it up
require("../")(conf);
