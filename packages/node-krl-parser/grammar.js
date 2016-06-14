// Generated automatically by nearley
// http://github.com/Hardmath123/nearley
(function () {
function id(x) {return x[0]; }


var echo = function(data, location, reject){
  return {data: data, location: location};
};

var getN = function(n){
  return function(data){
    return data[n];
  };
};

var infixEventOp = function(op){
  return function(data, loc){
    return {
      type: 'event_op',
      loc: {start: data[0].loc.start, end: data[4].loc.end},
      op: op,
      args: [],
      expressions: [data[0], data[4]]
    };
  };
};

var noop = function(){};

var last = function(arr){
  return arr[arr.length - 1];
};

var grammar = {
    ParserRules: [
    {"name": "main", "symbols": ["_", "ruleset", "_"], "postprocess": getN(1)},
    {"name": "main", "symbols": ["expression"], "postprocess": id},
    {"name": "curly_close_loc", "symbols": [{"literal":"}"}], "postprocess": function(data, loc){return loc + 1;}},
    {"name": "ruleset$string$1", "symbols": [{"literal":"r"}, {"literal":"u"}, {"literal":"l"}, {"literal":"e"}, {"literal":"s"}, {"literal":"e"}, {"literal":"t"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "ruleset$ebnf$1", "symbols": []},
    {"name": "ruleset$ebnf$1$subexpression$1", "symbols": ["rule", "_"]},
    {"name": "ruleset$ebnf$1", "symbols": ["ruleset$ebnf$1$subexpression$1", "ruleset$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "ruleset", "symbols": ["ruleset$string$1", "__", "symbol", "_", {"literal":"{"}, "_", "ruleset$ebnf$1", "curly_close_loc"], "postprocess": 
        function(data, loc){
          return {
            type: 'ruleset',
            loc: {start: loc, end: last(data)},
        
            name: data[2].src,
            rules: data[6].map(function(pair){
              return pair[0];
            })
          };
        }
        },
    {"name": "rule$string$1", "symbols": [{"literal":"r"}, {"literal":"u"}, {"literal":"l"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "rule", "symbols": ["rule$string$1", "__", "symbol", "_", {"literal":"{"}, "_", "rule_body", "_", "curly_close_loc"], "postprocess": 
        function(data, loc){
          var ast = data[6] || {};
          ast.type = 'rule';
          ast.loc = {start: loc, end: last(data)};
          ast.name = data[2].src;
          return ast;
        }
        },
    {"name": "rule_body", "symbols": ["_"], "postprocess": noop},
    {"name": "rule_body", "symbols": ["select_when"], "postprocess": 
        function(data, loc){
          return {
            select: data[0]
          };
        }
        },
    {"name": "rule_body", "symbols": ["select_when", "__", "event_action"], "postprocess": 
        function(data, loc){
          return {
            select: data[0],
            actions: [data[2]]
          };
        }
        },
    {"name": "select_when$string$1", "symbols": [{"literal":"s"}, {"literal":"e"}, {"literal":"l"}, {"literal":"e"}, {"literal":"c"}, {"literal":"t"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "select_when$string$2", "symbols": [{"literal":"w"}, {"literal":"h"}, {"literal":"e"}, {"literal":"n"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "select_when", "symbols": ["select_when$string$1", "__", "select_when$string$2", "__", "event_exprs"], "postprocess": 
        function(data, loc){
          return {
            type: 'select_when',
            loc: {start: loc, end: data[4].loc.end},
            event_expressions: data[4]
          };
        }
        },
    {"name": "event_exprs", "symbols": ["event_expression"], "postprocess": id},
    {"name": "event_exprs", "symbols": [{"literal":"("}, "_", "event_exprs", "_", {"literal":")"}], "postprocess": getN(2)},
    {"name": "event_exprs$string$1", "symbols": [{"literal":"o"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "event_exprs", "symbols": ["event_exprs", "__", "event_exprs$string$1", "__", "event_exprs"], "postprocess": infixEventOp('or')},
    {"name": "event_exprs$string$2", "symbols": [{"literal":"a"}, {"literal":"n"}, {"literal":"d"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "event_exprs", "symbols": ["event_exprs", "__", "event_exprs$string$2", "__", "event_exprs"], "postprocess": infixEventOp('and')},
    {"name": "event_expression", "symbols": ["event_domain", "__", "event_type"], "postprocess": 
        function(data, loc){
          return {
            type: 'event_expression',
            loc: {start: loc, end: data[2].loc.end},
            event_domain: data[0],
            event_type: data[2]
          };
        }
        },
    {"name": "event_domain", "symbols": ["symbol"], "postprocess": id},
    {"name": "event_type", "symbols": ["symbol"], "postprocess": id},
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
    {"name": "function_call_args", "symbols": [{"literal":"("}, "_", "comma_separated_expressions", "_", {"literal":")"}], "postprocess": getN(2)},
    {"name": "comma_separated_expressions", "symbols": ["expression"], "postprocess": function(d){return [d[0]]}},
    {"name": "comma_separated_expressions", "symbols": ["comma_separated_expressions", "_", {"literal":","}, "_", "expression"], "postprocess": function(d){return d[0].concat([d[4]])}},
    {"name": "with_expression$string$1", "symbols": [{"literal":"w"}, {"literal":"i"}, {"literal":"t"}, {"literal":"h"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "with_expression", "symbols": ["with_expression$string$1", "__", "symbol_value_pairs"], "postprocess": 
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
    {"name": "symbol_value_pairs", "symbols": ["symbol_value_pair"], "postprocess": function(d){return [d[0]]}},
    {"name": "symbol_value_pairs$string$1", "symbols": [{"literal":"a"}, {"literal":"n"}, {"literal":"d"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "symbol_value_pairs", "symbols": ["symbol_value_pairs", "__", "symbol_value_pairs$string$1", "__", "symbol_value_pair"], "postprocess": function(d){return d[0].concat([d[4]])}},
    {"name": "symbol_value_pair", "symbols": ["symbol", "_", {"literal":"="}, "_", "expression"], "postprocess": 
        function(data, loc){
          return [data[0], data[4]];
        }
        },
    {"name": "expression", "symbols": ["string"], "postprocess": id},
    {"name": "expression", "symbols": ["number"], "postprocess": id},
    {"name": "symbol$ebnf$1", "symbols": [/[\w]/]},
    {"name": "symbol$ebnf$1", "symbols": [/[\w]/, "symbol$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "symbol", "symbols": ["symbol$ebnf$1"], "postprocess": 
        function(data, loc){
          var src = data[0].join('');
          return {
            type: 'symbol',
            loc: {start: loc, end: loc + src.length},
            src: src
          };
        }
        },
    {"name": "number$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "number$ebnf$1", "symbols": [/[0-9]/, "number$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "number", "symbols": ["number$ebnf$1"], "postprocess": 
        function(data, loc){
          var src = data[0].join('');
          return {
            loc: {start: loc, end: loc + src.length},
            type: 'number',
            value: parseFloat(src) || 0,// or 0 to avoid NaN
            src: src
          };
        }
        },
    {"name": "string", "symbols": [{"literal":"\""}, "_string", {"literal":"\""}], "postprocess": 
        function(data, loc){
          var src = data[1];
          return {
            loc: {start: loc, end: loc + src.length},
            type: 'string',
            value: src
          };
        }
        },
    {"name": "_string", "symbols": [], "postprocess": function(){return ""}},
    {"name": "_string", "symbols": ["_string", "_stringchar"], "postprocess": function(d){return d[0] + d[1]}},
    {"name": "_stringchar", "symbols": [/[^\\"]/], "postprocess": id},
    {"name": "_stringchar", "symbols": [{"literal":"\\"}, /[^]/], "postprocess": function(d){return JSON.parse("\"" + d[0] + d[1] + "\"")}},
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
