var test = require("tape");
var http = require("http");
var cocb = require("co-callback");
var khttp = require("./http").def;

test("http module", function(t){
    var server = http.createServer(function(req, res){
        var body = "";
        req.on("data", function(buffer){
            body += buffer.toString();
        });
        req.on("end", function(){
            var out = JSON.stringify({
                url: req.url,
                headers: req.headers,
                body: body,
            }, false, 2);
            res.writeHead(200, {
                "Content-Type": "application/json",
                "Content-Length": out.length,
                "da-extra-header": "wat?",
            });
            res.end(out);
        });
    });

    server.listen(0, function(){
        var url = "http://localhost:" + server.address().port;
        cocb.run(function*(){
            var resp;

            resp = yield khttp.get({}, [url, {a: 1}]);
            resp.content = JSON.parse(resp.content);
            t.deepEquals(resp, {
                content: {
                    "url": "/?a=1",
                    "headers": {
                        "host": "localhost:" + server.address().port,
                        "connection": "close"
                    },
                    body: ""
                },
                content_type: "application/json",
                content_length: 111,
                status_code: 200,
                status_line: "OK"
            });


            resp = yield khttp.post({}, {
                url: url,
                params: {"baz": "qux"},
                headers: {"some": "header"},
                response_headers: ["da-extra-header"],
                body: {formkey: "formval", foo: ["bar", "baz"]},
                credentials: {
                    username: "bob",
                    password: "nopass",
                }
            });
            resp.content = JSON.parse(resp.content);
            t.deepEquals(resp, {
                content: {
                    "url": "/?baz=qux",
                    "headers": {
                        "some": "header",
                        "host": "localhost:" + server.address().port,
                        "content-type": "application/x-www-form-urlencoded",
                        authorization: "Basic Ym9iOm5vcGFzcw==",
                        "content-length": "45",
                        "connection": "close"
                    },
                    body: "formkey=formval&foo%5B0%5D=bar&foo%5B1%5D=baz"
                },
                content_type: "application/json",
                content_length: 314,
                status_code: 200,
                status_line: "OK",
                "da-extra-header": "wat?"
            });

        }, function(err){
            server.close();
            t.end(err);
        });
    });
});
