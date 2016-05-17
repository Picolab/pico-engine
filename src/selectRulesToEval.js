var _ = require('lodash');
var λ = require('contra');

module.exports = function(rulesets, event, callback){
  //TODO channels
  //TODO optimize using the salience graph
  var all_rules = [];
  _.each(rulesets, function(rs, rid){
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
