var _ = require("lodash");
var moment = require("moment-timezone");
var ktypes = require("krl-stdlib/types");
var mkKRLfn = require("../mkKRLfn");
var strftime = require("strftime");

var newDate = function(date_str, parse_utc){
    var parse = function(str){
        return parse_utc
            ? moment.utc(str, moment.ISO_8601)
            : moment(str, moment.ISO_8601);
    };
    var d = parse(date_str);
    if(!d.isValid()){
        var today = (new Date()).toISOString().split("T")[0];
        d = parse(today + "T" + date_str);
        if(!d.isValid()){
            d = parse(today.replace(/-/g, "") + "T" + date_str);
        }
    }
    if(!d.isValid()){
        return null; // invalid date string date_str
    }
    return d;
};

module.exports = function(core){
    return {
        def: {
            now: mkKRLfn([
                "opts",
            ], function(ctx, args, callback){
                var d = moment();
                if(_.has(args, "opts")){
                    if(!ktypes.isMap(args.opts)){
                        return callback(new TypeError("time:now was given " + ktypes.toString(args.opts) + " instead of an opts map"));
                    }
                    if(_.has(args.opts, "tz")){
                        d.tz(args.opts.tz);
                    }
                }
                callback(null, d.toISOString());
            }),
            "new": mkKRLfn([
                "date",
            ], function(ctx, args, callback){
                if(!_.has(args, "date")){
                    return callback(new Error("time:new needs a date string"));
                }

                var dateStr = ktypes.toString(args.date);
                var d = newDate(dateStr, true);
                if(d === null){
                    if(ktypes.isString(args.date)){
                        return callback(new Error("time:new was given an invalid date string (" + dateStr + ")"));
                    }
                    return callback(new TypeError("time:new was given " + ktypes.toString(dateStr) + " instead of a date string"));
                }
                callback(null, d.toISOString());
            }),
            "add": mkKRLfn([
                "date",
                "spec",
            ], function(ctx, args, callback){
                if(!_.has(args, "date")){
                    return callback(new Error("time:add needs a date string"));
                }
                if(!_.has(args, "spec")){
                    return callback(new Error("time:add needs a spec map"));
                }

                var dateStr = ktypes.toString(args.date);
                var d = newDate(dateStr, true);
                if(d === null){
                    if(ktypes.isString(args.date)){
                        return callback(new Error("time:add was given an invalid date string (" + dateStr + ")"));
                    }
                    return callback(new TypeError("time:add was given " + ktypes.toString(dateStr) + " instead of a date string"));
                }

                if(!ktypes.isMap(args.spec)){
                    return callback(new TypeError("time:add was given " + ktypes.toString(args.spec) + " instead of a spec map"));
                }

                d.add(args.spec);

                callback(null, d.toISOString());
            }),
            "strftime": mkKRLfn([
                "date",
                "fmt",
            ], function(ctx, args, callback){
                if(!_.has(args, "date")){
                    return callback(new Error("time:strftime needs a date string"));
                }
                if(!_.has(args, "fmt")){
                    return callback(new Error("time:strftime needs a fmt string"));
                }

                var dateStr = ktypes.toString(args.date);
                var d = newDate(dateStr);
                if(d === null){
                    if(ktypes.isString(args.date)){
                        return callback(new Error("time:strftime was given an invalid date string (" + dateStr + ")"));
                    }
                    return callback(new TypeError("time:strftime was given " + ktypes.toString(dateStr) + " instead of a date string"));
                }

                if(!ktypes.isString(args.fmt)){
                    return callback(new TypeError("time:strftime was given " + ktypes.toString(args.fmt) + " instead of a fmt string"));
                }

                callback(null, strftime(args.fmt, d.toDate()));
            }),
        }
    };
};
