var _ = require("lodash");
var cocb = require("co-callback");
var getArg = require("../getArg");

module.exports = function(core){
    var fns = {
        attrs: function*(ctx, args){
            //the user may mutate their copy
            return _.cloneDeep(ctx.event.attrs);
        },
        attr: function*(ctx, args){
            var name = getArg(args, "name", 0);
            return ctx.event.attrs[name];
        },
        attrMatches: function*(ctx, args){
            var pairs = getArg(args, "pairs", 0);
            var matches = [];
            var i, j, attr, m, pair;
            for(i = 0; i < pairs.length; i++){
                pair = pairs[i];
                attr = ctx.event.attrs[pair[0]];
                m = pair[1].exec(attr || "");
                if(!m){
                    return undefined;
                }
                for(j = 1; j < m.length; j++){
                    matches.push(m[j]);
                }
            }
            return matches;
        },

        raise: cocb.toYieldable(function(ctx, args, callback){
            var revent = getArg(args, "revent", 0);
            ctx.raiseEvent(revent, callback);
        }),

        //TODO this is technically a RuleAction
        //TODO should this rather return info for event to be signaled?
        //TODO is this allowed other places in the code?
        send: function*(ctx, args){
            var event = getArg(args, "event", 0);
            return {
                type: "event:send",
                event: event
            };
        },
    };
    return {
        def: fns,
        get: function(ctx, id, callback){
            if(id === "eid"){
                callback(null, _.get(ctx, ["event", "eid"]));
                return;
            }
            callback(new Error("Not defined `event:" + id + "`"));
        }
    };
};
