ruleset io.picolabs.http {
  meta {
    shares getResp
  }
  global {
    getResp = function(){
      ent:get_resp
    }
    fmtResp = function(r){
        r.set("content", r["content"].decode()).delete(["content_length"])
    }
  }
  rule http_get {
    select when http get;
    pre {
        url = event:attr("url")
    }
    fired {
      resp = http:get(url) with
          params = {
            "foo": "bar"
          }
          headers = {
            "baz": "quix"
          };

      ent:get_resp := fmtResp(resp)
    }
  }
}
