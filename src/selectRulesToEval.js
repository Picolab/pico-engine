var _ = require('lodash');
var λ = require('contra');

module.exports = function(pico, rulesets, event, callback){
  //TODO optimize using the salience graph

  var all_rules = [];
  _.each(rulesets, function(rs, rid){
    if(!_.includes(pico && pico.rulesets, rid)){
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
