ruleset io.picolabs.schedule {
  meta {
    shares getLog
  }
  global {
    getLog = function(){
      ent:log
    }
  }
  rule push_log {
    select when schedule push_log;
    send_directive("push_log")
    fired {
      ent:log := ent:log.append(event:attrs())
    }
  }
  rule in_5min {
    select when schedule in_5min;
    send_directive("in_5min")
    fired {
      schedule schedule event "push_log"
        at time:add(time:now(), {"minutes": 5})
        attributes {"from": "in_5min"}
    }
  }
  rule every_1min {
    select when schedule every_1min;
    send_directive("every_1min")
    fired {
      schedule schedule event "push_log"
        repeat "*/5 * * * *"
        with
        from = "every_1min"
    }
  }
}
