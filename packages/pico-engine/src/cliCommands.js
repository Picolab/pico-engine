var DB = require("pico-engine-core/src/DB");
var path = require("path");
var leveldown = require("leveldown");

module.exports = {
    "conf": function(conf){
        console.log(JSON.stringify(conf, void 0, 2));
    },
    "schedule:list": function(conf){
        var db = DB({
            db: leveldown(path.join(conf.home, "db"))
        });
        db.listScheduled(function(err, list){
            if(err){
                console.error("" + err);
                return;
            }
            list.forEach(function(s){
                console.log(s.id + " " + JSON.stringify(s));
            });
        });
    },
    "schedule:remove": function(conf, args){
        console.log("TODO remove", conf, args);
    },
};
