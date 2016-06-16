// Generated automatically by nearley
// http://github.com/Hardmath123/nearley
(function () {
function id(x) {return x[0]; }


var last = function(arr){
  return arr[arr.length - 1];
};

var lastEndLoc = function(data){
  var nodes = flatten([data]);
  var i, node;
  for(i = nodes.length - 1; i >= 0; i--){
    node = nodes[i];
    if(node && node.loc){
      return node.loc.end;
    }else if(typeof node === "number"){
      return node;
    }
  }
  return -1;
};

var flatten = function(toFlatten){
  var isArray = Object.prototype.toString.call(toFlatten) === '[object Array]';

  if (isArray && toFlatten.length > 0) {
    var head = toFlatten[0];
    var tail = toFlatten.slice(1);

    return flatten(head).concat(flatten(tail));
  } else {
    return [].concat(toFlatten);
  }
};

var reserved_identifiers = {
  "true": true,
  "false": true
};

////////////////////////////////////////////////////////////////////////////////
// ast functions
var noop = function(){};
var noopStr = function(){return ""};
var idAll = function(d){return flatten(d).join('')};
var idEndLoc = function(data, loc){return loc + flatten(data).join('').length};

var getN = function(n){
  return function(data){
    return data[n];
  };
};

var infixEventOp = function(data, start){
  return {
    loc: {start: start, end: data[4].loc.end},
    type: 'EventOperator',
    op: data[2],
    args: [data[0], data[4]]//not all event ops have left/right
  };
};

var complexEventOp = function(op){
  var arg_indices = Array.prototype.slice.call(arguments, 1);
  return function(data, start){
    return {
      loc: {start: start, end: lastEndLoc(data)},
      type: 'EventOperator',
      op: op,
      args: flatten(arg_indices.map(function(i){
        return data[i];
      }))
    };
  };
};

var booleanAST = function(value){
  return function(data, loc){
    var src = data[0];
    return {
      loc: {start: loc, end: loc + src.length},
      type: 'Boolean',
      value: value
    };
  };
};

var infixOp = function(data, start){
  return {
    loc: {start: start, end: data[4].loc.end},
    type: 'InfixOperator',
    op: data[2],
    left: data[0],
    right: data[4]
  };
};

var grammar = {
    ParserRules: [
    {"name": "main", "symbols": ["_", "statement_list", "_"], "postprocess": getN(1)},
    {"name": "ruleset$string$1", "symbols": [{"literal":"r"}, {"literal":"u"}, {"literal":"l"}, {"literal":"e"}, {"literal":"s"}, {"literal":"e"}, {"literal":"t"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "ruleset$ebnf$1$subexpression$1$string$1", "symbols": [{"literal":"m"}, {"literal":"e"}, {"literal":"t"}, {"literal":"a"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "ruleset$ebnf$1$subexpression$1", "symbols": ["ruleset$ebnf$1$subexpression$1$string$1", "_", {"literal":"{"}, "_", "ruleset_meta_body", "_", {"literal":"}"}, "_"]},
    {"name": "ruleset$ebnf$1", "symbols": ["ruleset$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "ruleset$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "ruleset$ebnf$2", "symbols": []},
    {"name": "ruleset$ebnf$2$subexpression$1", "symbols": ["rule", "_"]},
    {"name": "ruleset$ebnf$2", "symbols": ["ruleset$ebnf$2$subexpression$1", "ruleset$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "ruleset", "symbols": ["ruleset$string$1", "__", "Identifier", "_", {"literal":"{"}, "_", "ruleset$ebnf$1", "ruleset$ebnf$2", "loc_close_curly"], "postprocess": 
        function(data, loc){
          return {
            type: 'Ruleset',
            loc: {start: loc, end: last(data)},
        
            name: data[2],
        
            meta: data[6] ? data[6][4] : [],
        
            rules: data[7].map(function(pair){
              return pair[0];
            })
          };
        }
        },
    {"name": "ruleset_meta_body", "symbols": ["ruleset_meta_prop"]},
    {"name": "ruleset_meta_prop", "symbols": ["Identifier", "__", "expression"], "postprocess": 
        function(data, start){
          return {
            loc: {start: start, end: data[2].loc.end},
            type: 'RulesetMetaProperty',
            key: data[0],
            value: data[2]
          };
        }
        },
    {"name": "rule$string$1", "symbols": [{"literal":"r"}, {"literal":"u"}, {"literal":"l"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "rule$ebnf$1$subexpression$1$string$1", "symbols": [{"literal":"s"}, {"literal":"e"}, {"literal":"l"}, {"literal":"e"}, {"literal":"c"}, {"literal":"t"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "rule$ebnf$1$subexpression$1$string$2", "symbols": [{"literal":"w"}, {"literal":"h"}, {"literal":"e"}, {"literal":"n"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "rule$ebnf$1$subexpression$1", "symbols": ["rule$ebnf$1$subexpression$1$string$1", "__", "rule$ebnf$1$subexpression$1$string$2", "__", "EventExpression", "_"]},
    {"name": "rule$ebnf$1", "symbols": ["rule$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "rule$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "rule$ebnf$2$subexpression$1", "symbols": ["event_action", "_"]},
    {"name": "rule$ebnf$2", "symbols": ["rule$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "rule$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "rule", "symbols": ["rule$string$1", "__", "Identifier", "_", {"literal":"{"}, "_", "rule$ebnf$1", "rule$ebnf$2", "loc_close_curly"], "postprocess": 
        function(data, loc){
          return {
            loc: {start: loc, end: last(data)},
            type: 'Rule',
            name: data[2],
            select_when: data[6] && data[6][4],
            actions: data[7] ? [data[7][0]] : []
          };
        }
        },
    {"name": "EventExpression", "symbols": ["event_exp_within"], "postprocess": id},
    {"name": "event_exp_within", "symbols": ["event_exp_or"], "postprocess": id},
    {"name": "event_exp_within$string$1", "symbols": [{"literal":"w"}, {"literal":"i"}, {"literal":"t"}, {"literal":"h"}, {"literal":"i"}, {"literal":"n"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "event_exp_within", "symbols": ["event_exp_within", "__", "event_exp_within$string$1", "__", "PositiveInteger", "__", "time_period"], "postprocess": complexEventOp("within", 0, 4, 6)},
    {"name": "event_exp_or", "symbols": ["event_exp_and"], "postprocess": id},
    {"name": "event_exp_or$string$1", "symbols": [{"literal":"o"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "event_exp_or", "symbols": ["event_exp_or", "__", "event_exp_or$string$1", "__", "event_exp_and"], "postprocess": infixEventOp},
    {"name": "event_exp_and", "symbols": ["event_exp_infix_op"], "postprocess": id},
    {"name": "event_exp_and$string$1", "symbols": [{"literal":"a"}, {"literal":"n"}, {"literal":"d"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "event_exp_and", "symbols": ["event_exp_and", "__", "event_exp_and$string$1", "__", "event_exp_infix_op"], "postprocess": infixEventOp},
    {"name": "event_exp_infix_op", "symbols": ["event_exp_fns"], "postprocess": id},
    {"name": "event_exp_infix_op$string$1", "symbols": [{"literal":"b"}, {"literal":"e"}, {"literal":"f"}, {"literal":"o"}, {"literal":"r"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "event_exp_infix_op", "symbols": ["event_exp_infix_op", "__", "event_exp_infix_op$string$1", "__", "event_exp_fns"], "postprocess": infixEventOp},
    {"name": "event_exp_infix_op$string$2", "symbols": [{"literal":"t"}, {"literal":"h"}, {"literal":"e"}, {"literal":"n"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "event_exp_infix_op", "symbols": ["event_exp_infix_op", "__", "event_exp_infix_op$string$2", "__", "event_exp_fns"], "postprocess": infixEventOp},
    {"name": "event_exp_infix_op$string$3", "symbols": [{"literal":"a"}, {"literal":"f"}, {"literal":"t"}, {"literal":"e"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "event_exp_infix_op", "symbols": ["event_exp_infix_op", "__", "event_exp_infix_op$string$3", "__", "event_exp_fns"], "postprocess": infixEventOp},
    {"name": "event_exp_fns", "symbols": ["event_exp_base"], "postprocess": id},
    {"name": "event_exp_fns$string$1", "symbols": [{"literal":"b"}, {"literal":"e"}, {"literal":"t"}, {"literal":"w"}, {"literal":"e"}, {"literal":"e"}, {"literal":"n"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "event_exp_fns", "symbols": ["event_exp_fns", "__", "event_exp_fns$string$1", "_", {"literal":"("}, "_", "EventExpression", "_", {"literal":","}, "_", "EventExpression", "_", "loc_close_paren"], "postprocess": complexEventOp("between", 0, 6, 10)},
    {"name": "event_exp_fns$string$2", "symbols": [{"literal":"n"}, {"literal":"o"}, {"literal":"t"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "event_exp_fns$string$3", "symbols": [{"literal":"b"}, {"literal":"e"}, {"literal":"t"}, {"literal":"w"}, {"literal":"e"}, {"literal":"e"}, {"literal":"n"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "event_exp_fns", "symbols": ["event_exp_fns", "__", "event_exp_fns$string$2", "__", "event_exp_fns$string$3", "_", {"literal":"("}, "_", "EventExpression", "_", {"literal":","}, "_", "EventExpression", "_", "loc_close_paren"], "postprocess": complexEventOp("not between", 0, 8, 12)},
    {"name": "event_exp_fns$string$4", "symbols": [{"literal":"a"}, {"literal":"n"}, {"literal":"y"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "event_exp_fns", "symbols": ["event_exp_fns$string$4", "__", "PositiveInteger", "_", {"literal":"("}, "_", "EventExpression_list", "_", "loc_close_paren"], "postprocess": complexEventOp("any", 2, 6)},
    {"name": "event_exp_fns$string$5", "symbols": [{"literal":"c"}, {"literal":"o"}, {"literal":"u"}, {"literal":"n"}, {"literal":"t"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "event_exp_fns", "symbols": ["event_exp_fns$string$5", "__", "PositiveInteger", "_", {"literal":"("}, "_", "EventExpression", "_", "loc_close_paren"], "postprocess": complexEventOp("count", 2, 6)},
    {"name": "event_exp_fns$string$6", "symbols": [{"literal":"r"}, {"literal":"e"}, {"literal":"p"}, {"literal":"e"}, {"literal":"a"}, {"literal":"t"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "event_exp_fns", "symbols": ["event_exp_fns$string$6", "__", "PositiveInteger", "_", {"literal":"("}, "_", "EventExpression", "_", "loc_close_paren"], "postprocess": complexEventOp("repeat", 2, 6)},
    {"name": "event_exp_fns$string$7", "symbols": [{"literal":"a"}, {"literal":"n"}, {"literal":"d"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "event_exp_fns", "symbols": ["event_exp_fns$string$7", "_", {"literal":"("}, "_", "EventExpression_list", "_", "loc_close_paren"], "postprocess": complexEventOp("and", 4)},
    {"name": "event_exp_fns$string$8", "symbols": [{"literal":"o"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "event_exp_fns", "symbols": ["event_exp_fns$string$8", "_", {"literal":"("}, "_", "EventExpression_list", "_", "loc_close_paren"], "postprocess": complexEventOp("or", 4)},
    {"name": "event_exp_fns$string$9", "symbols": [{"literal":"b"}, {"literal":"e"}, {"literal":"f"}, {"literal":"o"}, {"literal":"r"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "event_exp_fns", "symbols": ["event_exp_fns$string$9", "_", {"literal":"("}, "_", "EventExpression_list", "_", "loc_close_paren"], "postprocess": complexEventOp("before", 4)},
    {"name": "event_exp_fns$string$10", "symbols": [{"literal":"t"}, {"literal":"h"}, {"literal":"e"}, {"literal":"n"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "event_exp_fns", "symbols": ["event_exp_fns$string$10", "_", {"literal":"("}, "_", "EventExpression_list", "_", "loc_close_paren"], "postprocess": complexEventOp("then", 4)},
    {"name": "event_exp_fns$string$11", "symbols": [{"literal":"a"}, {"literal":"f"}, {"literal":"t"}, {"literal":"e"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "event_exp_fns", "symbols": ["event_exp_fns$string$11", "_", {"literal":"("}, "_", "EventExpression_list", "_", "loc_close_paren"], "postprocess": complexEventOp("after", 4)},
    {"name": "event_exp_fns$string$12", "symbols": [{"literal":"m"}, {"literal":"a"}, {"literal":"x"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "event_exp_fns", "symbols": ["event_exp_fns", "__", "event_exp_fns$string$12", "_", {"literal":"("}, "_", "function_params", "_", "loc_close_paren"], "postprocess": complexEventOp("max", 0, 6)},
    {"name": "event_exp_fns$string$13", "symbols": [{"literal":"m"}, {"literal":"i"}, {"literal":"n"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "event_exp_fns", "symbols": ["event_exp_fns", "__", "event_exp_fns$string$13", "_", {"literal":"("}, "_", "function_params", "_", "loc_close_paren"], "postprocess": complexEventOp("min", 0, 6)},
    {"name": "event_exp_fns$string$14", "symbols": [{"literal":"s"}, {"literal":"u"}, {"literal":"m"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "event_exp_fns", "symbols": ["event_exp_fns", "__", "event_exp_fns$string$14", "_", {"literal":"("}, "_", "function_params", "_", "loc_close_paren"], "postprocess": complexEventOp("sum", 0, 6)},
    {"name": "event_exp_fns$string$15", "symbols": [{"literal":"a"}, {"literal":"v"}, {"literal":"g"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "event_exp_fns", "symbols": ["event_exp_fns", "__", "event_exp_fns$string$15", "_", {"literal":"("}, "_", "function_params", "_", "loc_close_paren"], "postprocess": complexEventOp("avg", 0, 6)},
    {"name": "event_exp_fns$string$16", "symbols": [{"literal":"p"}, {"literal":"u"}, {"literal":"s"}, {"literal":"h"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "event_exp_fns", "symbols": ["event_exp_fns", "__", "event_exp_fns$string$16", "_", {"literal":"("}, "_", "function_params", "_", "loc_close_paren"], "postprocess": complexEventOp("push", 0, 6)},
    {"name": "event_exp_base", "symbols": [{"literal":"("}, "_", "EventExpression", "_", {"literal":")"}], "postprocess": getN(2)},
    {"name": "event_exp_base$ebnf$1", "symbols": []},
    {"name": "event_exp_base$ebnf$1$subexpression$1", "symbols": ["__", "event_exp_attrs"]},
    {"name": "event_exp_base$ebnf$1", "symbols": ["event_exp_base$ebnf$1$subexpression$1", "event_exp_base$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "event_exp_base$ebnf$2$subexpression$1$string$1", "symbols": [{"literal":"w"}, {"literal":"h"}, {"literal":"e"}, {"literal":"r"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "event_exp_base$ebnf$2$subexpression$1", "symbols": ["__", "event_exp_base$ebnf$2$subexpression$1$string$1", "__", "expression"]},
    {"name": "event_exp_base$ebnf$2", "symbols": ["event_exp_base$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "event_exp_base$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "event_exp_base$ebnf$3$subexpression$1$string$1", "symbols": [{"literal":"s"}, {"literal":"e"}, {"literal":"t"}, {"literal":"t"}, {"literal":"i"}, {"literal":"n"}, {"literal":"g"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "event_exp_base$ebnf$3$subexpression$1", "symbols": ["__", "event_exp_base$ebnf$3$subexpression$1$string$1", "_", {"literal":"("}, "_", "function_params", "_", "loc_close_paren"]},
    {"name": "event_exp_base$ebnf$3", "symbols": ["event_exp_base$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "event_exp_base$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "event_exp_base", "symbols": ["Identifier", "__", "Identifier", "event_exp_base$ebnf$1", "event_exp_base$ebnf$2", "event_exp_base$ebnf$3"], "postprocess": 
        function(data, start){
          return {
            type: 'EventExpression',
            loc: {start: start, end: lastEndLoc(data)},
            event_domain: data[0],
            event_type: data[2],
            attributes: data[3].map(function(p){
              return p[1];
            }),
            where: data[4] && data[4][3],
            setting: (data[5] && data[5][5]) || []
          };
        }
        },
    {"name": "event_exp_attrs", "symbols": ["Identifier"], "postprocess": 
        function(data,loc,reject){
          if(data[0].value === 'where'){
            return reject;
          }
          if(data[0].value === 'setting'){
            return reject;
          }
          return data[0];
        }
        },
    {"name": "event_exp_attrs", "symbols": ["RegExp"], "postprocess": id},
    {"name": "event_exp_attrs", "symbols": ["String"], "postprocess": id},
    {"name": "EventExpression_list", "symbols": [], "postprocess": function(d){return []}},
    {"name": "EventExpression_list", "symbols": ["EventExpression"], "postprocess": function(d){return [d[0]]}},
    {"name": "EventExpression_list", "symbols": ["EventExpression_list", "_", {"literal":","}, "_", "EventExpression"], "postprocess": function(d){return d[0].concat([d[4]])}},
    {"name": "time_period", "symbols": ["time_period_enum"], "postprocess": 
        function(data, start){
          var src = data[0][0];
          return {
            loc: {start: start, end: start + src.length},
            type: 'String',
            value: src
          };
        }
        },
    {"name": "time_period_enum$string$1", "symbols": [{"literal":"y"}, {"literal":"e"}, {"literal":"a"}, {"literal":"r"}, {"literal":"s"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "time_period_enum", "symbols": ["time_period_enum$string$1"]},
    {"name": "time_period_enum$string$2", "symbols": [{"literal":"m"}, {"literal":"o"}, {"literal":"n"}, {"literal":"t"}, {"literal":"h"}, {"literal":"s"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "time_period_enum", "symbols": ["time_period_enum$string$2"]},
    {"name": "time_period_enum$string$3", "symbols": [{"literal":"w"}, {"literal":"e"}, {"literal":"e"}, {"literal":"k"}, {"literal":"s"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "time_period_enum", "symbols": ["time_period_enum$string$3"]},
    {"name": "time_period_enum$string$4", "symbols": [{"literal":"d"}, {"literal":"a"}, {"literal":"y"}, {"literal":"s"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "time_period_enum", "symbols": ["time_period_enum$string$4"]},
    {"name": "time_period_enum$string$5", "symbols": [{"literal":"h"}, {"literal":"o"}, {"literal":"u"}, {"literal":"r"}, {"literal":"s"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "time_period_enum", "symbols": ["time_period_enum$string$5"]},
    {"name": "time_period_enum$string$6", "symbols": [{"literal":"m"}, {"literal":"i"}, {"literal":"n"}, {"literal":"u"}, {"literal":"t"}, {"literal":"e"}, {"literal":"s"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "time_period_enum", "symbols": ["time_period_enum$string$6"]},
    {"name": "time_period_enum$string$7", "symbols": [{"literal":"s"}, {"literal":"e"}, {"literal":"c"}, {"literal":"o"}, {"literal":"n"}, {"literal":"d"}, {"literal":"s"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "time_period_enum", "symbols": ["time_period_enum$string$7"]},
    {"name": "time_period_enum$string$8", "symbols": [{"literal":"y"}, {"literal":"e"}, {"literal":"a"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "time_period_enum", "symbols": ["time_period_enum$string$8"]},
    {"name": "time_period_enum$string$9", "symbols": [{"literal":"m"}, {"literal":"o"}, {"literal":"n"}, {"literal":"t"}, {"literal":"h"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "time_period_enum", "symbols": ["time_period_enum$string$9"]},
    {"name": "time_period_enum$string$10", "symbols": [{"literal":"w"}, {"literal":"e"}, {"literal":"e"}, {"literal":"k"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "time_period_enum", "symbols": ["time_period_enum$string$10"]},
    {"name": "time_period_enum$string$11", "symbols": [{"literal":"d"}, {"literal":"a"}, {"literal":"y"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "time_period_enum", "symbols": ["time_period_enum$string$11"]},
    {"name": "time_period_enum$string$12", "symbols": [{"literal":"h"}, {"literal":"o"}, {"literal":"u"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "time_period_enum", "symbols": ["time_period_enum$string$12"]},
    {"name": "time_period_enum$string$13", "symbols": [{"literal":"m"}, {"literal":"i"}, {"literal":"n"}, {"literal":"u"}, {"literal":"t"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "time_period_enum", "symbols": ["time_period_enum$string$13"]},
    {"name": "time_period_enum$string$14", "symbols": [{"literal":"s"}, {"literal":"e"}, {"literal":"c"}, {"literal":"o"}, {"literal":"n"}, {"literal":"d"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "time_period_enum", "symbols": ["time_period_enum$string$14"]},
    {"name": "event_action$string$1", "symbols": [{"literal":"s"}, {"literal":"e"}, {"literal":"n"}, {"literal":"d"}, {"literal":"_"}, {"literal":"d"}, {"literal":"i"}, {"literal":"r"}, {"literal":"e"}, {"literal":"c"}, {"literal":"t"}, {"literal":"i"}, {"literal":"v"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "event_action$ebnf$1", "symbols": ["with_expression"], "postprocess": id},
    {"name": "event_action$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "event_action", "symbols": ["event_action$string$1", "_", "function_call_args", "_", "event_action$ebnf$1"], "postprocess": 
        function(data, loc){
          var ast = {
            type: 'send_directive',
            loc: {
              start: loc,
              end: data[4]
                ? data[4].loc.end
                : (last(data[2]) ? last(data[2]).loc.end : 0)
            },
            args: data[2]
          };
          if(data[4]){
            ast.with = data[4];
          }
          return ast;
        }
        },
    {"name": "function_call_args", "symbols": [{"literal":"("}, "_", "expression_list", "_", {"literal":")"}], "postprocess": getN(2)},
    {"name": "with_expression$string$1", "symbols": [{"literal":"w"}, {"literal":"i"}, {"literal":"t"}, {"literal":"h"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "with_expression", "symbols": ["with_expression$string$1", "__", "identifier_value_pairs"], "postprocess": 
        function(data, loc){
          var pairs = data[2];
          var last_pair = last(pairs);
          return {
            loc: {start: loc, end: (last_pair ? last_pair[1].loc.end : 0)},
            type: 'with_expression',
            pairs: pairs
          };
        }
        },
    {"name": "identifier_value_pairs", "symbols": ["identifier_value_pair"], "postprocess": function(d){return [d[0]]}},
    {"name": "identifier_value_pairs$string$1", "symbols": [{"literal":"a"}, {"literal":"n"}, {"literal":"d"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "identifier_value_pairs", "symbols": ["identifier_value_pairs", "__", "identifier_value_pairs$string$1", "__", "identifier_value_pair"], "postprocess": function(d){return d[0].concat([d[4]])}},
    {"name": "identifier_value_pair", "symbols": ["Identifier", "_", {"literal":"="}, "_", "expression"], "postprocess": 
        function(data, loc){
          return [data[0], data[4]];
        }
        },
    {"name": "statement", "symbols": ["expression"], "postprocess": id},
    {"name": "statement", "symbols": ["ruleset"], "postprocess": id},
    {"name": "statement_list", "symbols": [], "postprocess": function(){return [];}},
    {"name": "statement_list", "symbols": ["statement"], "postprocess": function(d){return [d[0]];}},
    {"name": "statement_list", "symbols": ["statement_list", "_", {"literal":";"}, "_", "statement"], "postprocess": function(d){return d[0].concat(d[4])}},
    {"name": "expression", "symbols": ["exp_assignment"], "postprocess": id},
    {"name": "exp_assignment", "symbols": ["exp_conditional"], "postprocess": id},
    {"name": "exp_assignment", "symbols": ["Identifier", "_", {"literal":"="}, "_", "exp_conditional"], "postprocess": 
        function(data, start){
          return {
            loc: {start: data[0].loc.start, end: data[4].loc.end},
            type: 'AssignmentExpression',
            op: data[2],
            left: data[0],
            right: data[4]
          };
        }
        },
    {"name": "exp_conditional", "symbols": ["exp_or"], "postprocess": id},
    {"name": "exp_conditional$string$1", "symbols": [{"literal":"="}, {"literal":">"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "exp_conditional", "symbols": ["exp_or", "_", "exp_conditional$string$1", "_", "exp_or", "_", {"literal":"|"}, "_", "exp_conditional"], "postprocess": 
        function(data, start){
          return {
            loc: {start: data[0].loc.start, end: data[8].loc.end},
            type: 'ConditionalExpression',
            test: data[0],
            consequent: data[4],
            alternate: data[8]
          };
        }
        },
    {"name": "exp_or", "symbols": ["exp_and"], "postprocess": id},
    {"name": "exp_or$string$1", "symbols": [{"literal":"|"}, {"literal":"|"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "exp_or", "symbols": ["exp_or", "_", "exp_or$string$1", "_", "exp_and"], "postprocess": infixOp},
    {"name": "exp_and", "symbols": ["exp_comp"], "postprocess": id},
    {"name": "exp_and$string$1", "symbols": [{"literal":"&"}, {"literal":"&"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "exp_and", "symbols": ["exp_and", "_", "exp_and$string$1", "_", "exp_comp"], "postprocess": infixOp},
    {"name": "exp_comp", "symbols": ["exp_sum"], "postprocess": id},
    {"name": "exp_comp", "symbols": ["exp_comp", "_", {"literal":"<"}, "_", "exp_sum"], "postprocess": infixOp},
    {"name": "exp_comp", "symbols": ["exp_comp", "_", {"literal":">"}, "_", "exp_sum"], "postprocess": infixOp},
    {"name": "exp_comp$string$1", "symbols": [{"literal":"<"}, {"literal":"="}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "exp_comp", "symbols": ["exp_comp", "_", "exp_comp$string$1", "_", "exp_sum"], "postprocess": infixOp},
    {"name": "exp_comp$string$2", "symbols": [{"literal":">"}, {"literal":"="}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "exp_comp", "symbols": ["exp_comp", "_", "exp_comp$string$2", "_", "exp_sum"], "postprocess": infixOp},
    {"name": "exp_comp$string$3", "symbols": [{"literal":"="}, {"literal":"="}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "exp_comp", "symbols": ["exp_comp", "_", "exp_comp$string$3", "_", "exp_sum"], "postprocess": infixOp},
    {"name": "exp_comp$string$4", "symbols": [{"literal":"!"}, {"literal":"="}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "exp_comp", "symbols": ["exp_comp", "_", "exp_comp$string$4", "_", "exp_sum"], "postprocess": infixOp},
    {"name": "exp_comp$string$5", "symbols": [{"literal":"e"}, {"literal":"q"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "exp_comp", "symbols": ["exp_comp", "_", "exp_comp$string$5", "_", "exp_sum"], "postprocess": infixOp},
    {"name": "exp_comp$string$6", "symbols": [{"literal":"n"}, {"literal":"e"}, {"literal":"q"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "exp_comp", "symbols": ["exp_comp", "_", "exp_comp$string$6", "_", "exp_sum"], "postprocess": infixOp},
    {"name": "exp_comp$string$7", "symbols": [{"literal":"l"}, {"literal":"i"}, {"literal":"k"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "exp_comp", "symbols": ["exp_comp", "_", "exp_comp$string$7", "_", "exp_sum"], "postprocess": infixOp},
    {"name": "exp_comp$string$8", "symbols": [{"literal":">"}, {"literal":"<"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "exp_comp", "symbols": ["exp_comp", "_", "exp_comp$string$8", "_", "exp_sum"], "postprocess": infixOp},
    {"name": "exp_comp$string$9", "symbols": [{"literal":"<"}, {"literal":"="}, {"literal":">"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "exp_comp", "symbols": ["exp_comp", "_", "exp_comp$string$9", "_", "exp_sum"], "postprocess": infixOp},
    {"name": "exp_comp$string$10", "symbols": [{"literal":"c"}, {"literal":"m"}, {"literal":"p"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "exp_comp", "symbols": ["exp_comp", "_", "exp_comp$string$10", "_", "exp_sum"], "postprocess": infixOp},
    {"name": "exp_sum", "symbols": ["exp_product"], "postprocess": id},
    {"name": "exp_sum", "symbols": ["exp_sum", "_", {"literal":"+"}, "_", "exp_product"], "postprocess": infixOp},
    {"name": "exp_sum", "symbols": ["exp_sum", "_", {"literal":"-"}, "_", "exp_product"], "postprocess": infixOp},
    {"name": "exp_product", "symbols": ["expression_atom"], "postprocess": id},
    {"name": "exp_product", "symbols": ["exp_product", "_", {"literal":"*"}, "_", "expression_atom"], "postprocess": infixOp},
    {"name": "exp_product", "symbols": ["exp_product", "_", {"literal":"/"}, "_", "expression_atom"], "postprocess": infixOp},
    {"name": "exp_product", "symbols": ["exp_product", "_", {"literal":"%"}, "_", "expression_atom"], "postprocess": infixOp},
    {"name": "expression_atom", "symbols": ["String"], "postprocess": id},
    {"name": "expression_atom", "symbols": ["Number"], "postprocess": id},
    {"name": "expression_atom", "symbols": ["Boolean"], "postprocess": id},
    {"name": "expression_atom", "symbols": ["Identifier"], "postprocess": id},
    {"name": "expression_atom", "symbols": ["Array"], "postprocess": id},
    {"name": "expression_atom", "symbols": ["Object"], "postprocess": id},
    {"name": "expression_atom", "symbols": ["RegExp"], "postprocess": id},
    {"name": "expression_atom", "symbols": ["DoubleQuote"], "postprocess": id},
    {"name": "expression_atom", "symbols": ["Function"], "postprocess": id},
    {"name": "expression_atom", "symbols": ["CallExpression"], "postprocess": id},
    {"name": "expression_atom", "symbols": [{"literal":"("}, "_", "expression", "_", {"literal":")"}], "postprocess": getN(2)},
    {"name": "expression_list", "symbols": ["_"], "postprocess": function(d){return []}},
    {"name": "expression_list", "symbols": ["expression"], "postprocess": function(d){return [d[0]]}},
    {"name": "expression_list", "symbols": ["expression_list", "_", {"literal":","}, "_", "expression"], "postprocess": function(d){return d[0].concat([d[4]])}},
    {"name": "Function$string$1", "symbols": [{"literal":"f"}, {"literal":"u"}, {"literal":"n"}, {"literal":"c"}, {"literal":"t"}, {"literal":"i"}, {"literal":"o"}, {"literal":"n"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "Function", "symbols": ["Function$string$1", "_", {"literal":"("}, "_", "function_params", "_", {"literal":")"}, "_", {"literal":"{"}, "_", "statement_list", "_", "loc_close_curly"], "postprocess": 
        function(data, start){
          return {
            loc: {start: start, end: last(data)},
            type: 'Function',
            params: data[4],
            body: data[10]
          };
        }
        },
    {"name": "function_params", "symbols": [], "postprocess": function(d){return []}},
    {"name": "function_params", "symbols": ["Identifier"], "postprocess": function(d){return [d[0]]}},
    {"name": "function_params", "symbols": ["function_params", "_", {"literal":","}, "_", "Identifier"], "postprocess": function(d){return d[0].concat([d[4]])}},
    {"name": "CallExpression", "symbols": ["Identifier", "_", {"literal":"("}, "_", "expression_list", "_", "loc_close_paren"], "postprocess": 
        function(data, start){
          return {
            loc: {start: start, end: last(data)},
            type: 'CallExpression',
            callee: data[0],
            args: data[4]
          };
        }
        },
    {"name": "Array", "symbols": [{"literal":"["}, "_", "expression_list", "_", "loc_close_square"], "postprocess": 
        function(data, loc){
          return {
            type: 'Array',
            loc: {start: loc, end: last(data)},
            value: data[2]
          };
        }
        },
    {"name": "Object", "symbols": [{"literal":"{"}, "_", "_object_kv_pairs", "_", "loc_close_curly"], "postprocess": 
        function(data, loc){
          return {
            loc: {start: loc, end: last(data)},
            type: 'Object',
            value: data[2]
          };
        }
        },
    {"name": "_object_kv_pairs", "symbols": ["_"], "postprocess": function(d){return []}},
    {"name": "_object_kv_pairs", "symbols": ["_object_kv_pair"], "postprocess": function(d){return [d[0]]}},
    {"name": "_object_kv_pairs", "symbols": ["_object_kv_pairs", "_", {"literal":","}, "_", "_object_kv_pair"], "postprocess": function(d){return d[0].concat(d[4])}},
    {"name": "_object_kv_pair", "symbols": ["String", "_", {"literal":":"}, "_", "expression"], "postprocess": 
        function(data, start){
          return {
            loc: {start: start, end: data[4].loc.end},
            type: 'ObjectProperty',
            key: data[0],
            value: data[4]
          };
        }
        },
    {"name": "Identifier$ebnf$1", "symbols": []},
    {"name": "Identifier$ebnf$1", "symbols": [/[a-zA-Z0-9_$]/, "Identifier$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "Identifier", "symbols": [/[a-zA-Z_$]/, "Identifier$ebnf$1"], "postprocess": 
        function(data, loc, reject){
          var src = flatten(data).join('');
          if(reserved_identifiers.hasOwnProperty(src)){
            return reject;
          }
          return {
            type: 'Identifier',
            loc: {start: loc, end: loc + src.length},
            value: src
          };
        }
        },
    {"name": "Boolean$string$1", "symbols": [{"literal":"t"}, {"literal":"r"}, {"literal":"u"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "Boolean", "symbols": ["Boolean$string$1"], "postprocess": booleanAST(true )},
    {"name": "Boolean$string$2", "symbols": [{"literal":"f"}, {"literal":"a"}, {"literal":"l"}, {"literal":"s"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "Boolean", "symbols": ["Boolean$string$2"], "postprocess": booleanAST(false)},
    {"name": "PositiveInteger$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "PositiveInteger$ebnf$1", "symbols": [/[0-9]/, "PositiveInteger$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "PositiveInteger", "symbols": ["PositiveInteger$ebnf$1"], "postprocess": 
        function(data, loc){
          var src = flatten(data).join('');
          return {
            loc: {start: loc, end: loc + src.length},
            type: 'Number',
            value: parseInt(src, 10) || 0// or 0 to avoid NaN
          };
        }
        },
    {"name": "Number", "symbols": ["_number"], "postprocess": 
        function(data, loc){
          var src = flatten(data).join('');
          return {
            loc: {start: loc, end: loc + src.length},
            type: 'Number',
            value: parseFloat(src) || 0// or 0 to avoid NaN
          };
        }
        },
    {"name": "_number", "symbols": ["_float"]},
    {"name": "_number", "symbols": [{"literal":"+"}, "_float"]},
    {"name": "_number", "symbols": [{"literal":"-"}, "_float"]},
    {"name": "_float", "symbols": ["_int"]},
    {"name": "_float", "symbols": [{"literal":"."}, "_int"]},
    {"name": "_float", "symbols": ["_int", {"literal":"."}, "_int"]},
    {"name": "_int$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "_int$ebnf$1", "symbols": [/[0-9]/, "_int$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "_int", "symbols": ["_int$ebnf$1"], "postprocess": idAll},
    {"name": "RegExp$string$1", "symbols": [{"literal":"r"}, {"literal":"e"}, {"literal":"#"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "RegExp", "symbols": ["RegExp$string$1", "_regexp_pattern", {"literal":"#"}, "_regexp_modifiers"], "postprocess": 
        function(data, loc){
          var pattern = data[1];
          var modifiers = data[3][0];
          return {
            loc: {start: loc, end: data[3][1]},
            type: 'RegExp',
            value: new RegExp(pattern, modifiers)
          };
        }
        },
    {"name": "_regexp_pattern", "symbols": [], "postprocess": noopStr},
    {"name": "_regexp_pattern", "symbols": ["_regexp_pattern", "_regexp_pattern_char"], "postprocess": function(d){return d[0] + d[1]}},
    {"name": "_regexp_pattern_char", "symbols": [/[^\\#]/], "postprocess": id},
    {"name": "_regexp_pattern_char", "symbols": [{"literal":"\\"}, /[^]/], "postprocess": function(d){return d[1] === '#' ? '#' : '\\\\'}},
    {"name": "_regexp_modifiers", "symbols": ["_regexp_modifiers_chars"], "postprocess": 
        function(data, loc){
          var src = flatten(data).join('');
          return [src, loc + src.length];
        }
        },
    {"name": "_regexp_modifiers_chars", "symbols": [], "postprocess": noopStr},
    {"name": "_regexp_modifiers_chars", "symbols": [{"literal":"i"}]},
    {"name": "_regexp_modifiers_chars", "symbols": [{"literal":"g"}]},
    {"name": "_regexp_modifiers_chars$string$1", "symbols": [{"literal":"i"}, {"literal":"g"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "_regexp_modifiers_chars", "symbols": ["_regexp_modifiers_chars$string$1"]},
    {"name": "_regexp_modifiers_chars$string$2", "symbols": [{"literal":"g"}, {"literal":"i"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "_regexp_modifiers_chars", "symbols": ["_regexp_modifiers_chars$string$2"]},
    {"name": "DoubleQuote$string$1", "symbols": [{"literal":"<"}, {"literal":"<"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "DoubleQuote", "symbols": ["DoubleQuote$string$1", "_double_quote_body", "loc_close_double_quote"], "postprocess": 
        function(data, loc){
          return {
            loc: {start: loc - 2, end: last(data)},
            type: 'DoubleQuote',
            value: data[1]
          };
        }
        },
    {"name": "_double_quote_body", "symbols": ["_double_quote_string_node"], "postprocess": function(d){return [d[0]]}},
    {"name": "_double_quote_body", "symbols": ["_double_quote_body", "_beesting", "_double_quote_string_node"], "postprocess": function(d){return d[0].concat([d[1], d[2]])}},
    {"name": "_beesting$string$1", "symbols": [{"literal":"#"}, {"literal":"{"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "_beesting", "symbols": ["_beesting$string$1", "_", "expression", "_", {"literal":"}"}], "postprocess": getN(2)},
    {"name": "_double_quote_string_node", "symbols": ["_double_quote_string"], "postprocess": 
        function(data, loc){
          var src = data[0];
          return {
            loc: {start: loc, end: loc + src.length},
            type: 'String',
            value: src
          };
        }
        },
    {"name": "_double_quote_string", "symbols": [], "postprocess": noopStr},
    {"name": "_double_quote_string", "symbols": ["_double_quote_string", "_double_quote_char"], "postprocess": function(d){return d[0] + d[1]}},
    {"name": "_double_quote_char", "symbols": [/[^>#]/], "postprocess": id},
    {"name": "_double_quote_char", "symbols": [{"literal":"#"}, /[^{]/], "postprocess": idAll},
    {"name": "_double_quote_char", "symbols": [{"literal":">"}, /[^>]/], "postprocess": idAll},
    {"name": "String", "symbols": [{"literal":"\""}, "_string", {"literal":"\""}], "postprocess": 
        function(data, loc){
          var src = data[1];
          return {
            loc: {start: loc - 1, end: loc + src.length + 1},
            type: 'String',
            value: src
          };
        }
        },
    {"name": "_string", "symbols": [], "postprocess": noopStr},
    {"name": "_string", "symbols": ["_string", "_stringchar"], "postprocess": function(d){return d[0] + d[1]}},
    {"name": "_stringchar", "symbols": [/[^\\"]/], "postprocess": id},
    {"name": "_stringchar", "symbols": [{"literal":"\\"}, /[^]/], "postprocess": function(d){return JSON.parse('"' + d[0] + d[1] + '"')}},
    {"name": "loc_close_curly", "symbols": [{"literal":"}"}], "postprocess": idEndLoc},
    {"name": "loc_close_square", "symbols": [{"literal":"]"}], "postprocess": idEndLoc},
    {"name": "loc_close_paren", "symbols": [{"literal":")"}], "postprocess": idEndLoc},
    {"name": "loc_close_double_quote$string$1", "symbols": [{"literal":">"}, {"literal":">"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "loc_close_double_quote", "symbols": ["loc_close_double_quote$string$1"], "postprocess": idEndLoc},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": [/[\s]/, "_$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": noop},
    {"name": "__$ebnf$1", "symbols": [/[\s]/]},
    {"name": "__$ebnf$1", "symbols": [/[\s]/, "__$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "__", "symbols": ["__$ebnf$1"], "postprocess": noop}
]
  , ParserStart: "main"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
