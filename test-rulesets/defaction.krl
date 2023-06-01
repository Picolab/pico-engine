ruleset io.picolabs.defaction {
    meta {
        shares getSettingVal, add
    }
    global {
        add = function(a, b){
            {
                "type": "directive",
                "name": "add",
                "options": {"resp": a + b}
            };
        }
        foo = defaction(a){
            b = 2;

            send_directive("foo", {
                "a": a,
                "b": b + 3
            });
        }
        bar = defaction(
            one,
            two = add(1, 1){["options", "resp"]},
            three = "3 by default",
        ){

            send_directive("bar", {
                "a": one,
                "b": two,
                "c": three
            }) setting(dir);

            return dir;
        }
        getSettingVal = function(){
            ent:setting_val;
        }
        chooser = defaction(val){

            choose val {
                asdf =>
                    foo(val);

                fdsa =>
                    bar(val, "ok", "done");
            }
        }
        ifAnotB = defaction(a, b){

            if a && not b then
            every {
                send_directive("yes a");

                send_directive("not b");
            }
        }
        echoAction = defaction(a, b, c){

            noop();

            return [a, b, c];
        }
        complexAction = defaction(a, b){
            c = 100;
            d = c + b;

            if c > 0 then
                send_directive("wat:" + a, {"b": b}) setting(dir);

            return dir["name"] + " " + d;
        }
    }
    rule foo {
        select when defa foo

        foo("bar");
    }
    rule bar {
        select when defa bar

        bar(
            "baz",
            two = "qux",
            three = "quux",
        );
    }
    rule bar_setting {
        select when defa bar_setting

        bar(
            "baz",
            two = "qux",
            three = "quux",
        ) setting(val);

        fired {
            ent:setting_val := val
        }
    }
    rule chooser {
        select when defa chooser

        chooser(event:attrs{"val"});
    }
    rule ifAnotB {
        select when defa ifAnotB

        ifAnotB(event:attrs{"a"} == "true", event:attrs{"b"} == "true");
    }
    rule returns {
        select when defa returns

        every {
            echoAction("where", "in", "the") setting(abc);

            complexAction(abc[0] + abc[1] + abc[2], 333) setting(d);
        }

        fired {
            ent:setting_val := [abc[0], abc[1], abc[2], d]
        }
    }
    rule scope {
        select when defa scope

        pre {
            something = defaction(){

                noop();

                return "did something!";
            }
            send_directive = defaction(){

                noop() setting(foo);

                return "send wat? noop returned: " + foo;
            }
            echoAction = defaction(){

                noop();

                return ["aint", "no", "echo"];
            }
        }

        every {
            echoAction("where", "in", "the") setting(abc);

            something() setting(d);

            send_directive() setting(e);
        }

        fired {
            ent:setting_val := [abc[0], abc[1], abc[2], d, e]
        }
    }
}
