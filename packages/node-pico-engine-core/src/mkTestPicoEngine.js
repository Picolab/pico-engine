var _ = require("lodash");
var fs = require("fs");
var path = require("path");
var memdown = require("memdown");
var PicoEngine = require("./");

//since each engine instance attaches it's own listeners, and in testing we create lots of engines, but in production you only need 1
require("krl-stdlib").emitter.setMaxListeners(100);

var test_rulesets = {};
var test_dir = path.resolve(__dirname, "../test-rulesets");
_.each(fs.readdirSync(test_dir), function(file){
  if(!/\.js$/.test(file)){
    return;
  }
  var rs = require(path.resolve(test_dir, file));
  if(!rs.name){
    return;
  }
  test_rulesets[rs.name] = rs;
});

module.exports = function(opts){
  var pe = PicoEngine({
    _dont_check_enabled_before_installing: true,
    compileAndLoadRuleset: function(rs_info, callback){
      var rs = test_rulesets[rs_info.rid];
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
  });
  _.each(test_rulesets, function(rs, rid){
    pe.installRID(rid, function(err){if(err)throw err;});
  });
  return pe;
};
