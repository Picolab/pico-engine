module.exports = {
  "rid": "io.picolabs.event-exp",
  "rules": {
    "before": {
      "name": "before",
      "select": {
        "graph": {
          "ee_before": {
            "a": { "expr_0": true },
            "b": { "expr_1": true }
          }
        },
        "eventexprs": {
          "expr_0": function (ctx) {
            return true;
          },
          "expr_1": function (ctx) {
            return true;
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "s0"
            ]],
          "s0": [[
              "expr_1",
              "end"
            ]]
        }
      },
      "action_block": {
        "actions": [{
            "action": function (ctx) {
              return {
                "type": "directive",
                "name": "before",
                "options": {}
              };
            }
          }]
      }
    },
    "after": {
      "name": "after",
      "select": {
        "graph": {
          "ee_after": {
            "a": { "expr_0": true },
            "b": { "expr_1": true }
          }
        },
        "eventexprs": {
          "expr_0": function (ctx) {
            return true;
          },
          "expr_1": function (ctx) {
            return true;
          }
        },
        "state_machine": {
          "start": [[
              "expr_1",
              "s0"
            ]],
          "s0": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "action_block": {
        "actions": [{
            "action": function (ctx) {
              return {
                "type": "directive",
                "name": "after",
                "options": {}
              };
            }
          }]
      }
    },
    "then": {
      "name": "then",
      "select": {
        "graph": {
          "ee_then": {
            "a": { "expr_0": true },
            "b": { "expr_1": true }
          }
        },
        "eventexprs": {
          "expr_0": function (ctx) {
            return true;
          },
          "expr_1": function (ctx) {
            return true;
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "s0"
            ]],
          "s0": [
            [
              "expr_1",
              "end"
            ],
            [
              [
                "not",
                "expr_1"
              ],
              "start"
            ]
          ]
        }
      },
      "action_block": {
        "actions": [{
            "action": function (ctx) {
              return {
                "type": "directive",
                "name": "then",
                "options": {}
              };
            }
          }]
      }
    },
    "and": {
      "name": "and",
      "select": {
        "graph": {
          "ee_and": {
            "a": { "expr_0": true },
            "b": { "expr_1": true }
          }
        },
        "eventexprs": {
          "expr_0": function (ctx) {
            return true;
          },
          "expr_1": function (ctx) {
            return true;
          }
        },
        "state_machine": {
          "start": [
            [
              "expr_0",
              "s0"
            ],
            [
              "expr_1",
              "s1"
            ]
          ],
          "s0": [[
              "expr_1",
              "end"
            ]],
          "s1": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "action_block": {
        "actions": [{
            "action": function (ctx) {
              return {
                "type": "directive",
                "name": "and",
                "options": {}
              };
            }
          }]
      }
    },
    "or": {
      "name": "or",
      "select": {
        "graph": {
          "ee_or": {
            "a": { "expr_0": true },
            "b": { "expr_1": true }
          }
        },
        "eventexprs": {
          "expr_0": function (ctx) {
            return true;
          },
          "expr_1": function (ctx) {
            return true;
          }
        },
        "state_machine": {
          "start": [
            [
              "expr_0",
              "end"
            ],
            [
              "expr_1",
              "end"
            ]
          ]
        }
      },
      "action_block": {
        "actions": [{
            "action": function (ctx) {
              return {
                "type": "directive",
                "name": "or",
                "options": {}
              };
            }
          }]
      }
    },
    "between": {
      "name": "between",
      "select": {
        "graph": {
          "ee_between": {
            "a": { "expr_0": true },
            "b": { "expr_1": true },
            "c": { "expr_2": true }
          }
        },
        "eventexprs": {
          "expr_0": function (ctx) {
            return true;
          },
          "expr_1": function (ctx) {
            return true;
          },
          "expr_2": function (ctx) {
            return true;
          }
        },
        "state_machine": {
          "start": [[
              "expr_1",
              "s0"
            ]],
          "s0": [[
              "expr_0",
              "s1"
            ]],
          "s1": [[
              "expr_2",
              "end"
            ]]
        }
      },
      "action_block": {
        "actions": [{
            "action": function (ctx) {
              return {
                "type": "directive",
                "name": "between",
                "options": {}
              };
            }
          }]
      }
    },
    "not_between": {
      "name": "not_between",
      "select": {
        "graph": {
          "ee_not_between": {
            "a": { "expr_0": true },
            "b": { "expr_1": true },
            "c": { "expr_2": true }
          }
        },
        "eventexprs": {
          "expr_0": function (ctx) {
            return true;
          },
          "expr_1": function (ctx) {
            return true;
          },
          "expr_2": function (ctx) {
            return true;
          }
        },
        "state_machine": {
          "start": [[
              "expr_1",
              "s0"
            ]],
          "s0": [
            [
              "expr_0",
              "start"
            ],
            [
              "expr_2",
              "end"
            ]
          ]
        }
      },
      "action_block": {
        "actions": [{
            "action": function (ctx) {
              return {
                "type": "directive",
                "name": "not between",
                "options": {}
              };
            }
          }]
      }
    },
    "and_or": {
      "name": "and_or",
      "select": {
        "graph": {
          "ee_andor": {
            "a": { "expr_0": true },
            "b": { "expr_1": true },
            "c": { "expr_2": true }
          }
        },
        "eventexprs": {
          "expr_0": function (ctx) {
            return true;
          },
          "expr_1": function (ctx) {
            return true;
          },
          "expr_2": function (ctx) {
            return true;
          }
        },
        "state_machine": {
          "start": [
            [
              "expr_0",
              "s0"
            ],
            [
              "expr_1",
              "s1"
            ],
            [
              "expr_2",
              "end"
            ]
          ],
          "s0": [[
              "expr_1",
              "end"
            ]],
          "s1": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "action_block": {
        "actions": [{
            "action": function (ctx) {
              return {
                "type": "directive",
                "name": "(a and b) or c",
                "options": {}
              };
            }
          }]
      }
    },
    "or_and": {
      "name": "or_and",
      "select": {
        "graph": {
          "ee_orand": {
            "a": { "expr_0": true },
            "b": { "expr_1": true },
            "c": { "expr_2": true }
          }
        },
        "eventexprs": {
          "expr_0": function (ctx) {
            return true;
          },
          "expr_1": function (ctx) {
            return true;
          },
          "expr_2": function (ctx) {
            return true;
          }
        },
        "state_machine": {
          "start": [
            [
              "expr_0",
              "s0"
            ],
            [
              "expr_1",
              "s1"
            ],
            [
              "expr_2",
              "s1"
            ]
          ],
          "s0": [
            [
              "expr_1",
              "end"
            ],
            [
              "expr_2",
              "end"
            ]
          ],
          "s1": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "action_block": {
        "actions": [{
            "action": function (ctx) {
              return {
                "type": "directive",
                "name": "a and (b or c)",
                "options": {}
              };
            }
          }]
      }
    }
  }
};