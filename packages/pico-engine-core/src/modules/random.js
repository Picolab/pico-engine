var _ = require("lodash");
var cuid = require("cuid");
var ktypes = require("krl-stdlib/types");
var mkKRLfn = require("../mkKRLfn");
var randomWords = require("random-words");

var fixLowerUpperArgs = function(args, round){
    var lowerNum = ktypes.numericCast(args.lower, round);
    var lowerIsNull = ktypes.isNull(lowerNum);

    var upperNum = ktypes.numericCast(args.upper, round);
    var upper;

    if(ktypes.isNull(upperNum)){
        upper = lowerIsNull ? 1 : 0;
    }else{
        upper = upperNum;
    }

    return {
        lower: lowerIsNull ? 0 : lowerNum,
        upper: upper
    };
};

module.exports = function(core){
    return {
        def: {

            uuid: mkKRLfn([
            ], function(ctx, args, callback){
                callback(null, cuid());
            }),

            word: mkKRLfn([
            ], function(ctx, args, callback){
                callback(null, randomWords());
            }),

            integer: mkKRLfn([
                "upper",
                "lower",
            ], function(ctx, args_orig, callback){
                var args = fixLowerUpperArgs(args_orig, true);

                callback(null, _.random(args.lower, args.upper));
            }),

            number: mkKRLfn([
                "upper",
                "lower",
            ], function(ctx, args_orig, callback){
                var args = fixLowerUpperArgs(args_orig);

                callback(null, _.random(args.lower, args.upper, true));
            }),

        }
    };
};
