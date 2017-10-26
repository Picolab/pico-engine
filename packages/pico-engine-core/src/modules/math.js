var _ = require("lodash");
var crypto = require("crypto");
var ktypes = require("krl-stdlib/types");
var mkKRLfn = require("../mkKRLfn");

var supportedHashFns = crypto.getHashes();

module.exports = function(core){
    return {
        def: {

            base64encode: mkKRLfn([
                "str",
            ], function(ctx, args, callback){
                if(!_.has(args, "str")){
                    return callback(new Error("math:base64encode needs a str string"));
                }

                var str = ktypes.toString(args.str);
                callback(null, Buffer.from(str, "utf8").toString("base64"));
            }),


            base64decode: mkKRLfn([
                "str",
            ], function(ctx, args, callback){
                if(!_.has(args, "str")){
                    return callback(new Error("math:base64decode needs a str string"));
                }

                var str = ktypes.toString(args.str);
                callback(null, Buffer.from(str, "base64").toString("utf8"));
            }),


            hashFunctions: mkKRLfn([
            ], function(ctx, args, callback){
                callback(null, supportedHashFns);
            }),


            hash: mkKRLfn([
                "hashFn",
                "toHash"
            ], function(ctx, args, callback){
                if(!_.has(args, "hashFn")){
                    return callback(new Error("math:hash needs a hashFn string"));
                }
                if(!_.has(args, "toHash")){
                    return callback(new Error("math:hash needs a toHash string"));
                }
                if(!_.includes(supportedHashFns, args.hashFn)){
                    if(ktypes.isString(args.hashFn)){
                        callback(new Error("math:hash doesn't recognize the hash algorithm " + args.hashFn));
                    }else{
                        callback(new TypeError("math:hash was given " + ktypes.toString(args.hashFn) + " instead of a hashFn string"));
                    }
                }

                var str = ktypes.toString(args.toHash);
                var hash = crypto.createHash(args.hashFn).update(str);

                callback(null, hash.digest("hex"));
            }),

        }
    };
};
