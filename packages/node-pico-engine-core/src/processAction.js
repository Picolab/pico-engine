var _ = require("lodash");
var cocb = require("co-callback");
var runKRL = require("./runKRL");

var runSubAction = cocb.wrap(function*(ctx, name, args){
    var definedAction = ctx.scope.get(name);
    //TODO assert it's an action
    return yield definedAction(ctx, args);
});

var runAction = cocb.wrap(function*(ctx, action_block){
    var did_fire = true;

    var condFn = _.get(action_block, ["condition"]);
    var cond = condFn ? yield runKRL(condFn, ctx) : true;
    var actions = _.get(action_block, ["actions"], []);
    var block_type = _.get(action_block, ["block_type"], "every");
    if(block_type === "choose"){
        actions = _.filter(actions, function(action){
            return action.label === cond;
        });
        if(_.isEmpty(actions)){
            did_fire = false;//not fired b/c nothing matched
        }
    }else if(!cond){
        did_fire = false;//not fired b/c falsey cond
    }

    if(!did_fire){
        actions = [];//don't run anything
    }

    var mapResp = function(response){
        if((response === void 0) || (response === null)){
            return;//noop
        }
        if(response.type !== "directive"){
            return response;
        }
        return {
            type: "directive",
            options: response.options,
            name: response.name,
            meta: {
                rid: ctx.rid,
                rule_name: ctx.rule_name,
                txn_id: "TODO",//TODO transactions
                eid: ctx.event.eid
            }
        };
    };
    var responses = [];
    var i;
    for(i = 0; i < actions.length; i++){
        //TODO collect errors and respond individually to the client
        //TODO try{}catch(e){}
        responses.push(mapResp(yield runKRL(actions[i].action, ctx, runSubAction)));
    }
    responses = _.compact(responses);
    return {
        did_fire: did_fire,
        responses: _.compact(responses),
    };
});

module.exports = runAction;
