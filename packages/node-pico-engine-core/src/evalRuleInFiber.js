var _ = require("lodash");
var noopTrue = function(){
    return true;
};

module.exports = function(rule, ctx){
    if(_.isFunction(rule.prelude)){
        rule.prelude(ctx);
    }
    var did_fire = true;

    var cond = _.get(rule, ["action_block", "condition"], noopTrue)(ctx);
    var actions = _.get(rule, ["action_block", "actions"], []);
    var block_type = _.get(rule, ["action_block", "block_type"], "every");
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

    //TODO handle more than one response type
    var responses = _.compact(_.map(actions, function(action){
        //TODO collect errors and respond individually to the client
        //TODO try{}catch(e){}
        var response = action.action(ctx);
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
                rid: rule.rid,
                rule_name: rule.name,
                txn_id: "TODO",//TODO transactions
                eid: ctx.event.eid
            }
        };
    }));

    var getPostFn = function(name){
        var fn = _.get(rule, ["postlude", name]);
        return _.isFunction(fn) ? fn : _.noop;
    };
    if(did_fire){
        ctx.emit("debug", "fired");
        getPostFn("fired")(ctx);
    }else{
        ctx.emit("debug", "not fired");
        getPostFn("notfired")(ctx);
    }
    getPostFn("always")(ctx);

    return responses;
};
