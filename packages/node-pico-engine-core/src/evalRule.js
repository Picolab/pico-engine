var _ = require("lodash");
var λ = require("contra");
var applyInFiber = require("./applyInFiber");
var noopTrue = function(){
  return true;
};

var doPrelude = function(rule, ctx, callback){
  if(!_.isFunction(rule.prelude)){
    callback();
    return;
  }
  applyInFiber(rule.prelude, null, [ctx], callback);
};

var doActions = function(rule, ctx, callback){
  var condition = _.get(rule, ["action_block", "condition"], noopTrue);
  var block_type = _.get(rule, ["action_block", "block_type"], "every");
  applyInFiber(condition, null, [ctx], function(err, cond){
    if(err) return callback(err);
    var actions = _.get(rule, ["action_block", "actions"], []);
    if(block_type === "choose"){
      actions = _.filter(actions, function(action){
        return action.label === cond;
      });
    }else if(!cond){
      actions = [];
    }
    if(_.isEmpty(actions)){
      return callback();
    }
    λ.map(actions, function(action, done){
      applyInFiber(action.action, null, [ctx], done);
    }, function(err, responses){
      callback(err, responses, true);
    });
  });
};

var doPostlude = function(rule, ctx, did_fire){
  var getPostFn = function(name){
    var fn = _.get(rule, ["postlude", name]);
    return _.isFunction(fn) ? fn : _.noop;
  };
  if(did_fire){
    getPostFn("fired")(ctx);
  }else{
    getPostFn("notfired")(ctx);
  }
  getPostFn("always")(ctx);
};

module.exports = function(rule, ctx, callback){

  doPrelude(rule, ctx, function(err, new_vars){
    if(err) return callback(err);

    doActions(rule, ctx, function(err, responses, did_fire){
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

      if(did_fire){
        ctx.emitDebug("fired");
      }else{
        ctx.emitDebug("not fired");
      }

      applyInFiber(doPostlude, null, [rule, ctx, did_fire], function(err){
        //TODO collect errors and respond individually to the client
        callback(err, resp_data);
      });
    });
  });
};
