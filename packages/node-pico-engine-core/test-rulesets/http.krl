ruleset io.picolabs.http {
  meta {
    shares getResp
  }
  global {
    getResp = function(){
      ent:get_resp
    }
    fmtResp = function(r){
        r.set("content", r["content"].decode())
            .delete(["content_length"])
            .delete(["headers", "content-length"])
            .delete(["headers", "date"])
    }
    doPost = defaction(base_url, to, msg){
      http:post(url + "/msg.json")
        with body = {
          "To": to,
          "Msg": msg
        }
    }
  }
  rule http_get {
    select when http get;
    pre {
        url = event:attr("url")
    }
    fired {
      resp = http:get(url) with
          qs = {
            "foo": "bar"
          }
          headers = {
            "baz": "quix"
          };

      ent:get_resp := fmtResp(resp)
    }
  }
  rule http_post {
    select when http post;
    pre {
        url = event:attr("url")
    }
    http:post(url)
      with body = {
          "foo": "bar"
      }
  }
  rule http_post_action {
    select when http post_action;
    pre {
        url = event:attr("url")
    }
    doPost(url) with
      to = "bob"
      and
      msg = "foobar"
  }
}
