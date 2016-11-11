var _ = require("lodash");
var getArg = require("../getArg");
var Future = require("fibers/future");
var request = require("request");

var reqWrap = Future.wrap({
  get: function(url, parameters, headers, callback){
    request({
      method: "GET",
      url: url,
      qs: parameters || {},
      headers: headers || {}
    }, function(err, response, body){
      if(err){
        callback(err);
        return;
      }
      callback(void 0, {
        content: body,
        content_type: response.headers["content-type"],
        content_length: _.parseInt(response.headers["content-length"], 0) || 0,
        status_code: response.statusCode,
        status_line: response.statusMessage
      });
    });
  }
});

var fns = {
  get: function(ctx, args){
    var url = getArg(args, "url", 0);
    var parameters = getArg(args, "parameters", 1);
    var headers = getArg(args, "headers", 2);
    //TODO
    //var response_headers = getArg(args, "response_headers", 3);

    return reqWrap.getFuture(url, parameters, headers).wait();
  }
};

module.exports = {
  get: function(ctx, id){
    return fns[id];
  }
};
