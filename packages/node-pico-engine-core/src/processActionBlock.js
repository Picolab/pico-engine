var _ = require("lodash");
var cocb = require("co-callback");
var runKRL = require("./runKRL");
var mkKRLfn = require("./mkKRLfn");

var send_directive = mkKRLfn([
    "name",
    "options",
], function(args, ctx, callback){
    callback(null, ctx.addActionResponse(ctx, "directive", {
        name: args.name,
        options: args.options || {},
    }));
});

var runSubAction = cocb.wrap(function*(ctx, domain, id, args){
    if(domain){
        return [
            //modules only return one value
            yield ctx.modules.action(ctx, domain, id, args)
        ];
    }
    if(id === "noop"){
        return [null];//returns nothing
    }
    if(!ctx.scope.has(id)){
        if(id === "send_directive" || id === "sendDirective"){
            return [
                //returns only one value
                yield send_directive(ctx, args)
            ];
        }
        throw new Error("`" + id + "` is not defined");
    }
    var definedAction = ctx.scope.get(id);
    if(definedAction.is_a_defaction !== true){
        throw new Error("`" + id + "` is not defined as an action");
    }
    return yield definedAction(ctx, args);
});

var processActionBlock = cocb.wrap(function*(ctx, action_block){
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
    }else if(block_type === "sample"){
        if(!cond){
            did_fire = false;//not fired b/c falsey cond
        }else if(!_.isEmpty(actions)){
            //grab a random action
            actions = [_.sample(actions)];
        }
    }else if(block_type === "every"){
        if(!cond){
            did_fire = false;//not fired b/c falsey cond
        }
    }else{
        throw new Error("unsupported action block_type: " + block_type);
    }

    if(!did_fire){
        actions = [];//don't run anything
    }

    var i;
    for(i = 0; i < actions.length; i++){
        //TODO collect errors and respond individually to the client
        //TODO try{}catch(e){}
        yield runKRL(actions[i].action, ctx, runSubAction);
    }
    return {
        did_fire: did_fire,
    };
});

module.exports = processActionBlock;
