var _ = require("lodash");
var cuid = require("cuid");
var mkKRLfn = require("../mkKRLfn");
var randomWords = require("random-words");

var isnull = function(val){
    return val === null || val === undefined || _.isNaN(val);
};

var fixLowerUpperArgs = function(args){
    return {
        lower: isnull(args.lower)
            ? 0
            : _.parseInt(args.lower, 10) || 0,

        upper: isnull(args.upper)
            ? 1
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
