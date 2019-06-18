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
    provides getFullReport, getTestsOverview
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
           check for duplicate tests for recording tests currently running. Tests wont finish w duplicate tests
           Bug when all tests fail to create rulesets
      */

    
    test = function() {
      ent:success_result
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
        "failedToStart":ent:failed_to_start.defaultsTo({})
      };
      
      failedTests.values().length() > 0 =>
      overviewMap.put("failedTests", failedTests) |
      overviewMap
    }
    
    getFullReport = function() {
      ent:test_report
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
      globalString = globalStrings.defaultsTo([""]).join("\n");
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
            ent:savedAttrs := event:attrs;
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
          event:send({"eci":wrangler:parent_eci(), "domain":"test", "type":"test_report", "attrs": ent:savedAttrs.put({"testName" : <<#{testName}\>\>, "report":ent:running_tests, "timedOut":event:attrs{"tests_timed_out"}})})
          schedule:remove(ent:scheduled_timeout_event);
        }
        always {
          ent:tests_completed := true
        }
        }>>// end rules
    }
    
    
  }

  rule runTests {
    select when tests run_tests
    pre {
      tests_to_run = event:attr("tests")
      rid_to_test = event:attr("ruleset_under_test")
      test_names = tests_to_run.keys()
      secondsUntilTestsTimeout = 10 * tests_to_run.length() 
      
    }
    if not ent:test_session && tests_to_run then
    noop()
    fired {
      raise tests event "run_each_test" attributes event:attrs.put({
        "tests":test_names
      });
      ent:test_report := {};
      ent:failed_to_start := {};
      ent:tests_to_run := tests_to_run;
      ent:test_picos := [];
      ent:tests_timed_out := false;
      ent:ruleset_under_test := rid_to_test;
      ent:given_attrs := event:attrs;
      ent:test_session := random:uuid();
      schedule tests event "tests_timed_out" 
                              at time:add(time:now(), ent:default_timeout.defaultsTo({"seconds":secondsUntilTestsTimeout}))
                              attributes event:attrs.put("tests_timed_out", true)
                              setting(scheduled_timeout);
      ent:scheduled_timeout_event := scheduled_timeout;
    }
    else {
      raise test event "tests_failed_to_start" attributes {
        "testsAlreadyRunning":not ent:test_session.as("Boolean"),
        "testsGivenToPerform":tests_to_run.as("Boolean")
      }
    }
  }
  
  rule run_each_test {
    select when tests run_each_test
    foreach event:attr("tests") setting (testName)
    pre {
      test = ent:tests_to_run{testName}
      krlCode = generateRuleset(test, testName)
      rid = testRid(testName)
      parseResult = engine:doesKRLParse(krlCode)
    }
    if parseResult{"parsed"} then
      engine:registerRulesetFromSrc(krlCode) setting (register_response)
    fired {
      ent:success_result := register_response;
      raise wrangler event "new_child_request" attributes event:attrs.put({
        "rids":[ent:ruleset_under_test, rid, "io.picolabs.logging"],
        "name":rid,
        "testSession":ent:test_session
      })
    }
    else {
      ent:failure_result := parseResult;
      raise test event "unable_to_create_test_ruleset" attributes event:attrs.put("test_with_problem", testName)
                                                                       .put("rid_to_remove", rid)
                                                                       .put("error", parseResult{"errorLoc"});

    }
  }
  
  rule test_session_timed_out {
    select when tests tests_timed_out
    pre {
      
    }
    always {
      clear ent:test_session;
      ent:tests_timed_out := true;
      ent:test_grouo_timed_out := true;
    }
  }
  
  rule receive_test_report {
    select when test test_report
    pre {
      picoReport = event:attrs
      testName = event:attrs{"testName"}
      testReport = event:attrs{"report"}
      timedOut = event:attrs{"timedOut"}
      testSession = event:attr("testSession")
      //Check if any failed, if they did, keep the pico around
      failed = testReport.map(function(exprs, listener){
                                exprs.values().any(function(testStatus){
                                                      testStatus == "failed" || testStatus == "pending" || testStatus == "tried_to_run"
                                
                          })})
                          .values()
                          .any(function(testFailed){testFailed})
    }
    if testSession == ent:test_session then
    noop()
    fired {
      ent:test_report{[testName]} := testReport.klog("TEST REPORT UPDATED");
      raise wrangler event "child_deletion" attributes {
        "name":testRid(testName),
        //"co_id":meta:rid,
        "rid":testRid(testName)
      } if not failed;
      ent:tests_timed_out := true if timedOut
    }
  }
  
  rule are_tests_done {
    select when test test_report
    pre {
      testOverview = getTestsOverview()
      testsDone = testOverview{"numTestsRun"} == testOverview{"numTestsToRun"}
      
    }
    if testsDone then
      noop()
    fired {
      clear ent:test_session;
      raise tests event "tests_finished" attributes ent:given_attrs.put({
        "testsOverview":getTestsOverview(),
        "fullReport":getFullReport()
      })
    }
    finally {
      raise tests event "tests_progress_update" attributes ent:given_attrs.put({
        "testsOverview":getTestsOverview()
      })
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
    engine:unregisterRuleset(rid_to_remove) setting(unregister_response)
    always {
      ent:unregister_response := unregister_response
    }
  }
}
  
