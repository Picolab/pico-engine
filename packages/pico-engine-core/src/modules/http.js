var _ = require("lodash");
var ktypes = require("krl-stdlib/types");
var mkKRLfn = require("../mkKRLfn");
var request = require("request");

var ensureMap = function(arg, defaultTo){
    return ktypes.isMap(arg)
        ? arg
        : defaultTo;
};

var mkMethod = function(method){
    return mkKRLfn([
        //NOTE: order is significant so it's a breaking API change to change argument ordering
        "url",
        "qs",
        "headers",
        "body",
        "auth",
        "json",
        "form",
        "parseJSON",
        "autoraise",
    ], function(args, ctx, callback){
        if(!_.has(args, "url")){
            return callback(new Error("http:" + method.toLowerCase() + " needs a url string"));
        }
        if(!ktypes.isString(args.url)){
            return callback(new TypeError("http:" + method.toLowerCase() + " was given " + ktypes.toString(args.url) + " instead of a url string"));
        }

        var opts = {
            method: method,
            url: args.url,
            qs: ensureMap(args.qs, {}),
            headers: ensureMap(args.headers, {}),
            auth: ensureMap(args.auth),
        };

        if(_.has(args, "body")){
            opts.body = ktypes.toString(args.body);
        }else if(_.has(args, "json")){
            opts.body = ktypes.encode(args.json);
            if(!_.has(opts.headers, "content-type")){
                opts.headers["content-type"] = "application/json";
            }
        }else if(_.has(args, "form")){
            opts.form = ensureMap(args.form);
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
            if(args.parseJSON === true){
                try{
                    r.content = JSON.parse(r.content);
                }catch(e){
                    //just leave the content as is
                }
            }
            if(_.has(args, "autoraise")){
                r.label = ktypes.toString(args.autoraise);
                ctx.raiseEvent({
                    domain: "http",
                    type: method.toLowerCase(),
                    attributes: r,
                    //for_rid: "",
                }).then(function(r){
                    callback(null, r);
                }, function(err){
                    process.nextTick(function(){
                        //wrapping in nextTick resolves strange issues with UnhandledPromiseRejectionWarning
                        //when infact we are handling the rejection
                        callback(err);
                    });
                });
            }else{
                callback(void 0, r);
            }
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

module.exports = function(core){
    return {
        def: fns,
        actions: fns,
    };
};
