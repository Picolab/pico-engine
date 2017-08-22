var _ = require("lodash");
var cuid = require("cuid");
var ktypes = require("krl-stdlib/types");
var mkKRLfn = require("../mkKRLfn");
var randomWords = require("random-words");

var fixLowerUpperArgs = function(args){
    return {
        lower: ktypes.isNull(args.lower)
            ? 1
            : _.parseInt(args.lower, 10) || 0,

        upper: ktypes.isNull(args.upper)
            ? 0
            : _.parseInt(args.upper, 10) || 0
    };
};

module.exports = function(core){
    return {
        def: {

            uuid: mkKRLfn([
            ], function(args, ctx, callback){
                callback(null, cuid());
            }),

            word: mkKRLfn([
            ], function(args, ctx, callback){
                callback(null, randomWords());
            }),

            integer: mkKRLfn([
                "lower",
                "upper",
            ], function(args_orig, ctx, callback){
                var args = fixLowerUpperArgs(args_orig);

                callback(null, _.random(args.lower, args.upper));
            }),

            number: mkKRLfn([
                "lower",
                "upper",
            ], function(args_orig, ctx, callback){
                var args = fixLowerUpperArgs(args_orig);

                callback(null, _.random(args.lower, args.upper, true));
            }),

        }
    };
};
