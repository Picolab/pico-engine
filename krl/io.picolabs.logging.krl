ruleset io.picolabs.logging {
  meta {
    shares __testing, getLogs
  }
  global {
    __testing = { "queries": [ { "name": "__testing" },
                               { "name": "getLogs" } ],
                  "events": [ { "domain": "picolog", "type": "reset" },
                              { "domain": "picolog", "type": "test_data" } ] }

    loggingStatus = function() {
      ent:status => "true" | "false"
    }

    getLogs = function() {
      { "status": loggingStatus(),
        "logs": ent:logs }
    }
  }

  rule picolog_reset {
    select when picolog reset
    noop()
    fired {
      ent:status := false;
      ent:logs := {}
    }
  }

  rule picolog_test_data {
    select when picolog test_data
    pre {
      key = ("2016-12-19T22:52:16.777Z - " + meta:eci + " - 151")
            .replace(re#[.]#,"_")
            .klog("key")
      data = [ "57 pico/child_created event recieved",
               "65 pico/child_created event added to pico queue: ciwxnjhdh0000plaoyg58tmdp",
               "73 pico/child_created event being processed",
               "81 pico/child_created rule added to schedule: io.picolabs.pico -> pico_child_c",
               "89 pico/child_created rule selected: io.picolabs.pico -> pico_child_created",
               "97 pico/child_created fired",
               "105 pico/new_ruleset adding raised event to schedule",
               "113 pico/new_ruleset rule added to schedule: io.picolabs.pico -> pico_new_rules",
               "121 pico/new_ruleset rule selected: io.picolabs.pico -> pico_new_ruleset",
               "129 pico/new_ruleset fired",
               "137 pico/ruleset_added adding raised event to schedule",
               "145 pico/ruleset_added rule added to schedule: io.picolabs.visual_params -> vis",
               "153 pico/ruleset_added rule selected: io.picolabs.visual_params -> visual_updat",
               "161 pico/ruleset_added fired",
               "169 pico/child_created event finished processing"
             ]
      key2 = ("2016-12-19T22:52:47.313Z - " + meta:eci + " - another-event-id")
             .replace(re#[.]#,"+")
      data2 = [ "nothing", "of", "interest", "here" ]
    }
    noop()
    fired {
      ent:status := true;
      ent:logs := ent:logs.defaultsTo({});
      ent:logs{key} := data;
      ent:logs{key2} := data2
    }
  }
}
