var _ = require("lodash");
var cocb = require("co-callback");
var getArg = require("../getArg");
var request = require("request");

var doHTTP = function(opts, response_headers, callback){
    request(opts, function(err, response, body){
        if(err){
            callback(err);
            return;
        }
        var r = {
            content: body,
            content_type: response.headers["content-type"],
            content_length: _.parseInt(response.headers["content-length"], 0) || 0,
            status_code: response.statusCode,
            status_line: response.statusMessage
        };
        _.each(response_headers, function(header){
            r[header] = response.headers[header];
        });
        callback(void 0, r);
    });
};

var fns = {
    get: cocb.toYieldable(function(ctx, args, callback){
        var url = getArg(args, "url", 0);
        var params = getArg(args, "params", 1);
        var headers = getArg(args, "headers", 2);
        var response_headers = getArg(args, "response_headers", 3);

        doHTTP({
            method: "GET",
            url: url,
            qs: params || {},
            headers: headers || {}
        }, response_headers, callback);
    }),
    post: cocb.toYieldable(function(ctx, args, callback){
        var url = getArg(args, "url", 0);
        var params = getArg(args, "params", 1);
        var headers = getArg(args, "headers", 2);
        var response_headers = getArg(args, "response_headers", 3);
        var body = getArg(args, "body", 4);
        var credentials = getArg(args, "credentials", 5);

        var opts = {
            method: "POST",
            url: url,
            qs: params || {},
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

        doHTTP(opts, response_headers, callback);
    })
};

module.exports = {
    def: fns
};
