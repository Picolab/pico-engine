var _ = require("lodash");
var request = require("request");
var mkKRLfn = require("../mkKRLfn");
var mkKRLaction = require("../mkKRLaction");

var mkMethod = function(method, isAction){
    var mk = isAction ? mkKRLaction : mkKRLfn;
    return mk([
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

        var opts = {
            method: method,
            url: args.url,
            qs: args.qs || {},
            headers: args.headers || {},
            auth: args.auth || void 0,
        };

        if(args.body){
            opts.body = args.body;
        }else if(args.json){
            opts.body = JSON.stringify(args.json);
            if(!_.has(opts.headers, "content-type")){
                opts.headers["content-type"] = "application/json";
            }
        }else if(args.form){
            opts.form = args.form;
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
            if(_.isString(args.autoraise)){
                r.label = args.autoraise;
                ctx.raiseEvent({
                    domain: "http",
                    type: method.toLowerCase(),
                    attributes: r,
                    //for_rid: "",
                }, function(err){
                    callback(err, r);
                });
            }else{
                callback(void 0, r);
            }
        });
    });
};

module.exports = function(core){
    return {
        def: {
            get: mkMethod("GET"),
            head: mkMethod("HEAD"),

            post: mkMethod("POST", true),
            put: mkMethod("PUT", true),
            patch: mkMethod("PATCH", true),
            "delete": mkMethod("DELETE", true),
        },
    };
};
