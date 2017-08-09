var _ = require("lodash");
var fs = require("fs");
var path = require("path");
var async = require("async");
var memdown = require("memdown");
var PicoEngine = require("./");

var url_prefix = "https://raw.githubusercontent.com/Picolab/node-pico-engine-core/master/test-rulesets/";

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
    var pe = PicoEngine({
        host: "https://test-host",
        allow_event_time_override: true,
        ___core_testing_mode: true,
        compileAndLoadRuleset: function(rs_info, callback){
            var rid = rs_info.src.substring(8, rs_info.src.length - 2);
            var rs = test_rulesets[rid];
            callback(undefined, rs);
        },
        rootRIDs: opts.rootRIDs,
        db: {
            db: opts.ldb || memdown,
            newID: (function(){
                var i = 0;
                return function(){
                    return "id" + i++;
                };
            }())
        }
    });
    async.eachSeries(_.keys(test_rulesets), function(rid, next){
        //hack since compileAndLoadRuleset doesn't actually compile
        var krl_src = "ruleset " + rid + "{}";
        pe.registerRuleset(krl_src, {
            url: test_rulesets[rid].url
        }, next);
    }, function(err){
        pe.start(function(err){
            callback(err, pe);
        });
    });
};
