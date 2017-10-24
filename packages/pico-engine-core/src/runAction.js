var _ = require("lodash");
var cocb = require("co-callback");
var ktypes = require("krl-stdlib/types");
var mkKRLfn = require("./mkKRLfn");

var send_directive = mkKRLfn([
    "name",
    "options",
], function(args, ctx, callback){
    if(!_.has(args, "name")){
        return callback(new Error("send_directive needs a name string"));
    }
    if(!ktypes.isString(args.name)){
        return callback(new TypeError("send_directive was given " + ktypes.toString(args.name) + " instead of a name string"));
    }
    if(!_.has(args, "options")){
        args.options = {};
    }else if(!ktypes.isMap(args.options)){
        return callback(new TypeError("send_directive was given " + ktypes.toString(args.options) + " instead of an options map"));
    }

    callback(null, ctx.addActionResponse(ctx, "directive", {
        name: args.name,
        options: args.options
    }));
});

module.exports = cocb.wrap(function*(ctx, domain, id, args, setting){
    var returns = [];
    if(domain){
        returns = yield ctx.modules.action(ctx, domain, id, args);
    }else if(id === "noop"){
        returns = [];//returns nothing
    }else if(ctx.scope.has(id)){
        var definedAction = ctx.scope.get(id);
        if( ! ktypes.isAction(definedAction)){
            throw new Error("`" + id + "` is not defined as an action");
        }
        returns = yield definedAction(ctx, args);
    }else if(id === "send_directive" || id === "sendDirective"){
        returns = [
            //returns only one value
            yield send_directive(ctx, args)
        ];
    }else{
        throw new Error("`" + id + "` is not defined");
    }
    _.each(setting, function(id, i){
        var val = returns[i];
        if(val === void 0 || _.isNaN(val)){
            val = null;
        }
        ctx.scope.set(id, val);
    });
});
