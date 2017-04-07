ruleset io.picolabs.http {
  meta {
    shares getResp
  }
  global {
    getResp = function(){
      ent:resp
    }
    fmtResp = function(r){
        r.set("content", r["content"].decode())
            .delete(["content_length"])
            .delete(["headers", "content-length"])
            .delete(["headers", "date"])
    }
    doPost = defaction(base_url, to, msg){
      http:post(url + "/msg.json")
        with form = {
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

      ent:resp := fmtResp(resp)
    }
  }
  rule http_post {
    select when http post;
    pre {
        url = event:attr("url")
    }
    http:post(url)
      with json = {
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
  rule http_post_setting {
    select when http post_setting;
    pre {
        url = event:attr("url")
    }
    http:post(url)
      setting(resp)
      with
        qs = {"foo": "bar"}
        and
        form = {"baz": "qux"}
    fired {
      ent:resp := fmtResp(resp)
    }
  }
}
