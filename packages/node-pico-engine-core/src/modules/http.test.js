var test = require("tape");
var http = require("http");
var cocb = require("co-callback");
var khttp = require("./http").def;

test("http module", function(t){
    var server = http.createServer(function(req, res){
        var out = JSON.stringify({
            url: req.url,
            headers: req.headers,
        }, false, 2);
        res.writeHead(200, {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(out),
        });
        res.end(out);
    });

    server.listen(0, function(){
        var url = "http://localhost:" + server.address().port;
        cocb.run(function*(){

            var resp = yield khttp.get({}, [url, {a: 1}]);
            resp.content = JSON.parse(resp.content);
            t.deepEquals(resp, {
                content: {
                    "url": "/?a=1",
                    "headers": {
                        "host": "localhost:" + server.address().port,
                        "connection": "close"
                    }
                },
                content_type: "application/json",
                content_length: 97,
                status_code: 200,
                status_line: "OK"
            });

        }, function(err){
            server.close();
            t.end(err);
        });
    });
});
