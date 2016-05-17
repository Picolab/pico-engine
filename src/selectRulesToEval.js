var _ = require('lodash');

module.exports = function(rulesets, event, callback){
  //TODO channels
  //TODO optimize using the salience graph
  var to_eval = [];
  _.each(rulesets, function(rs, rid){
    _.each(rs.rules, function(rule, rule_name){
      if(rule.select(event)){
        to_eval.push({
          rid: rid,
          rule_name: rule_name,
          rule: rule
        });
      }
    });
  });
  callback(undefined, to_eval);
};
