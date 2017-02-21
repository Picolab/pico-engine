var _ = require("lodash");
var λ = require("contra");
var fs = require("fs");
var path = require("path");
var memdown = require("memdown");
var PicoEngine = require("./");

var url_prefix = "https://github.com/Picolab/node-pico-engine-core/blob/master/test-rulesets/";

var test_rulesets = {};
var test_dir = path.resolve(__dirname, "../test-rulesets");
_.each(fs.readdirSync(test_dir), function(file){
    if(!/\.js$/.test(file)){
        return;
    }
    var rs = require(path.resolve(test_dir, file));
    if(!rs.rid){
        return;
    }
    test_rulesets[rs.rid] = rs;
    test_rulesets[rs.rid].url = url_prefix + file.replace(/\.js$/, ".krl");
});

module.exports = function(opts, callback){
    opts = opts || {};
    PicoEngine({
        allow_event_time_override: true,
        compileAndLoadRuleset: function(rs_info, callback){
            var rid = rs_info.src.substring(8, rs_info.src.length - 2);
            var rs = test_rulesets[rid];
            callback(undefined, rs);
        },
        db: {
            db: memdown,
            newID: (function(){
                var i = 0;
                return function(){
                    return "id" + i++;
                };
            }())
        }
    }, function(err, pe){
        if(err)return callback(err);
        if(opts.dont_register_rulesets){
            callback(void 0, pe);
            return;
        }
        λ.each.series(_.keys(test_rulesets), function(rid, next){
            //hack since compileAndLoadRuleset doesn't actually compile
            var krl_src = "ruleset " + rid + "{}";
            pe.registerRuleset(krl_src, {
                url: test_rulesets[rid].url
            }, next);
        }, function(err){
            callback(err, pe);
        });
    });
};
