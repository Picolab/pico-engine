var _ = require("lodash");
var cocb = require("co-callback");
var ktypes = require("krl-stdlib/types");
var mkKRLfn = require("./mkKRLfn");

var send_directive = mkKRLfn([
    "name",
    "options",
], function(args, ctx, callback){
    var name_type = ktypes.typeOf(args.name);
    var options_type = ktypes.typeOf(args.options);

    if(name_type === "String" && options_type !== "Null" && options_type !== "Map"){
        return callback(new TypeError("send_directive was given " + ktypes.toString(args.options) + " instead of an options map"));
    }

    if(name_type === "Map" && options_type !== "Map"){
        var temp = args.name;
        args.name = args.options;
        args.options = temp;

        name_type = options_type;
    }

    if(name_type !== "Null"){
        args.name = ktypes.toString(args.name);
    }

    callback(null, ctx.addActionResponse(ctx, "directive", {
        name: args.name,
        options: args.options || {},
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
