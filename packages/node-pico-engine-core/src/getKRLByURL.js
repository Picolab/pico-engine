var fs = require("fs");
var urllib = require("url");
var request = require("request");

var httpGetKRL = function(url, callback){
    request(url, function(err, resp, body){
        if(err){
            return callback(err);
        }
        if(resp.statusCode !== 200){
            return callback(new Error("Got a statusCode=" + resp.statusCode + " for: " + url));
        }
        callback(null, body);
    });
};

module.exports = function(url, callback){
    var url_parsed = urllib.parse(url);
    if(url_parsed.protocol === "file:"){
        fs.readFile(url_parsed.path, function(err, data){
            if(err) return callback(err);
            callback(null, data.toString());
        });
        return;
    }
    httpGetKRL(url, callback);
};
