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
    pre {
        url = event:attr("url")
    }
    fired {
      resp = http:get(url, {
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

      resp4 = resp3.delete(["content", "headers"]);

      ent:get_resp := resp4
    }
  }
}
