ruleset io.picolabs.events {
    meta {
        shares getOnChooseFired, getNoActionFired, getSentAttrs, getSentName
    }
    global {
        getOnChooseFired = function(){
            ent:on_choose_fired;
        }
        getNoActionFired = function(){
            ent:no_action_fired;
        }
        getSentAttrs = function(){
            ent:sent_attrs;
        }
        getSentName = function(){
            ent:sent_name;
        }
        global0 = "g zero"
        global1 = "g one"
    }
    rule set_attr {
        select when events bind name re#^(.*)$# setting(my_name)

        send_directive("bound", {"name": my_name});
    }
    rule set_attr2 {
        select when events set_attr2
                number re#[Nn]0*(\d*)#
                name re#(.*)#
                setting(number, name)

        send_directive("set_attr2", {
            "number": number,
            "name": name
        });
    }
    rule get_attr {
        select when events get

        pre {
            thing = event:attr("thing")
        }

        send_directive("get", {"thing": thing});
    }
    rule noop {
        select when events noop
    }
    rule noop2 {
        select when events noop2

        noop();
    }
    rule ifthen {
        select when events ifthen name re#^(.*)$# setting(my_name)

        if my_name then
            send_directive("ifthen");
    }
    rule on_fired {
        select when events on_fired name re#^(.*)$# setting(my_name)

        send_directive("on_fired", {"previous_name": ent:on_fired_prev_name});

        fired {
            ent:on_fired_prev_name := my_name
        }
    }
    rule on_choose {
        select when events on_choose thing re#^(.*)$# setting(thing)

        choose thing {
            one =>
                send_directive("on_choose - one");

            two =>
                send_directive("on_choose - two");
        }

        fired {
            ent:on_choose_fired := true
        } else {
            ent:on_choose_fired := false
        }
    }
    rule on_choose_if {
        select when events on_choose_if thing re#^(.*)$# setting(thing)

        if event:attr("fire") == "yes" then
        choose thing {
            one =>
                send_directive("on_choose_if - one");

            two =>
                send_directive("on_choose_if - two");
        }

        fired {
            ent:on_choose_fired := true
        } else {
            ent:on_choose_fired := false
        }
    }
    rule on_every {
        select when events on_every

        every {
            send_directive("on_every - one");

            send_directive("on_every - two");
        }
    }
    rule on_sample {
        select when events on_sample

        sample {
            send_directive("on_sample - one");

            send_directive("on_sample - two");

            send_directive("on_sample - three");
        }
    }
    rule on_sample_if {
        select when events on_sample_if

        if event:attr("fire") == "yes" then
        sample {
            send_directive("on_sample - one");

            send_directive("on_sample - two");

            send_directive("on_sample - three");
        }
    }
    rule select_where {
        select when events select_where where something.match(re#^wat#)

        send_directive("select_where");
    }
    rule where_match_0 {
        select when events where_match_0 where something.match(re#0#)

        send_directive("where_match_0");
    }
    rule where_match_null {
        select when events where_match_null where something.match(re#null#)

        send_directive("where_match_null");
    }
    rule where_match_false {
        select when events where_match_false where something.match(re#false#)

        send_directive("where_match_false");
    }
    rule where_match_empty_str {
        select when events where_match_empty_str where event:attr("something").match(re##)

        send_directive("where_match_empty_str");
    }
    rule where_after_setting {
        select when events where_after_setting a re#(.*)# setting(a) where a == "one"

        send_directive("where_after_setting");
    }
    rule where_using_global {
        select when events where_using_global a re#(.*)# setting(global0) where global0 == global1

        send_directive("where_using_global");
    }
    rule implicit_match_0 {
        select when events implicit_match_0 something re#0#

        send_directive("implicit_match_0");
    }
    rule implicit_match_null {
        select when events implicit_match_null something re#null#

        send_directive("implicit_match_null");
    }
    rule implicit_match_false {
        select when events implicit_match_false something re#false#

        send_directive("implicit_match_false");
    }
    rule implicit_match_empty_str {
        select when events implicit_match_empty_str something re##

        send_directive("implicit_match_empty_str");
    }
    rule no_action {
        select when events no_action fired re#^yes$#i
        fired {
            ent:no_action_fired := true
        } else {
            ent:no_action_fired := false
        }
    }
    rule action_send {
        select when events action_send name re#^(.*)$# setting(my_name)

        event:send({
            "eci": meta:eci,
            "eid": "0",
            "domain": "events",
            "type": "store_sent_name",
            "attrs": {
                "name": my_name,
                "empty": [],
                "r": re#hi#i
            }
        });
    }
    rule store_sent_name {
        select when events store_sent_name name re#^(.*)$# setting(my_name)
        fired {
            ent:sent_attrs := event:attrs;
            ent:sent_name := my_name
        }
    }
    rule raise_basic {
        select when events raise_basic
        fired {
            raise events event "event_attrs"
        }
    }
    rule raise_set_name {
        select when events raise_set_name name re#^(.*)$# setting(my_name)
        fired {
            raise events event "store_sent_name"
                attributes {"name": my_name}
        }
    }
    rule raise_set_name_attr {
        select when events raise_set_name_attr name re#^(.*)$# setting(my_name)
        fired {
            raise events event "store_sent_name"
                attributes {"name": my_name}
        }
    }
    rule raise_set_name_rid {
        select when events raise_set_name_rid name re#^(.*)$# setting(my_name)

        pre {
            rid = "io.picolabs.events"
        }
        fired {
            raise events event "store_sent_name" for rid
                attributes {"name": my_name}
        }
    }
    rule raise_dynamic {
        select when events raise_dynamic domainType re#^(.*)$# setting(domainType)
        fired {
            raise event domainType
                attributes event:attrs
        }
    }
    rule event_eid {
        select when events event_eid

        send_directive("event_eid", {"eid": event:eid});
    }
    rule event_attrs {
        select when events event_attrs

        send_directive("event_attrs", {"attrs": event:attrs});
    }
    rule ignored is inactive {
        select when events ignored

        send_directive("ignored - should not see this");
    }
}
