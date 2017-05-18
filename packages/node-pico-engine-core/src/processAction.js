var _ = require("lodash");
var cocb = require("co-callback");
var runKRL = require("./runKRL");

var runSubAction = cocb.wrap(function*(ctx, domain, id, args){
    if(domain){
        return yield ctx.modules.action(ctx, domain, id, args);
    }
    if(id === "noop"){
        return;
    }
    if(id === "send_directive"){
        return ctx.addActionResponse(ctx, "directive", {
            name: args[0],
            options: _.omit(args, "0")
        });
    }
    if(!ctx.scope.has(id)){
        throw new Error("`" + id + "` is not defined");
    }
    var definedAction = ctx.scope.get(id);
    if(definedAction.is_a_defaction !== true){
        throw new Error("`" + id + "` is not defined as an action");
    }
    return yield definedAction(ctx, args);
});

var processAction = cocb.wrap(function*(ctx, action_block){
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

    var returns = [];

    var i;
    for(i = 0; i < actions.length; i++){
        //TODO collect errors and respond individually to the client
        //TODO try{}catch(e){}
        returns.push(yield runKRL(actions[i].action, ctx, runSubAction));
    }
    return {
        did_fire: did_fire,
        returns: returns,
    };
});

module.exports = processAction;
