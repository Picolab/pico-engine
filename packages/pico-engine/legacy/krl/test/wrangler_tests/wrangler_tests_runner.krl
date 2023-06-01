/* Rules with a public facing point of entry are camelCase, internal rules are snake_case*/
ruleset wrangler_tests_runner {
  meta {
    shares __testing, progress, fullReport
    use module io.picolabs.test alias tests

  }
  global {
    __testing = { "queries":
      [ { "name": "__testing" }
      , { "name": "progress", "args": [ ] }
      , { "name": "fullReport", "args": [ ] }
      ] , "events":
      [ { "domain": "wrangler", "type": "run_tests" }
      //, { "domain": "d2", "type": "t2", "attrs": [ "a1", "a2" ] }
      ]
    }
    
    progress = function() {
      ent:progress_report
    }
    
    fullReport = function() {
      ent:full_report
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
      "Pico Creation with child_creation": {
        "kickoff_events": {
          "wrangler:child_creation":{"name":"blue"}
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
               ,["Parent -> Child channel should no longer exist", <<engine:listChannels().none(function(chan){chan{"name"} == "blue" && chan{"type"} == "children"})>>]
              ]
          }
        },
        "meta": [
          "use module io.picolabs.wrangler alias wrangler"
        ],
        "global":[]
      },
      "Pico Deletion with delete_children": {
        "kickoff_events": {
          "wrangler:new_child_request":{"name":"blue", "co_id":"test_id"},
          "wrangler:delete_children":{"delete_all":true, "co_id":"test_id"}
        },
        "start_state": <<>>,
        "listeners": {
          "wrangler:child_deleted" : {
             "expressions": [
                ["Child name should be the requested child ", <<event:attrs{"name"} == "blue">>]
               ,["Correlation ID should be passed along", <<event:attrs{"co_id"} == "test_id">>]
               ,["No children should exist", <<wrangler:children().length() == 0>>]
               ,["Parent -> Child channel should no longer exist", <<engine:listChannels().none(function(chan){chan{"name"} == "blue" && chan{"type"} == "children"})>>]
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
      "Channel Deletion": {
        "kickoff_events": {
          "wrangler:channel_creation_requested":{"name":"blue","type":"typeC", "co_id":"test_id"},
          "wrangler:channel_deletion_requested":{"name":"blue", "co_id":"test_id"}
        },
        "start_state": <<>>,
        "listeners": {
          "wrangler:channel_deleted" : {
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
               ,["Channel should not exist when queried for", <<wrangler:channel("blue") == null>>]
               ,["Correlation identifier should have been passed through", <<event:attrs{"co_id"} == "test_id">>]
              ]
          }
        },
        "meta": [
          "use module io.picolabs.wrangler alias wrangler"
        ],
        "global":[]
      },      
      "Channel Deletion of nonexistent channel": {
        "kickoff_events": {
          "wrangler:channel_deletion_requested":{"id":"asdasd", "co_id":"test_id"}
        },
        "start_state": <<>>,
        "listeners": {
          "wrangler:channel_deletion_failed" : {
             "expressions": [
               ["Correlation identifier should have been passed through", <<event:attrs{"co_id"} == "test_id">>],
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
                ["Installed ruleset should be in rids attribute", <<event:attrs{"rids"}.any(function(rid){rid == "io.picolabs.policy"})>>]
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
      // "Ruleset installation from URL": {
      //   "kickoff_events": {
      //     "wrangler:install_rulesets_requested":{"url":"https://github.com/Picolab/Manifold/raw/master/Manifold_krl/io.picolabs.wovyn_base", "co_id":"test_id"}
      //   },
      //   "start_state": <<>>,
      //   "listeners": {
      //     "wrangler:ruleset_added" : { 
      //       "expressions": [
      //           ["Installed ruleset should be in rids attribute", <<event:attrs{"rids"}.any(function(rid){rid == "wovyn_base"})>>]
      //         ,["Correlation ID should be passed along", <<event:attrs{"co_id"} == "test_id">>]
      //         ,["Direct engine query should yield ruleset as installed", <<engine:listInstalledRIDs().any(function(rid){rid == "wovyn_base"})>>]
      //         ],
      //         "eventex":<<where not event:attr("parent_eci")>> // Where not parent_eci attr means this wont be triggered by the rule that installs the test ruleset
      //     }
      //   },
      //   "meta": [
      //     "use module io.picolabs.wrangler alias wrangler"
      //   ],
      //   "global":[]
      // },
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
      },
      // Requires networking -> Will not work in startup tests as the test pico engine does not have networking enabled 
      // "skyQuery": {
      //   "kickoff_events": {
      //     "wrangler:child_creation":{"name":"queryTarget"}
      //   },
      //   "start_state": <<>>,
      //   "listeners": {
      //     "wrangler:child_initialized" : { 
      //       "expressions": [
      //           ["Querying oneself should result in a failed query", <<wrangler:skyQuery(meta:eci, "io.picolabs.wrangler", "myself"){"error"}>>]
      //         ,["Querying oneself should result in a failed query", <<wrangler:skyQuery(meta:eci, "io.picolabs.wrangler", "myself"){["httpStatus", "code"]} == 400>>]
      //         ,["Querying child just created works and io.picolabs.visual_params:dname() exists", <<wrangler:skyQuery(event:attr("eci"), "io.picolabs.visual_params", "dname") == event:attr("name")>>]
      //         ]
      //     }
      //   },
      //   "meta": [
      //     "use module io.picolabs.wrangler alias wrangler"
      //   ]
      // },
      "children": { // TODO: Implement aggregators in tests so can be tested w multiple children
        "kickoff_events": {
          "wrangler:child_creation":{"name":"child"}
        },
        "start_state": <<>>,
        "listeners": {
          "wrangler:child_initialized" : { 
             "expressions": [
                ["children w no params returns array of children", <<wrangler:children().length() == 1>>]
               ,["children w no params returns array of children", <<wrangler:children()[0]{"name"} == "child">>]
               ,["children w name parameter gives all picos w that name", <<wrangler:children("child")[0]{"name"} == "child">>]
               ,["children w name parameter gives all picos w that name", <<wrangler:children("doesntexist").length() == 0>>]
               ,["children in children array have parent_eci value", <<wrangler:children()[0]{"parent_eci"}>>]
               ,["children in children array have name value", <<wrangler:children()[0]{"name"}>>]
               ,["children in children array have id value", <<wrangler:children()[0]{"id"}>>]
               ,["children in children array have eci value", <<wrangler:children()[0]{"eci"}>>]
              ]
          }
        },
        "meta": [
          "use module io.picolabs.wrangler alias wrangler"
        ]
      },
      "myself and name": {
        "kickoff_events": {
        },
        "start_state": <<>>,
        "listeners": {
          "wrangler:ruleset_added" : { // when the test RID is installed 
             "expressions": [
                ["myself has an id value", <<wrangler:myself(){"id"}>>]
               ,["myself has an eci parameter", <<wrangler:myself(){"eci"}>>]
               ,["myself has a name value", <<wrangler:myself(){"name"}>>]
               ,["name exists and is a string", <<wrangler:name() && typeof(wrangler:name()) == "String">>]
              ]
          }
        },
        "meta": [
          "use module io.picolabs.wrangler alias wrangler"
        ]
      },
      "randomPicoName": {
        "kickoff_events": {
        },
        "start_state": <<>>,
        "listeners": {
          "wrangler:ruleset_added" : { // when the test RID is installed 
             "expressions": [
                ["randomPicoName returns a string", <<typeof(wrangler:randomPicoName()) == "String">>]
              ]
          }
        },
        "meta": [
          "use module io.picolabs.wrangler alias wrangler"
        ]
      },
      "randomPicoName": {
        "kickoff_events": {
        },
        "start_state": <<>>,
        "listeners": {
          "wrangler:ruleset_added" : { // when the test RID is installed 
             "expressions": [
                ["randomPicoName returns a string", <<typeof(wrangler:randomPicoName()) == "String">>]
              ]
          }
        },
        "meta": [
          "use module io.picolabs.wrangler alias wrangler"
        ]
      },
      "installedRulesets": {
        "kickoff_events": {
        },
        "start_state": <<>>,
        "listeners": {
          "wrangler:ruleset_added" : { // when the test RID is installed 
             "expressions": [
                ["Installed rulesets should be an array", <<typeof(wrangler:installedRulesets()) == "Array">>]
               ,["Installed rulesets should be more than one", <<wrangler:installedRulesets().length() > 1>>]
               ,["Installed rulesets should have subscriptions", <<wrangler:installedRulesets().any(function(ridString){ridString == "io.picolabs.subscription"})>>]
              ]
          }
        },
        "meta": [
          "use module io.picolabs.wrangler alias wrangler"
        ]
      },
      "registeredRulesets": {
        "kickoff_events": {
        },
        "start_state": <<>>,
        "listeners": {
          "wrangler:ruleset_added" : { // when the test RID is installed 
             "expressions": [
                ["Registered rulesets should be an array", <<typeof(wrangler:registeredRulesets()) == "Array">>]
               ,["Registered rulesets should be more than one", <<wrangler:registeredRulesets().length() > 1>>]
               ,["Registered rulesets should have subscriptions", <<wrangler:registeredRulesets().any(function(ridString){ridString == "io.picolabs.subscription"})>>]
              ]
          }
        },
        "meta": [
          "use module io.picolabs.wrangler alias wrangler"
        ]
      },
      "rulesetsInfo": {
        "kickoff_events": {
        },
        "start_state": <<>>,
        "listeners": {
          "wrangler:ruleset_added" : { // when the test RID is installed 
             "expressions": [
                ["rulesetsInfo should be an array", <<typeof(wrangler:rulesetsInfo(["io.picolabs.wrangler"])) == "Array">>]
               ,["rulesetsInfo for wrangler should have wrangler rid", <<wrangler:rulesetsInfo(["io.picolabs.wrangler"])[0]{"rid"} == "io.picolabs.wrangler">>]
               ,["rulesetsInfo can also take semicolon delimited list", <<wrangler:rulesetsInfo("io.picolabs.wrangler;io.picolabs.subscription").any(function(info){info{"rid"} == "io.picolabs.subscription"})>>]
              ]
          }
        },
        "meta": [
          "use module io.picolabs.wrangler alias wrangler"
        ]
      },
      "channel": {
        "kickoff_events": {
        },
        "start_state": <<>>,
        "listeners": {
          "wrangler:ruleset_added" : { // when the test RID is installed 
             "expressions": [
                ["channel w no params returns an array of channel maps", <<typeof(wrangler:channel()) == "Array">>]
               ,["channel w no params returns an array of channel maps which will have multiple channels", <<wrangler:channel().length() > 1>>]
               ,["channel w first param returns channel w that name if it exists", <<wrangler:channel("admin"){"name"} == "admin">>]
               ,["channel w first param returns null if channel w that name doesnt exist", <<wrangler:channel("doesnt_exist") == null>>]
               ,["channel w second param returns type-keyed map of channels", <<wrangler:channel(null, "pico_id"){meta:picoId}[0]{"pico_id"} == meta:picoId>>]
               ,["channel w second and third param returns all of that type", <<wrangler:channel(null, "type", "secret")[0]{"name"} == "admin">>]
              ]
          }
        },
        "meta": [
          "use module io.picolabs.wrangler alias wrangler"
        ]
      },
      "alwaysEci": {
        "kickoff_events": {
        },
        "start_state": <<>>,
        "listeners": {
          "wrangler:ruleset_added" : { // when the test RID is installed 
             "expressions": [
                ["ECI for admin channel should exist", <<typeof(wrangler:alwaysEci("admin")) == "String">>]
               ,["ECI for nonexistent channel will not exist", <<wrangler:alwaysEci("doesnt_exist") == null>>]
              ]
          }
        },
        "meta": [
          "use module io.picolabs.wrangler alias wrangler"
        ]
      },
      "nameFromEci": {
        "kickoff_events": {
        },
        "start_state": <<>>,
        "listeners": {
          "wrangler:ruleset_added" : { // when the test RID is installed 
             "expressions": [
                ["Name should exist for given ECI", <<typeof(wrangler:nameFromEci(meta:eci)) == "String">>]
               ,["Name for nonexistent ECI will return null", <<wrangler:nameFromEci("doesnt_exist") == null>>]
              ]
          }
        },
        "meta": [
          "use module io.picolabs.wrangler alias wrangler"
        ]
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
    
    
  }
  
  rule on_install {
    select when wrangler ruleset_added where rids >< meta:rid
    always {
      ent:progress_report := tests:getTestsOverview()
    }
  }
  
  rule runWranglerTests {
    select when wrangler run_tests
    always {
      raise tests event "run_tests" attributes {
        "tests": wrangler_tests,
        "ruleset_under_test":"io.picolabs.wrangler"
    };
    ent:progress_report := tests:getTestsOverview();
    ent:full_report := {}
    }
  }
  
  rule receive_progress_update {
    select when tests tests_progress_update
    always {
      ent:progress_report := event:attr("testsOverview")
    }
  }

  rule tests_finished {
    select when tests tests_finished
    always {
      ent:full_report := event:attr("fullReport");
      ent:progress_report := event:attr("testsOverview")
    }
  }
  
}
