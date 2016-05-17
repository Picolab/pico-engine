var _ = require('lodash');
var λ = require('contra');

module.exports = function(picos, rulesets, event, callback){
  //TODO optimize using the salience graph

  var rulesets_we_care_about = {};
  _.each(picos, function(pico){
    if(_.includes(pico.channels, event.eci)){
      _.each(pico.rulesets, function(rid){
        rulesets_we_care_about[rid] = true;
      });
    }
  });


  var all_rules = [];
  _.each(rulesets, function(rs, rid){
    if(rulesets_we_care_about[rid] !== true){
      return;
    }
    _.each(rs.rules, function(rule, rule_name){
      all_rules.push({
        rid: rid,
        rule_name: rule_name,
        rule: rule
      });
    });
  });

  var ctx = {event: event};

  λ.filter(all_rules, function(r, next){
    r.rule.select(ctx, next);
  }, callback);
};
