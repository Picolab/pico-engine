// Generated automatically by nearley
// http://github.com/Hardmath123/nearley
(function () {
function id(x) {return x[0]; }

var echo = function(data, location, reject){
  return {data: data, location: location};
};
var grammar = {
    ParserRules: [
    {"name": "main", "symbols": ["_", "expression", "_"], "postprocess": echo},
    {"name": "expression", "symbols": ["expression", "_", {"literal":"+"}, "_", "int"], "postprocess": echo},
    {"name": "expression", "symbols": ["int"], "postprocess": echo},
    {"name": "int$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "int$ebnf$1", "symbols": [/[0-9]/, "int$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "int", "symbols": ["int$ebnf$1"], "postprocess": echo},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": [/[\s]/, "_$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": function(){return null;}}
]
  , ParserStart: "main"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
