var _ = require("lodash");
var memdown = require("memdown");
var PicoEngine = require("./");

module.exports = function(opts){
  var pe = PicoEngine({
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
  _.each(opts && opts.rulesets, function(name){
    pe.directInstallRuleset(require("../test-rulesets/" + name));
  });
  return pe;
};
