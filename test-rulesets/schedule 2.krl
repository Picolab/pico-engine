ruleset io.picolabs.schedule {
    meta {
        shares getLog, listScheduled
    }
    global {
        getLog = function(){
            ent:log;
        }
        listScheduled = function(){
            schedule:list();
        }
    }
    rule clear_log {
        select when schedule clear_log

        send_directive("clear_log");

        fired {
            ent:log := []
        }
    }
    rule push_log {
        select when schedule push_log

        send_directive("push_log");

        fired {
            ent:log := ent:log.append(event:attrs)
        }
    }
    rule in_5min {
        select when schedule in_5min

        send_directive("in_5min");

        fired {
            schedule schedule event "push_log"
                at time:add(time:now(), {"minutes": 5})
                attributes {
                    "from": "in_5min",
                    "name": event:attrs{"name"}
                }
                setting(foo);
            ent:log := ent:log.append({"scheduled in_5min": foo})
        }
    }
    rule every_1min {
        select when schedule every_1min

        send_directive("every_1min");

        fired {
            schedule schedule event "push_log"
                repeat "* */1 * * * *"
                attributes {
                    "from": "every_1min",
                    "name": event:attrs{"name"}
                }
                setting(foo);
            ent:log := ent:log.append({"scheduled every_1min": foo})
        }
    }
    rule rm_from_schedule {
        select when schedule rm_from_schedule

        schedule:remove(event:attrs{"id"});
    }
    rule dynamic_at {
        select when schedule dynamic_at
        fired {
            schedule event event:attrs{"dn"}
                at event:attrs{"at"}
                attributes {
                    "from": "dynamic_at",
                    "name": event:attrs{"name"}
                }
                setting(foo);
            ent:log := ent:log.append({"scheduled dynamic_at": foo})
        }
    }
    rule dynamic_repeat {
        select when schedule dynamic_repeat
        fired {
            schedule event event:attrs{"dn"}
                repeat event:attrs{"timespec"}
                attributes {
                    "from": "dynamic_repeat",
                    "name": event:attrs{"name"}
                }
                setting(foo);
            ent:log := ent:log.append({"scheduled dynamic_repeat": foo})
        }
    }
}
