var _ = require("lodash");
var cocb = require("co-callback");
var getArg = require("../getArg");
var request = require("request");

var mkMethod = function(method){
    return cocb.toYieldable(function(ctx, args, callback){
        var url = getArg(args, "url", 0);
        var qs = getArg(args, "qs", 1);
        var headers = getArg(args, "headers", 2);
        var body = getArg(args, "body", 3);
        var credentials = getArg(args, "credentials", 4);

        var opts = {
            method: method,
            url: url,
            qs: qs || {},
            headers: headers || {},
        };

        if(_.isPlainObject(body)){
            opts.form = body;
        }else if(_.isString(body)){
            opts.body = body;
        }

        if(_.isPlainObject(credentials)){
            opts.auth = credentials;
        }

        request(opts, function(err, res, body){
            if(err){
                callback(err);
                return;
            }
            var r = {
                content: body,
                content_type: res.headers["content-type"],
                content_length: _.parseInt(res.headers["content-length"], 0) || 0,
                headers: res.headers,
                status_code: res.statusCode,
                status_line: res.statusMessage
            };
            callback(void 0, r);
        });
    });
};

var fns = {
    get: mkMethod("GET"),
    post: mkMethod("POST"),
    put: mkMethod("PUT"),
    patch: mkMethod("PATCH"),
    "delete": mkMethod("DELETE"),
    head: mkMethod("HEAD"),
};

module.exports = {
    def: fns
};
