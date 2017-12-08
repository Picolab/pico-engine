var _ = require("lodash");
var fs = require("fs");
var cuid = require("cuid");
var path = require("path");
var memdown = require("memdown");
var PicoEngine = require("./");

var test_rulesets = {};
var test_dir = path.resolve(__dirname, "../../../test-rulesets");
_.each(fs.readdirSync(test_dir), function(file){
    if(!/\.js$/.test(file)){
        return;
    }
    var rs = require(path.resolve(test_dir, file));
    if(!rs.rid){
        return;
    }
    test_rulesets[rs.rid] = rs;
    test_rulesets[rs.rid].url = "http://fake-url/test-rulesets/" + file.replace(/\.js$/, ".krl");
});

var system_rulesets = _.map(_.keys(test_rulesets), function(rid){
    return {
        src: "ruleset " + rid + "{}",
        meta: {url: test_rulesets[rid].url},
    };
});

module.exports = function(opts, callback){
    opts = opts || {};
    var pe = PicoEngine({
        host: "https://test-host",
        ___core_testing_mode: true,
        compileAndLoadRuleset: opts.compileAndLoadRuleset || function(rs_info, callback){
            var rid = rs_info.src.substring(8, rs_info.src.length - 2);
            var rs = test_rulesets[rid];
            callback(undefined, rs);
        },
        rootRIDs: opts.rootRIDs,
        db: {
            db: opts.ldb || memdown(cuid()),
            __use_sequential_ids_for_testing: !opts.__dont_use_sequential_ids_for_testing,
        },
        modules: opts.modules,
    });
    pe.start(system_rulesets, function(err){
        callback(err, pe);
    });
};
