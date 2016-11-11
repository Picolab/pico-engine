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

      ent:get_resp := resp2
    }
  }
}
