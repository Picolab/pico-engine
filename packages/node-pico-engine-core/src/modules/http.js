var _ = require("lodash");
var mkKRLfn = require("../mkKRLfn");
var request = require("request");

var mkMethod = function(method){
    return mkKRLfn([
        "url",
        "qs",
        "headers",
        "body",
        "auth",
    ], function(args, ctx, callback){

        var opts = {
            method: method,
            url: args.url,
            qs: args.qs || {},
            headers: args.headers || {},
        };

        if(_.isPlainObject(args.body)){
            opts.form = args.body;
        }else if(_.isString(args.body)){
            opts.body = args.body;
        }

        if(_.isPlainObject(args.auth)){
            opts.auth = args.auth;
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
