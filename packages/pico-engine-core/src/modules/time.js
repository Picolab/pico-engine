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
            ], function(args, ctx, callback){
                var d = moment();
                if(_.has(args, ["opts", "tz"])){
                    d.tz(args.opts.tz);
                }
                callback(null, d.toISOString());
            }),
            "new": mkKRLfn([
                "date",
            ], function(args, ctx, callback){
               if(_.size(args) < 1){
                    return callback(new Error("time:new expects one argument"));
                }

                var dateStr = ktypes.toString(args.date);
                var d = newDate(dateStr, true);
                if(d === null){
                    if(ktypes.isString(args.date)){
                        return callback(new Error("time:new was given an invalid date string (" + dateStr + ")"));
                    }
                    return callback(new TypeError("time:new needs a string, not " + dateStr));
                }
                callback(null, d.toISOString());
            }),
            "add": mkKRLfn([
                "date",
                "spec",
            ], function(args, ctx, callback){
                if(_.size(args) < 2){
                    return callback(new Error("time:add expects two arguments"));
                }

                var dateStr = ktypes.toString(args.date);
                var d = newDate(dateStr, true);
                if(d === null){
                    if(ktypes.isString(args.date)){
                        return callback(new Error("time:add was given an invalid date string (" + dateStr + ")"));
                    }
                    return callback(new TypeError("time:add needs a date string, not " + dateStr));
                }

                d.add(args.spec);

                callback(null, d.toISOString());
            }),
            "strftime": mkKRLfn([
                "date",
                "fmt",
            ], function(args, ctx, callback){
               if(_.size(args) < 2){
                    return callback(new Error("time:strftime expects two arguments"));
                }

                var dateStr = ktypes.toString(args.date);
                var d = newDate(dateStr);
                if(d === null){
                    if(ktypes.isString(args.date)){
                        return callback(new Error("time:strftime was given an invalid date string (" + dateStr + ")"));
                    }
                    return callback(new TypeError("time:strftime needs a date string, not " + dateStr));
                }

                if(ktypes.isNull(args.fmt)){
                    return callback(new TypeError("time:strftime was given a null format"));
                }

                callback(null, strftime(ktypes.toString(args.fmt), d.toDate()));
            }),
        }
    };
};
