var _ = require('lodash');
var λ = require('contra');
var url = require('url');
var cuid = require('cuid');
var path = require('path');
var http = require('http');
var levelup = require('levelup');
var evalRule = require('./evalRule');
var HttpHashRouter = require('http-hash-router');
var queryRulesetFn = require('./queryRulesetFn');
var selectRulesToEval = require('./selectRulesToEval');

var db = levelup(path.resolve(__dirname, '../db'), {
  keyEncoding: require('bytewise'),
  valueEncoding: 'json'
});

var port = process.env.PORT || 8080;

var router = HttpHashRouter();

var rulesets = {
  'rid1x0': require('./rulesets/hello_world'),
  'rid2x0': require('./rulesets/store_name')
};

var picos = {
  'pico1': {
    id: 'pico1',
    rulesets: ['rid1x0', 'rid2x0'],
    channels: ['chan0']
  }
};

var getPicoByECI = function(eci){
  return _.find(picos, function(pico){
    return _.includes(pico.channels, eci);
  });
};

var jsonResp = function(res, data){
  res.end(JSON.stringify(data, undefined, 2));
};

var errResp = function(res, err){
  res.statusCode = err.statusCode || 500;
  res.end(err.message);
};


router.set('/sky/event/:eci/:eid/:domain/:type', function(req, res, route){
  var event = {
    eci: route.params.eci,
    eid: route.params.eid,
    domain: route.params.domain,
    type: route.params.type,
    attrs: route.data
  };
  var pico = getPicoByECI(event.eci);

  selectRulesToEval(pico, rulesets, event, function(err, to_eval){
    if(err) return errResp(res, err);

    λ.map(to_eval, function(e, callback){

      var ctx = {
        pico: pico,
        db: db,
        vars: {},
        event: event,
        meta: {
          rule_name: e.rule_name,
          txn_id: 'TODO',//TODO transactions
          rid: e.rid,
          eid: event.eid
        }
      };

      evalRule(e.rule, ctx, callback);

    }, function(err, directives){
      if(err) return errResp(res, err);
      jsonResp(res, {
        directives: directives
      });
    });
  });
});

router.set('/sky/cloud/:rid/:function', function(req, res, route){
  var eci = route.data['_eci'];
  var rid = route.params.rid;
  var args = _.omit(route.data, '_eci');
  var fn_name = route.params['function'];

  var pico = getPicoByECI(eci);
  if(!pico){
    return errResp(res, new Error('Bad eci'));
  }
  if(!_.includes(pico.rulesets, rid)){
    return errResp(res, new Error('Pico does not have that rid'));
  }

  var ctx = {
    pico: pico,
    db: db,
    rid: rid,
    fn_name: fn_name,
    args: args
  };

  queryRulesetFn(ctx, rulesets, function(err, data){
    if(err) return errResp(res, err);
    jsonResp(res, data);
  });
});

router.set('/', function(req, res, route){
  var html = '';
  html += '<pre>';
  db.createReadStream()
    .on('data', function (data) {
      html += JSON.stringify(data.key) + ' ->\n';
      html += '    ' + JSON.stringify(data.value) + '\n\n';
    })
    .on('end', function () {
      html += '</pre>';
      res.end(html);
    });
});

var putThenResp = function(key, val, res, data){
  db.put(key, val, function(err){
    if(err) return errResp(res, err);
    res.end(JSON.stringify(data, undefined, 2));
  });
};

var delThenResp = function(key, res){
  db.del(key, function(err){
    if(err) return errResp(res, err);
    jsonResp(res, {ok: true});
  });
};

router.set('/api/new-pico', function(req, res, route){
  var id = cuid();
  putThenResp(['pico', id], {id: id}, res, {id: id});
});

router.set('/api/pico/:id/new-channel', function(req, res, route){
  var pico_id = route.params.id;
  var name = route.data.name;
  var type = route.data.type;

  var chan_id = cuid();

  putThenResp(['pico', pico_id, 'channel', chan_id], {
    id: chan_id,
    name: name,
    type: type
  }, res, {id: chan_id});
});

router.set('/api/pico/:id/rm-channel/:eci', function(req, res, route){
  var pico_id = route.params.id;
  var chan_id = route.params.eci;

  delThenResp(['pico', pico_id, 'channel', chan_id], res);
});

router.set('/api/pico/:id/rm-ruleset/:rid', function(req, res, route){
  var pico_id = route.params.id;
  var rid = route.params.rid;

  delThenResp(['pico', pico_id, 'ruleset', rid], res);
});

router.set('/api/pico/:id/add-ruleset/:rid', function(req, res, route){
  var pico_id = route.params.id;
  var rid = route.params.rid;

  putThenResp(['pico', pico_id, 'ruleset', rid], {on: true}, res, {id: rid});
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
