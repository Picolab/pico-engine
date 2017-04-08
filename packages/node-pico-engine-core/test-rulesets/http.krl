ruleset io.picolabs.http {
  meta {
    shares getResp, getLastPostEvent
  }
  global {
    getResp = function(){
      ent:resp
    }
    getLastPostEvent = function(){
      ent:last_post_event
    }
    fmtResp = function(r){
        r.set("content", r["content"].decode())
            .delete(["content_length"])
            .delete(["headers", "content-length"])
            .delete(["headers", "date"])
            .delete(["content", "headers", "content-length"])
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
    select when http_test get;
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
    select when http_test post;
    pre {
        url = event:attr("url")
    }
    http:post(url)
      with json = {
          "foo": "bar"
      }
  }
  rule http_post_action {
    select when http_test post_action;
    pre {
        url = event:attr("url")
    }
    doPost(url) with
      to = "bob"
      and
      msg = "foobar"
  }
  rule http_post_setting {
    select when http_test post_setting;
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
  rule http_autorase {
    select when http_test autoraise;
    pre {
        url = event:attr("url")
    }
    http:post(url)
      with
        qs = {"foo": "bar"}
        and
        form = {"baz": "qux"}
        and
        autoraise = "foobar"
  }
  rule http_post_event_handler {
    select when http post;
    pre {
      resp = fmtResp(event:attrs())
    }
    send_directive("http_post_event_handler") with
      attrs = resp
    fired {
      ent:last_post_event := resp
    }
  }
}
