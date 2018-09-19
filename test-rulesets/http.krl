ruleset io.picolabs.http {
    meta {
        shares getResp, getLastPostEvent, fnGet, fnPost
    }
    global {
        getResp = function(){
            ent:resp;
        }
        getLastPostEvent = function(){
            ent:last_post_event;
        }
        fmtResp = function(r){
            r.set("content", r["content"].decode())
                .delete(["content_length"])
                .delete(["headers", "content-length"])
                .delete(["headers", "date"])
                .delete(["content", "headers", "content-length"]);
        }
        doPost = defaction(base_url, to, msg){

            http:post(url + "/msg.json", from = {
                "To": to,
                "Msg": msg
            });
        }
        fnGet = function(url, qs){
            http:get(url, qs = qs);
        }
        fnPost = function(url, json){
            http:post(url, json = json);
        }
    }
    rule http_get {
        select when http_test get

        pre {
            url = event:attr("url")
        }

        http:get(
            url,
            qs = {"foo": "bar"},
            headers = {"baz": "quix"},
        ) setting(resp);

        fired {
            ent:resp := fmtResp(resp)
        }
    }
    rule http_post {
        select when http_test post

        pre {
            url = event:attr("url")
        }

        every {
            http:post(url, json = {
                "foo": "bar",
                "baz": doPost
            }) setting(resp);

            send_directive("resp.content.body", resp["content"].decode()["body"].decode());
        }
    }
    rule http_post_action {
        select when http_test post_action

        pre {
            url = event:attr("url")
        }

        doPost(url, "bob", "foobar");
    }
    rule http_post_setting {
        select when http_test post_setting

        pre {
            url = event:attr("url")
        }

        http:post(
            url,
            qs = {"foo": "bar"},
            form = {"baz": "qux"},
        ) setting(resp);

        fired {
            ent:resp := fmtResp(resp)
        }
    }
    rule http_autorase {
        select when http_test autoraise

        pre {
            url = event:attr("url")
        }

        http:post(
            url,
            qs = {"foo": "bar"},
            form = {"baz": "qux"},
            autoraise = "foobar",
        );
    }
    rule http_post_event_handler {
        select when http post

        pre {
            resp = fmtResp(event:attrs)
        }

        send_directive("http_post_event_handler", {"attrs": resp});

        fired {
            ent:last_post_event := resp
        }
    }
}
