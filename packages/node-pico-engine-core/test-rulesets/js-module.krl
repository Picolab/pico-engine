ruleset io.picolabs.js-module {
    meta {
        shares qFn
    }
    global {
        qFn = function(a){
            myJsModule:fun0(a, b = 2);
        }
    }
    rule action {
        select when js_module action

        every {
            myJsModule:act(100, b = 30) setting(val);

            send_directive("resp", {"val": val});
        }
    }
}
