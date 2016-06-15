@{%

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

%}

main -> _ statement_list _ {% getN(1) %}

ruleset -> "ruleset" __ Identifier _ "{" _ (rule _):* loc_close_curly {%
  function(data, loc){
    return {
      type: 'Ruleset',
      loc: {start: loc, end: last(data)},

      name: data[2],
      rules: data[6].map(function(pair){
        return pair[0];
      })
    };
  }
%}

rule -> "rule" __ Identifier _ "{" _
  ("select" __ "when" __ event_exprs _):?
  (event_action _):?
loc_close_curly {%
  function(data, loc){
    return {
      loc: {start: loc, end: last(data)},
      type: 'Rule',
      name: data[2],
      select_when: data[6] && data[6][4],
      actions: data[7] ? [data[7][0]] : []
    };
  }
%}

event_exprs ->
    EventExpression {% id %}
    | "(" _ event_exprs _ ")" {% getN(2) %}
    | event_exprs __ "or" __ event_exprs {% infixEventOp %}
    | event_exprs __ "and" __ event_exprs {% infixEventOp %}

EventExpression ->
  Identifier __ Identifier
  (__ _event_exp_attrs):*
  (__ "where" __ expression):?
  (__ "setting" _ "(" _ function_params _ loc_close_paren):? {%
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
%}

_event_exp_attrs ->
      Identifier {%
  function(data,loc,reject){
    if(data[0].value === 'where'){
      return reject;
    }
    if(data[0].value === 'setting'){
      return reject;
    }
    return data[0];
  }
%}
    | RegExp {% id %}
    | String {% id %}

event_action ->
    "send_directive" _ function_call_args _ with_expression:? {%
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
%}

function_call_args ->
    "(" _ expression_list _ ")" {% getN(2) %}

with_expression ->
    "with" __ identifier_value_pairs {%
  function(data, loc){
    var pairs = data[2];
    var last_pair = last(pairs);
    return {
      loc: {start: loc, end: (last_pair ? last_pair[1].loc.end : 0)},
      type: 'with_expression',
      pairs: pairs
    };
  }
%}

identifier_value_pairs ->
    identifier_value_pair {% function(d){return [d[0]]} %}
    | identifier_value_pairs __ "and" __ identifier_value_pair {% function(d){return d[0].concat([d[4]])} %}

identifier_value_pair ->
    Identifier _ "=" _ expression {%
  function(data, loc){
    return [data[0], data[4]];
  }
%}

################################################################################
# Statements

statement ->
      expression {% id %}
    | ruleset {% id %}

statement_list -> null {% function(){return [];} %}
    | statement {% function(d){return [d[0]];} %}
    | statement_list _ ";" _ statement {% function(d){return d[0].concat(d[4])} %}

################################################################################
# Expressions

expression -> exp_assignment {% id %}

exp_assignment -> exp_conditional {% id %}
    | Identifier _ "=" _ exp_conditional {%
  function(data, start){
    return {
      loc: {start: data[0].loc.start, end: data[4].loc.end},
      type: 'AssignmentExpression',
      op: data[2],
      left: data[0],
      right: data[4]
    };
  }
%}

exp_conditional -> exp_or {% id %}
    | exp_or _ "=>" _ exp_or _ "|" _ exp_conditional {%
  function(data, start){
    return {
      loc: {start: data[0].loc.start, end: data[8].loc.end},
      type: 'ConditionalExpression',
      test: data[0],
      consequent: data[4],
      alternate: data[8]
    };
  }
%}
 
exp_or -> exp_and {% id %}
    | exp_or _ "||" _ exp_and {% infixOp %}
 
exp_and -> exp_comp {% id %}
    | exp_and _ "&&" _ exp_comp {% infixOp %}

exp_comp -> exp_sum {% id %}
    | exp_comp _ "<"    _ exp_sum {% infixOp %}
    | exp_comp _ ">"    _ exp_sum {% infixOp %}
    | exp_comp _ "<="   _ exp_sum {% infixOp %}
    | exp_comp _ ">="   _ exp_sum {% infixOp %}
    | exp_comp _ "=="   _ exp_sum {% infixOp %}
    | exp_comp _ "!="   _ exp_sum {% infixOp %}
    | exp_comp _ "eq"   _ exp_sum {% infixOp %}
    | exp_comp _ "neq"  _ exp_sum {% infixOp %}
    | exp_comp _ "like" _ exp_sum {% infixOp %}
    | exp_comp _ "><"   _ exp_sum {% infixOp %}
    | exp_comp _ "<=>"  _ exp_sum {% infixOp %}
    | exp_comp _ "cmp"  _ exp_sum {% infixOp %}

exp_sum -> exp_product {% id %}
    | exp_sum _ "+" _ exp_product {% infixOp %}
    | exp_sum _ "-" _ exp_product {% infixOp %}

exp_product -> expression_atom {% id %}
    | exp_product _ "*" _ expression_atom {% infixOp %}
    | exp_product _ "/" _ expression_atom {% infixOp %}
    | exp_product _ "%" _ expression_atom {% infixOp %}

expression_atom ->
      String {% id %}
    | Number {% id %}
    | Boolean {% id %}
    | Identifier {% id %}
    | Array {% id %}
    | Object {% id %}
    | RegExp {% id %}
    | DoubleQuote {% id %}
    | Function {% id %}
    | CallExpression {% id %}
    | "(" _ expression _ ")" {% getN(2) %}

