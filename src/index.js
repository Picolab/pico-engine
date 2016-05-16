var _ = require('lodash');
var λ = require('contra');
var url = require('url');
var http = require('http');
var HttpHashRouter = require('http-hash-router');

var port = process.env.PORT || 8080;

var router = HttpHashRouter();

var rulesets = {
  'rid1x0': require('./rulesets/hello_world')
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
  var to_eval = [];
  _.each(rulesets, function(rs, rid){
    _.each(rs.rules, function(rule, rule_name){
      if(rule.select(event)){
        to_eval.push({
          eid: route.params.eid,
          rid: rid,
          rule_name: rule_name,
          rule: rule
        });
      }
    });
  });

  λ.map(to_eval, function(e, callback){
    e.rule.action(event, function(err, response){
      if(err) return callback(err);

      callback(undefined, {
        options: response.data,
        name: response.name,
        meta: {
          rule_name: e.rule_name,
          txn_id: 'TODO',//TODO transactions
          rid: e.rid,
          eid: e.eid
        }
      });
    });
  }, function(err, directives){
    if(err) return errResp(res, err);
    res.end(JSON.stringify({
      directives: directives
    }, undefined, 2));
  });
});

router.set('/sky/cloud/:rid/:function', function(req, res, route){
  var eci = route.data['_eci'];//TODO channels
  var rid = route.params.rid;
  var args = _.omit(route.data, '_eci');
  if(!_.has(rulesets, rid)){
    return errResp(res, new Error('Not found: rid'));
  }
  var fn_name = route.params['function'];
  if(!_.has(rulesets[rid].provided_query_fns, fn_name)){
    return errResp(res, new Error('Not found: function'));
  }
  var fn = rulesets[rid].provided_query_fns[fn_name];
  if(!_.isFunction(fn)){
    return errResp(res, new Error('Not a function'));
  }
  fn(args, function(err, resp){
    if(err) return errResp(res, err);
    res.end(JSON.stringify(resp, undefined, 2));
  });
});

var server = http.createServer(function(req, res){
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
