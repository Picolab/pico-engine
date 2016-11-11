ruleset io.picolabs.http {
  meta {
    shares getResp
  }
  global {
    getResp = function(){
      ent:get_resp
    }
  }
  rule http_get {
    select when http get;
    fired {
      resp = http:get("https://httpbin.org/get", {
        "foo": "bar"
      }, {
        "baz": "quix"
      });

      resp2 = resp.set("content", resp["content"].decode().set("origin", "-"));

      resp3 = resp2.set(
        "content_length",
        resp["content_length"] > 160 && resp["content_length"] < 400
          => 175
           | resp["content_length"]
      );

      ent:get_resp := resp3
    }
  }
}
