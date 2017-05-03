var _ = require("lodash");
var moment = require("moment-timezone");
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
        throw new Error("Invalid date string: " + date_str);
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
                callback(null, newDate(args.date, true).toISOString());
            }),
            "add": mkKRLfn([
                "date",
                "spec",
            ], function(args, ctx, callback){
                var d = newDate(args.date, true);

                d.add(args.spec);

                callback(null, d.toISOString());
            }),
            "strftime": mkKRLfn([
                "date",
                "fmt",
            ], function(args, ctx, callback){
                var d = newDate(args.date);

                callback(null, strftime(args.fmt, d.toDate()));
            }),
        }
    };
};
