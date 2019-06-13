/* Rules with a public facing point of entry are camelCase, internal rules are snake_case*/
/*
  This ruleset is a test harness written in KRL for the purpose of testing other rulesets.
  
  It functions by creating a structure of desired information related to the test, then the ruleset
  creates a pico for each test. 
  
  The user designates which events to start off the test, then provide expressions that 
  evaluate when specified events occur, ensuring that the pico state is in the desired place
  when that event has occurred.

*/
ruleset io.picolabs.test {
  meta {
    shares __testing, test, getFullReport, getTestsOverview
    use module io.picolabs.wrangler alias wrangler
  }
  global {
    __testing = { "queries":
      [ { "name": "__testing" }
      , { "name": "test", "args": [] }
      , { "name": "getFullReport", "args": [] }
      , { "name": "getTestsOverview", "args": [] }
      ] , "events":
      [ { "domain": "tests", "type": "run_tests", "attrs":["ruleset_under_test"]},
        { "domain": "tests", "type": "unregister_ruleset", "attrs":["rid_to_remove"]}
      //, { "domain": "d2", "type": "t2", "attrs": [ "a1", "a2" ] }
      ]
    }
      
      /* todo
           schedule timeout for all tests
           remove reliance on wrangler for basic version so wrangler can be tested reliably using ruleset
           add additional functionality, such as a "start state", "chained events", etc
           debounce running tests
      */
      //generateTestStartRule(tests{"Pico Creation"})
      // ent:register_response;
      // ent:unregister_response
      // tests{["Pico Creation", "listeners", "wrangler:child_initialized", "expressions"]}[0][1].klog("under test").typeof();
    
    test = function() {
      //ent:register_response
      engine:listInstalledRIDs()
    }
    
    
    
    getNumOfTests = function(tests) {
      tests
      .values().klog("test vals")
      .reduce(function(num, test_b){
        numTestsInB = test_b{"listeners"}
                      .keys()
                      .reduce(function(num, listener_b){
                        num + test_b{["listeners",listener_b.klog("listener_b"), "expressions"]}.klog("expressions").length()  
                      },0);
        num + numTestsInB.klog("number tests found in listener")
      }, 0);
    }
    
    getFailedTests = function() {
      collectedTests = 
      ent:test_report.map(function(listeners, testName) {
                                         listeners.klog("values")
                                         .map(function(exprs, event){
                                             exprs.filter(function(testStatus, expr){
                                                      testStatus == "failed" || testStatus == "pending" || testStatus == "tried_to_run"
                                                   }).klog("pre-filter")
                                                  .keys()
                                                  .map(function(expr){ // add descriptions
                                                      testStatus = exprs{expr};
                                                      ent:tests_to_run{[testName, "listeners", event.klog("event"), "expressions"]}.klog("in tests to run").filter(function(exprArray){
                                                                                                        exprArray[1].klog("expr comparing against") == expr.klog("expr")
                                                                                                      }).head().append(testStatus)
                                                  })
                                         })
                     });
       // filter out ones that dont have failed tests
       collectedTests.filter(function(listeners, testName) {
         listeners.values().any(function(listener){listener.length() > 0})
       })
    }
    
    getTestsOverview = function() {
      numTestsToRun = getNumOfTests(ent:tests_to_run);
      numTestsHaveRun = ent:test_report.values()
                                       .reduce(function(numTests, listeners){
                                            numTests + listeners.values()
                                                                .reduce(function(num, listener){
                                                                    num + listener.values().length()
                                                                }, 0)
                                       }, 0);
      percentComplete = numTestsToRun == 0 => 100 | numTestsHaveRun.klog("has run")/numTestsToRun.klog("to run") * 100;
      hasTimedOut = ent:tests_timed_out.defaultsTo(false);
      failedTests = hasTimedOut || percentComplete >= 100 => getFailedTests() | null;
      overviewMap = {
        "percentComplete":percentComplete,
        "timedOut":hasTimedOut,
        "numTestsRun":numTestsHaveRun,
        "numTestsToRun":numTestsToRun,
        "failedToStart":ent:failed_to_start.defaultsTo("None")
      };
      
      failedTests.values().length() > 0 =>
      overviewMap.put("failedTests", failedTests) |
      overviewMap
    }
    
    getFullReport = function() {
      ent:test_report
    }
    
    wrangler_tests = {
      "Pico Creation": {
        "kickoff_events": {
          "wrangler:new_child_request":{"name":"blue"}
        },
        "start_state": <<>>,
        "prototype":<<>>,
        "listeners": {
          "wrangler:child_initialized" : {
             "expressions": [
                ["Child name should exist", <<wrangler:children(event:attrs{"name"})>>]
               ,["Pico should only have one child", <<wrangler:children().length() == 1>>]
               ,["Child name should be blue", <<wrangler:children().any(function(child){child{"name"} == "blue"})>>]
              ]
          }
        },
        "meta": [
          "use module io.picolabs.wrangler alias wrangler"
        ],
        "global":[]
      },
      "Pico Deletion": {
        "kickoff_events": {
          "wrangler:new_child_request":{"name":"blue", "co_id":"test_id"},
          "wrangler:child_deletion":{"name":"blue", "co_id":"test_id"}
        },
        "start_state": <<>>,
        "listeners": {
          "wrangler:child_deleted" : {
             "expressions": [
                ["Child name should be the requested child ", <<event:attrs{"name"} == "blue">>]
               ,["Correlation ID should be passed along", <<event:attrs{"co_id"} == "test_id">>]
               ,["No children should exist", <<wrangler:children().length() == 0>>]
              ]
          }
        },
        "meta": [
          "use module io.picolabs.wrangler alias wrangler"
        ],
        "global":[]
      },
      "Channel Creation": {
        "kickoff_events": {
          "wrangler:channel_creation_requested":{"name":"blue","type":"typeC", "co_id":"test_id"}
        },
        "start_state": <<>>,
        "listeners": {
          "wrangler:channel_created" : {
             "expressions": [
                ["Channel name in event attr channel map", <<event:attrs{["channel","name"]} == "blue">>]
               ,["Channel map should have channel ID", <<event:attrs{["channel","id"]}>>]
               ,["Channel map should have pico ID", <<event:attrs{["channel","pico_id"]}>>]
               ,["Channel map should have channel type", <<event:attrs{["channel","type"]}>>]
               ,["Channel map should have policy ID", <<event:attrs{["channel","policy_id"]}>>]
               ,["Channel map should have sovrin map", <<event:attrs{["channel","sovrin"]}>>]
               ,["Channel map should have sovrin map with did value", <<event:attrs{["channel","sovrin","did"]}>>]
               ,["Channel map should have sovrin map with verifyKey", <<event:attrs{["channel","sovrin","verifyKey"]}>>]
               ,["Channel map should have sovrin map with encryptionPublicKey", <<event:attrs{["channel","sovrin","encryptionPublicKey"]}>>]
               ,["Channel should exist when queried for", <<wrangler:channel("blue")>>]
               ,["Correlation identifier should have been passed through", <<event:attrs{"co_id"} == "test_id">>]
              ]
          }
        },
        "meta": [
          "use module io.picolabs.wrangler alias wrangler"
        ],
        "global":[]
      },
      "Ruleset installation from on engine": {
        "kickoff_events": {
          "wrangler:install_rulesets_requested":{"rids":"io.picolabs.policy", "co_id":"test_id"}
        },
        "start_state": <<>>,
        "listeners": {
          "wrangler:ruleset_added" : { 
             "expressions": [
                ["Installed ruleset should be in rids attribute", <<event:attrs{"rids"}.klog("RIDS ATTR HAS").any(function(rid){rid == "io.picolabs.policy"})>>]
               ,["Correlation ID should be passed along", <<event:attrs{"co_id"} == "test_id">>]
               ,["Direct engine query should yield ruleset as installed", <<engine:listInstalledRIDs().any(function(rid){rid == "io.picolabs.policy"})>>]
              ],
              "eventex":<<where not event:attr("parent_eci")>> // Where not parent_eci attr means this wont be triggered by the rule that installs the test ruleset
          }
        },
        "meta": [
          "use module io.picolabs.wrangler alias wrangler"
        ],
        "global":[]
      },
      "Ruleset installation from URL": {
        "kickoff_events": {
          "wrangler:install_rulesets_requested":{"url":"https://github.com/Picolab/Manifold/raw/master/Manifold_krl/io.picolabs.wovyn_base", "co_id":"test_id"}
        },
        "start_state": <<>>,
        "listeners": {
          "wrangler:ruleset_added" : { 
             "expressions": [
                ["Installed ruleset should be in rids attribute", <<event:attrs{"rids"}.any(function(rid){rid == "wovyn_base"})>>]
               ,["Correlation ID should be passed along", <<event:attrs{"co_id"} == "test_id">>]
               ,["Direct engine query should yield ruleset as installed", <<engine:listInstalledRIDs().any(function(rid){rid == "wovyn_base"})>>]
              ],
              "eventex":<<where not event:attr("parent_eci")>> // Where not parent_eci attr means this wont be triggered by the rule that installs the test ruleset
          }
        },
        "meta": [
          "use module io.picolabs.wrangler alias wrangler"
        ],
        "global":[]
      },
      "Attempt to install invalid ruleset should inform": {
        "kickoff_events": {
          "wrangler:install_rulesets_requested":{"rids":"io.picolabs.policy;nonexistent_ruleset_ajsdjdk", "co_id":"test_id"}
        },
        "start_state": <<>>,
        "listeners": {
          "wrangler:install_rulesets_error" : { 
             "expressions": [
                ["Error event should be raised with ruleset(s) that couldn't be installed", <<event:attrs{"rids"}.any(function(rid){rid == "nonexistent_ruleset_ajsdjdk"})>>]
               ,["Correlation ID should be passed along", <<event:attrs{"co_id"} == "test_id">>]
              ]
          }
        },
        "meta": [
          "use module io.picolabs.wrangler alias wrangler"
        ],
        "global":[]
      }
      // "Multiple Children": {
      //   "kickoff_events": {
      //     "wrangler:channel_creation_requested":{"name":"blue","type":"typeC", "co_id":"test_id"}
      //   },
      //   "start_state": <<>>,
      //   "listeners": {
      //     "wrangler:child_deleted" : {
      //       "expressions": [
      //           ["Child name should be the requested child ", <<event:attrs{"name"} == "blue">>]
      //         ,["Pico should only have one child", <<wrangler:children().length() == 1>>]
      //         ,["Child name should be blue", <<wrangler:children().any(function(child){child{"name"} == "blue"})>>]
      //         ]
      //     }
      //   },
      //   "meta": [
      //     "use module io.picolabs.wrangler alias wrangler"
      //   ],
      //   "global":[]
      // }
    }
    
    testRid = function(testName) {
      meta:rid + "." + ent:ruleset_under_test + "." + testName.replace(re# #g, "");
    }
    
    generateRuleset = function(test, testName) {
      rid = testRid(testName);
      metaBlock = generateMetaBlock(test{"meta"}.klog("meta passing")).klog("generated meta block");
      globalBlock = generateGlobalBlock(test{"global"});
      rules = generateRules(test, testName);
      "ruleset " + rid + "{" + metaBlock + globalBlock + rules + "}"
    }
    
    generateRules = function(test, testName) {
      testStartRule = generateTestStartRule(test);
      testRules = test{"listeners"}.map(function(listener, listenerName){
        generateTestRule(listener, listenerName)
      }).values().join(" ");
      testCompletionCheckRules = generateTestCompletionCheckRules(testName);
      <<
        #{testStartRule}
        #{testRules}
        #{testCompletionCheckRules}
      >>
    }
    
    generateMetaBlock = function(metaStrings) {
      metaString = metaStrings.join(" ").defaultsTo("").klog("joined array");
      "meta{" + metaString +"}"
    }
    
    generateGlobalBlock = function(globalStrings) {
      globalString = globalStrings.join("\n").defaultsTo("");
      areTestsCompleteFn = 
        <<areTestsComplete = function() {
          ent:running_tests.map(function(expressions, event) {
            expressions.map(function(testStatus, testExpr) {
              testStatus == "failed" || testStatus == "passed" || testStatus == "tried_to_run"
            }).values().all(function(testAttempted) {testAttempted})
          })
          .values()
          .all(function(testAttempted) {testAttempted})
        }>>;
        
      <<global{ 
        #{globalString}
        #{areTestsCompleteFn}  
        }>>
    }
    
    /*
      rule testStart
        w test_ruleset installed
        -> create entity var to hold test progress
        -> raise kickoff events w their attributes
        -> schedule a timeout for if any tests hard fail
    */
    generateTestStartRule = function(test) {
      testEntityVar = function(listeners) {
        listenersToTest = listeners.map(function(properties,listener) {
          exprStatusMap = "{}" + properties{"expressions"}.map(function(exp_arr){<<.put(<<#{exp_arr[1]}\>\>, "pending")>>}).join("");
        <<"#{listener}" : #{exprStatusMap}>>
        }).values().join(",");
        "ent:running_tests := {"+ listenersToTest +"};
        "
      };
      
      raisedEvents = test{"kickoff_events"}.map(function(event_attrs, event){
        domain_and_event = event.split(re#:#);
        <<raise #{domain_and_event[0]} event "#{domain_and_event[1]}" attributes {}.put(#{event_attrs.encode()})>>
      }).values();
      
      scheduledTimeout = << schedule test event "test_timed_out" 
                              at time:add(time:now(), ent:default_timeout.defaultsTo({"seconds":20}))
                              attributes event:attrs.put("tests_timed_out", true)
                              setting(scheduled_timeout);
                            ent:scheduled_timeout_event := scheduled_timeout; >>;
                            
      <<rule testStart { 
        select when wrangler ruleset_added where rids >< "#{ent:ruleset_under_test}"
          always{
            #{testEntityVar(test{"listeners"})}
            #{scheduledTimeout}
            #{raisedEvents.join(";
            ")} 
            
          } 
        }>> // rule end
    }
    
    /*
      rule test_rule_<UUID>
        w listener event
        -> set ent:running_tests "tried to run" for relevant expressions
        -> raise event if expr_sucess
        -> raise event if expr_failed
    */
    generateTestRule = function(listener, listenerName) {
      domain_and_event = listenerName.split(re#:#);
      domain = domain_and_event[0];
      event = domain_and_event[1];
      eventex = listener{"eventex"}.defaultsTo("");
      
      testExprs = function(expressions) {
        expressions.map(function(exprPair){
            expression = exprPair[1].klog("EXPRESSION HERE TOOODODODODODO");
            exprDescription = exprPair[0];
            attrs = <<event:attrs.put("test_description", <<#{exprDescription}\>\>).put("test_listener", <<#{listenerName}\>\>)>>;
            <<ent:running_tests{["#{listenerName}", <<#{expression}\>\>]} := "passed" if #{expression};
              ent:running_tests{["#{listenerName}", <<#{expression}\>\>]} := "failed" if not (#{expression});>>
        }).join("
        ")
      };
      
      <<rule test_rule_#{random:uuid()} {
        select when #{domain} #{event} #{eventex}
        always {
          ent:running_tests{"#{listenerName}"} := ent:running_tests{"#{listenerName}"}
                                                                 .map(function(status,expr) {
                                                                    "tried_to_run"
                                                                 });
         raise test event "test_ran" attributes event:attrs;
         #{testExprs(listener{"expressions"})}
        }
      } >>
    }
    
    /*
    rule are_tests_done
      w expression success or expression failure or tests_timed_out
      -> unschedule timeout
      -> send test result back
    */
    generateTestCompletionCheckRules = function(testName) {

      
      <<rule are_tests_done {
        select when test test_ran
        if not areTestsComplete() then
          noop()
        fired {
          last
        }
        }
        
        rule inform_parent_tests_done {
        select when test test_ran or
                    test test_timed_out
        if not ent:tests_completed then
        every {
          event:send({"eci":wrangler:parent_eci(), "domain":"test", "type":"test_report", "attrs": {"testName" : <<#{testName}\>\>, "report":ent:running_tests, "timedOut":event:attrs{"tests_timed_out"}}})
          schedule:remove(ent:scheduled_timeout_event);
        }
        always {
          ent:tests_completed := true
        }
        }>>// end rules
    }
    
    
  }
  
  /**
   * tests = [
     randomPicoName: {
       randomPicoName should return a random english word if children <= 200: true // true means passed, fail means test failed
       randomPicoName should return a UUID if children > 200: true
     }
     new_child_request: {
       New child should be created: false
       ...
     }
     ...
   ]
   * tests = [
      randomPicoName: {
        kickoff_events: [
          "wrangler:new_child_request"
        ]
        listeners: [
          "wrangler:child_initialized" : {
           expressions: [
              "children(event:attrs{"name"})"
              "children().length() == 1"
           ]
            
          }
        ]
      }
    ]
   * 
   */
   
  rule runTests {
    select when tests run_tests
    pre {
      tests_to_run = event:attr("tests") || wrangler_tests
      rid_to_test = event:attr("ruleset_under_test")
      
    }
    if not ent:tests_running then
    noop()
    fired {
      //ent:tests_to_run := tests_to_run;
      raise tests event "run_each_test" attributes event:attrs.put({
        "tests":tests_to_run.klog("running tests").keys()
      });
      ent:test_report := {};
      ent:failed_to_start := {};
      ent:tests_to_run := tests_to_run;
      ent:test_picos := [];
      ent:tests_timed_out := false;
      ent:ruleset_under_test := rid_to_test
      //ent:tests_running := true;
    }
  }
  
  rule run_each_test {
    select when tests run_each_test
    foreach event:attr("tests") setting (testName)
    pre {
      test = ent:tests_to_run{testName}
      krlCode = generateRuleset(test, testName)
      rid = testRid(testName)
    }
    // a bit of a hack. 
    http:post(meta:host + "/api/ruleset/register",
              form = {
                "src": krlCode
              }) setting (register_response)
    always {
      register_response.klog("ruleset register response");
      ent:register_response := register_response if register_response{"status_code"} != 200;
      raise test event "unable_to_create_test_ruleset" attributes event:attrs.put("test_with_problem", testName)
                                                                             .put("rid_to_remove", rid)
                                                                             .put("error", register_response{"content"}.decode(){"error"}) if register_response{"status_code"} != 200;
      raise wrangler event "new_child_request" attributes event:attrs.put({
        "rids":[ent:ruleset_under_test, rid, "io.picolabs.logging"],
        "name":rid
      }) if register_response{"status_code"} == 200
    }
  }
  
  rule receive_test_report {
    select when test test_report
    pre {
      picoReport = event:attrs
      testName = event:attrs{"testName"}
      testReport = event:attrs{"report"}
      timedOut = event:attrs{"timedOut"}
      //Check if any failed, if they did, keep the pico around
      failed = testReport.map(function(exprs, listener){
                                exprs.values().any(function(testStatus){
                                                      testStatus == "failed" || testStatus == "pending" || testStatus == "tried_to_run"
                                
                          })})
                          .values()
                          .any(function(testFailed){testFailed})
    }
    always {
      ent:test_report{[testName]} := testReport.klog("TEST REPORT UPDATED");
      raise wrangler event "child_deletion" attributes {
        "name":testRid(testName),
        //"co_id":meta:rid,
        "rid":testRid(testName)
      } if not failed;
      ent:tests_timed_out := true if timedOut
    }
  }
  
  rule failed_to_start_test {
    select when test unable_to_create_test_ruleset
    pre {
      testName = event:attrs{"test_with_problem"}
    }
    always {
      ent:failed_to_start := ent:failed_to_start.defaultsTo({}).put(testName, event:attrs{"error"});
      clear ent:tests_to_run{testName}
    }
  }
  
  rule delete_rid_after_child_deleted {
    select when wrangler child_deleted
    pre {
      completedTestRid = event:attrs{"rid"}
    }
    if completedTestRid then
    noop()
    fired {
      raise tests event "unregister_ruleset" attributes event:attrs.put("rid_to_remove", completedTestRid)
    }
  }
  
  
  
  rule unregister_test_ruleset {
    select when tests unregister_ruleset
             //or test unable_to_create_test_ruleset
    pre {
      rid_to_remove = event:attrs{"rid_to_remove"}.klog("trying to remove rid")
    }
    http:get(meta:host + "/api/ruleset/unregister/" + rid_to_remove) setting(unregister_response)
    always {
      ent:unregister_response := unregister_response
    }
  }


  //-------------------- Without Wrangler Branch  ----------------------
  // Used to test Wrangler, this sequence of rules perform the tests without making any calls/sending any events to Wrangler
  
  
  // rule run_each_test_wout_wrangler {
  //   select when tests run_each_test_wout_wrangler
  //   foreach event:attr("tests") setting (testName)
  //   pre {
  //     test = ent:tests_to_run{testName}
  //     krlCode = generateRuleset(test, testName)
  //     rid = testRid(testName)
  //     without_wrangler = event:attrs{"without_wrangler"}
  //   }
  //   // a bit of a hack. 
  //   http:post(meta:host + "/api/ruleset/register",
  //             form = {
  //               "src": krlCode
  //             }) setting (register_response)
  //   always {
  //     register_response.klog("ruleset register response");
  //     ent:register_response := register_response if register_response{"status_code"} != 200;
  //     raise test event "unable_to_create_test_ruleset" attributes event:attrs.put("test_with_problem", testName)
  //                                                                           .put("rid_to_remove", rid)
  //                                                                           .put("error", register_response{"content"}.decode(){"error"}) if register_response{"status_code"} != 200;
  //     raise test event "test_creation" attributes event:attrs.put({
  //       "rids":[rulesetUnderTest, rid],
  //       "name":rid
  //     }) if register_response{"status_code"} == 200;
  //     ent:a := 1;
  //   }
  //   //on final raise wrangler child_sync
  // }
  
  //   rule create_test_pico_wout_wrangler {
  //   select when test test_creation
  //   pre {
  //     requiredRids = event:attrs{"rids"}.append(["io.picolabs.wrangler", "io.picolabs.subscription"])
  //     picoName = event:attrs{"name"}
      
  //   }
  //     every{
  //       engine:newChannel(meta:picoId, picoName, "test_child") setting(parent_channel);// new eci for parent to child
  //       engine:newPico() setting(child);// newpico
  //       engine:newChannel(child{"id"}, "main", "wrangler"/*"secret"*/) setting(channel);// new child root eci
  //       engine:installRuleset(child{"id"},requiredRids);// install child OS
  //       event:send( // introduce child to itself and parent
  //         { "eci": channel{"id"},
  //           "domain": "test", 
  //           "type": "begin_test",
  //           "attrs": 
  //               event:attrs.put(({
  //               "parent_eci": parent_channel{"id"},
  //               "name": name,
  //               "id" : child{"id"},
  //               "eci": channel{"id"},
  //               "rids_to_install": rids.defaultsTo([]).append(config{"connection_rids"}),
  //               "rids_from_url": rids_from_url.defaultsTo([])
  //           }))
  //         });
  //     }
  //     always {
  //       ent:test_picos := ent:test_picos.append()
  //     }
  // }
}
  
