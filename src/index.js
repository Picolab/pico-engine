var _ = require('lodash');
var λ = require('contra');
var url = require('url');
var http = require('http');
var HttpHashRouter = require('http-hash-router');

var port = process.env.PORT || 8080;

var router = HttpHashRouter();

var rulesets = {
  hello_world: require('./rulesets/hello_world')
};

var errResp = function(res, err){
  res.statusCode = err.statusCode || 500;
  res.end(err.message);
};


router.set('/sky/event/:eci/:eid/:domain/:type', function(req, res, route){
  var event = {
    domain: route.params.domain,
    type: route.params.type,
    attrs: router.data
  };

  //TODO channels
  //TODO optimize using the salience graph
  var rules_to_run = _.filter(_.flattenDeep(_.map(rulesets, function(rs){
    return _.values(rs.rules);
  })), function(rule){
    return rule.select(event);
  });

  λ.map(rules_to_run, function(rule, next){
    rule.action(event, next);
  }, function(err, data){
    if(err) return errResp(res, err);

    res.end(JSON.stringify(data));
  });
});

router.set('/sky/cloud/:rid/:function', function(req, res, route){
  console.log(route.params);
  res.end('OK');
});

var server = http.createServer(function handler(req, res) {
  router(req, res, {
    data: url.parse(req.url, true).query
  }, function(err){
    if(err){
      errResp(res, err);
    }
  });
});

server.listen(port, function(){
  console.log('http://localhost:' + server.address().port);
});
