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

      ent:get_resp := resp.set("content", resp["content"].decode()).delete(["content_length"])
    }
  }
}
