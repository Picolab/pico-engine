var _ = require("lodash");
var λ = require("contra");
var applyInFiber = require("./applyInFiber");

var doPrelude = function(rule, ctx, callback){
  if(!_.isFunction(rule.prelude)){
    callback();
    return;
  }
  applyInFiber(rule.prelude, null, [ctx], callback);
};

var doActions = function(rule, ctx, callback){
  var actions = _.get(rule, ["action_block", "actions"], []);
  λ.map(actions, function(action, done){
    applyInFiber(action, null, [ctx], done);
  }, callback);
};

var doPostlude = function(rule, ctx){
  //TODO fired
  //TODO notfired
  var always = _.get(rule, ["postlude", "always"]);
  if(_.isFunction(always)){
    always(ctx);
  }
};

module.exports = function(rule, ctx, callback){

  doPrelude(rule, ctx, function(err, new_vars){
    if(err) return callback(err);

    doActions(rule, ctx, function(err, responses){
      //TODO collect errors and respond individually to the client
      if(err) return callback(err);

      //TODO handle more than one response type
      var resp_data = _.compact(_.map(responses, function(response){
        if((response === void 0) || (response === null)){
          return;//noop
        }
        return {
          type: "directive",
          options: response.options,
          name: response.name,
          meta: {
            rid: rule.rid,
            rule_name: rule.rule_name,
            txn_id: "TODO",//TODO transactions
            eid: ctx.event.eid
          }
        };
      }));

      applyInFiber(doPostlude, null, [rule, ctx], function(err){
        //TODO collect errors and respond individually to the client
        callback(err, resp_data);
      });
    });
  });
};
