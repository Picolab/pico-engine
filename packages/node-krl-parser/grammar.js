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
      loc: loc,
      op: op,
      args: undefined,
      expressions: [data[0], data[4]]
    };
  };
};

var grammar = {
    ParserRules: [
    {"name": "main", "symbols": ["_", "ruleset", "_"], "postprocess": getN(1)},
    {"name": "ruleset$string$1", "symbols": [{"literal":"r"}, {"literal":"u"}, {"literal":"l"}, {"literal":"e"}, {"literal":"s"}, {"literal":"e"}, {"literal":"t"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "ruleset$ebnf$1", "symbols": []},
    {"name": "ruleset$ebnf$1$subexpression$1", "symbols": ["rule", "_"]},
    {"name": "ruleset$ebnf$1", "symbols": ["ruleset$ebnf$1$subexpression$1", "ruleset$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "ruleset", "symbols": ["ruleset$string$1", "__", "symbol", "_", {"literal":"{"}, "_", "ruleset$ebnf$1", {"literal":"}"}], "postprocess": 
        function(data, loc){
          return {
            type: 'ruleset',
            loc: loc,
        
            name: data[2].src,
            rules: data[6].map(function(pair){
              return pair[0];
            })
          };
        }
        },
    {"name": "rule$string$1", "symbols": [{"literal":"r"}, {"literal":"u"}, {"literal":"l"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "rule", "symbols": ["rule$string$1", "__", "symbol", "_", {"literal":"{"}, "_", "rule_body", "_", {"literal":"}"}], "postprocess": 
        function(data, loc){
          var ast = {
            type: 'rule',
            loc: loc,
            name: data[2].src
          };
          if(data[6] !== null){
            ast.body = data[6];
          }
          return ast;
        }
        },
    {"name": "rule_body", "symbols": ["_"], "postprocess": id},
    {"name": "rule_body", "symbols": ["select_when"]},
    {"name": "select_when$string$1", "symbols": [{"literal":"s"}, {"literal":"e"}, {"literal":"l"}, {"literal":"e"}, {"literal":"c"}, {"literal":"t"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "select_when$string$2", "symbols": [{"literal":"w"}, {"literal":"h"}, {"literal":"e"}, {"literal":"n"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "select_when", "symbols": ["select_when$string$1", "__", "select_when$string$2", "__", "event_exprs"], "postprocess": 
        function(data, loc){
          return {
            type: 'select_when',
            loc: loc,
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
            loc: loc,
            event_domain: data[0],
            event_type: data[2]
          };
        }
        },
    {"name": "event_domain", "symbols": ["symbol"], "postprocess": id},
    {"name": "event_type", "symbols": ["symbol"], "postprocess": id},
    {"name": "symbol$ebnf$1", "symbols": [/[\w]/]},
    {"name": "symbol$ebnf$1", "symbols": [/[\w]/, "symbol$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "symbol", "symbols": ["symbol$ebnf$1"], "postprocess": 
        function(data, loc){
          return {
            type: 'symbol',
            loc: loc,
            src: data[0].join('')
          };
        }
        },
    {"name": "int$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "int$ebnf$1", "symbols": [/[0-9]/, "int$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "int", "symbols": ["int$ebnf$1"], "postprocess": 
        function(data, loc){
          return {
            type: 'int',
            loc: loc,
            src: data[0].join('')
          };
        }
        },
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": [/[\s]/, "_$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": function(){return null;}},
    {"name": "__$ebnf$1", "symbols": [/[\s]/]},
    {"name": "__$ebnf$1", "symbols": [/[\s]/, "__$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "__", "symbols": ["__$ebnf$1"], "postprocess": function(){return null;}}
]
  , ParserStart: "main"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
