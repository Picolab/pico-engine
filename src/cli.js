var mkdirp = require("mkdirp");

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

var port = process.env.PORT || 8080;
var host = process.env.PICO_ENGINE_HOST || "http://localhost:" + port;
var home = process.env.PICO_ENGINE_HOME || require("home-dir")(".pico-engine");

//make the home dir if it doesn't exist
mkdirp.sync(home);

require("../")({
    host: host,
    port: port,
    home: home,
});
