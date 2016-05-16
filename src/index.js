var http = require('http');
var HttpHashRouter = require('http-hash-router');

var port = process.env.PORT || 8080;

var router = HttpHashRouter();

router.set('/sky/event/:eci/:eid/:domain/:type', function(req, res, route){
  console.log(route.params);
  res.end('OK');
});

router.set('/sky/cloud/:rid/:function', function(req, res, route){
  console.log(route.params);
  res.end('OK');
});

var server = http.createServer(function handler(req, res) {
  router(req, res, {}, onError);

  function onError(err){
    if(err){
      res.statusCode = err.statusCode || 500;
      res.end(err.message);
    }
  }
});

server.listen(port, function(){
  console.log('http://localhost:' + server.address().port);
});
