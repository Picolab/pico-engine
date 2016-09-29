var _ = require("lodash");
var λ = require("contra");
var fs = require("fs");
var path = require("path");
var memdown = require("memdown");
var PicoEngine = require("./");

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
});

module.exports = function(opts, callback){
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
  λ.each(_.keys(test_rulesets), pe.installRID, function(err){
    callback(err, pe);
  });
};
