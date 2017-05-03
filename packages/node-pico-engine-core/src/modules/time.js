var _ = require("lodash");
var mkKRLfn = require("../mkKRLfn");
var strftime = require("strftime");

var newDate = function(date_str){
    var d = new Date(date_str);
    //TODO a string formatted as described in ISO8601 (v2000).
    //TODO http://www.probabilityof.com/iso/8601v2000.pdf
    return d;
};

module.exports = function(core){
    return {
        def: {
            now: mkKRLfn([
            ], function(args, ctx, callback){
                var time_str = (new Date()).toISOString();
                callback(null, time_str);
            }),
            "new": mkKRLfn([
                "date",
            ], function(args, ctx, callback){
                callback(null, newDate(args.date).toISOString());
            }),
            "add": mkKRLfn([
                "date",
                "spec",
            ], function(args, ctx, callback){
                var d = newDate(args.date);

                var has = function(key){
                    return _.has(args.spec, key)
                        && _.isNumber(args.spec[key])
                        && !_.isNaN(args.spec[key]);
                };

                if(has("years")){
                    d.setFullYear(d.getFullYear() + args.spec.years);
                }
                if(has("months")){
                    d.setMonth(d.getMonth() + args.spec.months);
                }
                if(has("weeks")){
                    d.setDate(d.getDate() + (7 * args.spec.weeks));
                }
                if(has("days")){
                    d.setDate(d.getDate() + args.spec.days);
                }
                if(has("hours")){
                    d.setHours(d.getHours() + args.spec.hours);
                }
                if(has("minutes")){
                    d.setMinutes(d.getMinutes() + args.spec.minutes);
                }
                if(has("seconds")){
                    d.setSeconds(d.getSeconds() + args.spec.seconds);
                }
                callback(null, d.toISOString());
            }),
            "strftime": mkKRLfn([
                "date",
                "fmt",
            ], function(args, ctx, callback){
                var d = newDate(args.date);

                callback(null, strftime(args.fmt, d));
            }),
        }
    };
};