expression_list ->
    _ {% function(d){return []} %}
    | expression {% function(d){return [d[0]]} %}
    | expression_list _ "," _ expression {% function(d){return d[0].concat([d[4]])} %}

################################################################################
# Functions

Function -> "function" _ "(" _ function_params _ ")" _ "{" _ statement_list _ loc_close_curly {%
  function(data, start){
    return {
      loc: {start: start, end: last(data)},
      type: 'Function',
      params: data[4],
      body: data[10]
    };
  }
%}

function_params ->
    null {% function(d){return []} %}
    | Identifier {% function(d){return [d[0]]} %}
    | function_params _ "," _ Identifier {% function(d){return d[0].concat([d[4]])} %}

CallExpression -> Identifier _ "(" _ expression_list _ loc_close_paren {%
  function(data, start){
    return {
      loc: {start: start, end: last(data)},
      type: 'CallExpression',
      callee: data[0],
      args: data[4]
    };
  }
%}

################################################################################
# Literal Datastructures

Array -> "[" _ expression_list _ loc_close_square {%
  function(data, loc){
    return {
      type: 'Array',
      loc: {start: loc, end: last(data)},
      value: data[2]
    };
  }
%}

Object -> "{" _ _object_kv_pairs _ loc_close_curly {%
  function(data, loc){
    return {
      loc: {start: loc, end: last(data)},
      type: 'Object',
      value: data[2]
    };
  }
%}

_object_kv_pairs ->
    _ {% function(d){return []} %}
    | _object_kv_pair {% function(d){return [d[0]]} %}
    | _object_kv_pairs _ "," _ _object_kv_pair {% function(d){return d[0].concat(d[4])} %}

_object_kv_pair -> String _ ":" _ expression {%
  function(data, start){
    return {
      loc: {start: start, end: data[4].loc.end},
      type: 'ObjectProperty',
      key: data[0],
      value: data[4]
    };
  }
%}

################################################################################
# Literals

Identifier -> [a-zA-Z_$] [a-zA-Z0-9_$]:* {%
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
%}

Boolean -> "true"  {% booleanAST(true ) %}
         | "false" {% booleanAST(false) %}

Number -> _number {%
  function(data, loc){
    var src = flatten(data).join('');
    return {
      loc: {start: loc, end: loc + src.length},
      type: 'Number',
      value: parseFloat(src) || 0// or 0 to avoid NaN
    };
  }
%}

_number ->
    _float
    | "+" _float
    | "-" _float

_float ->
    _int
    | "." _int
    | _int "." _int

_int -> [0-9]:+ {% idAll %}

RegExp -> "re#" _regexp_pattern "#" _regexp_modifiers {%
  function(data, loc){
    var pattern = data[1];
    var modifiers = data[3][0];
    return {
      loc: {start: loc, end: data[3][1]},
      type: 'RegExp',
      value: new RegExp(pattern, modifiers)
    };
  }
%}

_regexp_pattern ->
    null {% noopStr %}
    | _regexp_pattern _regexp_pattern_char {% function(d){return d[0] + d[1]} %}

_regexp_pattern_char ->
  [^\\#] {% id %}
  | "\\" [^] {% function(d){return d[1] === '#' ? '#' : '\\\\'} %}

_regexp_modifiers -> _regexp_modifiers_chars {%
  function(data, loc){
    var src = flatten(data).join('');
    return [src, loc + src.length];
  }
%}

_regexp_modifiers_chars -> null {% noopStr %}
    | "i" | "g" | "ig" | "gi"

DoubleQuote -> "<<" _double_quote_body loc_close_double_quote {%
  function(data, loc){
    return {
      loc: {start: loc - 2, end: last(data)},
      type: 'DoubleQuote',
      value: data[1]
    };
  }
%}

_double_quote_body ->
    _double_quote_string_node {% function(d){return [d[0]]} %}
    | _double_quote_body _beesting _double_quote_string_node {% function(d){return d[0].concat([d[1], d[2]])} %}

_beesting -> "#{" _ expression _ "}" {% getN(2) %}

_double_quote_string_node -> _double_quote_string {%
  function(data, loc){
    var src = data[0];
    return {
      loc: {start: loc, end: loc + src.length},
      type: 'String',
      value: src
    };
  }
%}

_double_quote_string ->
    null {% noopStr %}
    | _double_quote_string _double_quote_char {% function(d){return d[0] + d[1]} %}

_double_quote_char ->
    [^>#] {% id %}
    | "#" [^{] {% idAll %}
    | ">" [^>] {% idAll %}

String -> "\"" _string "\"" {%
  function(data, loc){
    var src = data[1];
    return {
      loc: {start: loc - 1, end: loc + src.length + 1},
      type: 'String',
      value: src
    };
  }
%}

_string ->
    null {% noopStr %}
    | _string _stringchar {% function(d){return d[0] + d[1]} %}

_stringchar ->
    [^\\"] {% id %}
    | "\\" [^] {% function(d){return JSON.parse('"' + d[0] + d[1] + '"')} %}

################################################################################
# Utils

# Chars that return their end location
loc_close_curly -> "}" {% idEndLoc %}
loc_close_square -> "]" {% idEndLoc %}
loc_close_paren -> ")" {% idEndLoc %}
loc_close_double_quote -> ">>" {% idEndLoc %}

# Whitespace
_  -> [\s]:* {% noop %}
__ -> [\s]:+ {% noop %}
