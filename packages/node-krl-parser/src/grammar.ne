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

var get = function(o, path, dflt){
  if(!path || !path.length){
    return dflt;
  }
  var cur = o;
  var i;
  for(i = 0; i < path.length; i++){
    if(!cur){
      return dflt;
    }
    if(cur.hasOwnProperty(path[i])){
      cur = cur[path[i]];
    }else{
      return dflt;
    }
  }
  return cur;
};

var reserved_identifiers = {
  "true": true,
  "false": true
};

////////////////////////////////////////////////////////////////////////////////
// ast functions
var noop = function(){};
var noopStr = function(){return ""};
var noopArr = function(){return []};
var idAll = function(d){return flatten(d).join('')};
var idArr = function(d){return [d[0]]};
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

var RulePostlude_by_paths = function(fired_i, notfired_i, always_i){
  return function(data, start){
    return {
      loc: {start: start, end: lastEndLoc(data)},
      type: 'RulePostlude',
      fired: get(data, fired_i, null),
      notfired: get(data, notfired_i, null),
      always: get(data, always_i, null),
    };
  };
};

%}

main -> _ ruleset _ {% getN(1) %}
    | _ statement_list _ {% getN(1) %}

################################################################################
#
# Ruleset
#

ruleset -> "ruleset" __ Identifier _ "{" _
  ("meta" _ ruleset_meta_block _):?
  ("global" _ declaration_block _):?
  (rule _):*
loc_close_curly {%
  function(data, loc){
    return {
      loc: {start: loc, end: last(data)},
      type: 'Ruleset',
      name: data[2],
      meta: data[6] ? data[6][2] : [],
      global: data[7] ? data[7][2] : [],
      rules: data[8].map(function(pair){
        return pair[0];
      })
    };
  }
%}

ruleset_meta_block -> "{" _ "}" {% noopArr %}
    | "{" _ ruleset_meta_prop_list _ "}" {% getN(2) %}

ruleset_meta_prop_list -> ruleset_meta_prop {% idArr %}
    | ruleset_meta_prop_list __ ruleset_meta_prop {% function(d){return d[0].concat([d[2]])} %}

ruleset_meta_prop -> Identifier __ expression {%
  function(data, start){
    return {
      loc: {start: start, end: data[2].loc.end},
      type: 'RulesetMetaProperty',
      key: data[0],
      value: data[2]
    };
  }
%}

################################################################################
#
# Rule
#

rule -> "rule" __ Identifier (__ "is" __ rule_state):? _ "{" _
  ("select" __ "when" __ EventExpression _ (";" _):?):?

  ("pre" _ declaration_block _ ):?

  (RuleActionBlock _):?

  (RulePostlude _):?

loc_close_curly {%
  function(data, loc){
    return {
      loc: {start: loc, end: last(data)},
      type: 'Rule',
      name: data[2],
      rule_state: data[3] ? data[3][3] : "active",
      select_when: data[7] && data[7][4],
      prelude: data[8] ? data[8][2] : [],
      action_block: data[9] && data[9][0],
      postlude: data[10] && data[10][0]
    };
  }
%}

rule_state -> "active" {% id %} | "inactive" {% id %}

################################################################################
#
# EventExpression
#

EventExpression -> event_exp_within {% id %}

event_exp_within -> event_exp_or {% id %}
    | event_exp_within __ "within" __ PositiveInteger __ time_period
      {% complexEventOp("within", 0, 4, 6) %}

event_exp_or -> event_exp_and {% id %}
    | event_exp_or __ "or" __ event_exp_and {% infixEventOp %}

event_exp_and -> event_exp_infix_op {% id %}
    | event_exp_and __ "and" __ event_exp_infix_op {% infixEventOp %}

event_exp_infix_op -> event_exp_fns {% id %}
    | event_exp_infix_op __ "before" __ event_exp_fns {% infixEventOp %}
    | event_exp_infix_op __ "then"   __ event_exp_fns {% infixEventOp %}
    | event_exp_infix_op __ "after"  __ event_exp_fns {% infixEventOp %}

event_exp_fns -> event_exp_base {% id %}
    | event_exp_fns __ "between" _ "(" _ EventExpression _ "," _ EventExpression _ loc_close_paren
      {% complexEventOp("between", 0, 6, 10) %}
    | event_exp_fns __ "not" __ "between" _ "(" _ EventExpression _ "," _ EventExpression _ loc_close_paren
      {% complexEventOp("not between", 0, 8, 12) %}
    | "any" __ PositiveInteger _ "(" _ EventExpression_list _ loc_close_paren
      {% complexEventOp("any", 2, 6) %}
    | "count" __ PositiveInteger _ "(" _ EventExpression _ loc_close_paren
      {% complexEventOp("count", 2, 6) %}
    | "repeat" __ PositiveInteger _ "(" _ EventExpression _ loc_close_paren
      {% complexEventOp("repeat", 2, 6) %}
    | "and" _ "(" _ EventExpression_list _ loc_close_paren
      {% complexEventOp("and", 4) %}
    | "or" _ "(" _ EventExpression_list _ loc_close_paren
      {% complexEventOp("or", 4) %}
    | "before" _ "(" _ EventExpression_list _ loc_close_paren
      {% complexEventOp("before", 4) %}
    | "then" _ "(" _ EventExpression_list _ loc_close_paren
      {% complexEventOp("then", 4) %}
    | "after" _ "(" _ EventExpression_list _ loc_close_paren
      {% complexEventOp("after", 4) %}
    | event_exp_fns __  "max" _ "(" _ function_params _ loc_close_paren
      {% complexEventOp("max", 0, 6) %}
    | event_exp_fns __  "min" _ "(" _ function_params _ loc_close_paren
      {% complexEventOp("min", 0, 6) %}
    | event_exp_fns __  "sum" _ "(" _ function_params _ loc_close_paren
      {% complexEventOp("sum", 0, 6) %}
    | event_exp_fns __  "avg" _ "(" _ function_params _ loc_close_paren
      {% complexEventOp("avg", 0, 6) %}
    | event_exp_fns __  "push" _ "(" _ function_params _ loc_close_paren
      {% complexEventOp("push", 0, 6) %}

event_exp_base -> "(" _ EventExpression _ ")" {% getN(2) %}
  | Identifier __ Identifier
    event_exp_attribute_pairs
    (__ "where" __ expression):?
    (__ "setting" _ "(" _ function_params _ loc_close_paren):? {%
  function(data, start){
    return {
      type: 'EventExpression',
      loc: {start: start, end: lastEndLoc(data)},
      event_domain: data[0],
      event_type: data[2],
      attributes: data[3],
      where: data[4] && data[4][3],
      setting: (data[5] && data[5][5]) || []
    };
  }
%}

event_exp_attribute_pairs -> null {% noopArr %}
    | event_exp_attribute_pair {% idArr %}
    | event_exp_attribute_pairs __ event_exp_attribute_pair {% function(d){return d[0].concat([d[2]])} %}

event_exp_attribute_pair -> Identifier __ RegExp {%
  function(data, start){
    return {
      loc: {start: start, end: data[2].loc.end},
      type: 'AttributeMatch',
      key: data[0],
      value: data[2]
    };
  }
%}

EventExpression_list ->
    null {% noopArr %}
    | EventExpression {% idArr %}
    | EventExpression_list _ "," _ EventExpression {% function(d){return d[0].concat([d[4]])} %}

time_period -> time_period_enum {%
  function(data, start){
    var src = data[0][0];
    return {
      loc: {start: start, end: start + src.length},
      type: 'String',
      value: src
    };
  }
%}

time_period_enum ->
      "years"
    | "months"
    | "weeks"
    | "days"
    | "hours"
    | "minutes"
    | "seconds"
    | "year"
    | "month"
    | "week"
    | "day"
    | "hour"
    | "minute"
    | "second"

################################################################################
#
# RuleActionBlock
#

RuleActionBlock -> ("if" __ expression __ "then" __ (action_block_type __):?):? RuleActions {%
  function(data, start){
    return {
      loc: {start: start, end: lastEndLoc(data)},
      type: 'RuleActionBlock',
      condition: data[0] && data[0][2],
      block_type: get(data, [0, 6, 0], "every"),
      actions: data[1]
    };
  }
%}

action_block_type -> "choose" {% id %}
    | "every" {% id %}

#NOTE - there must be at least one action
RuleActions -> RuleAction {% idArr %}
    | RuleActions __ RuleAction {% function(d){return d[0].concat(d[2])} %}

RuleAction ->
    (Identifier _ "=>" _):?
    Identifier _ "(" _ expression_list _ loc_close_paren
    (_ "with" __ declaration_list):? {%
  function(data, start){
    return {
      loc: {start: start, end: lastEndLoc(data)},
      type: 'RuleAction',
      label: data[0] && data[0][0],
      callee: data[1],
      args: data[5],
      "with": data[8] ? data[8][3] : []
    };
  }
%}

################################################################################
#
# RulePostlude
#

RulePostlude ->
      "always" _ postlude_clause {% RulePostlude_by_paths(null, null, [2, 0]) %}
    | "fired" _ postlude_clause
      (_ "else" _ postlude_clause):?
      (_ "finally" _ postlude_clause):?
      {% RulePostlude_by_paths([2, 0], [3, 3, 0], [4, 3, 0]) %}

postlude_clause -> "{" _ statement_list _ loc_close_curly {%
  function(d){
    //we need to keep the location of the close curly
    return [d[2],d[4]];
  }
%}

################################################################################
#
# Statements
#

statement -> expression {% id %}
    | Declaration {% id %}

Declaration -> left_side_of_declaration _ "=" _ expression {%
  function(data, start){
    return {
      loc: {start: data[0].loc.start, end: data[4].loc.end},
      type: 'Declaration',
      op: data[2],
      left: data[0],
      right: data[4]
    };
  }
%}

statement_list -> null {% noopArr %}
    | statement {% idArr %}
    | statement_list _ ";" _ statement {% function(d){return d[0].concat(d[4])} %}

declaration_block -> "{" _ "}" {% noopArr %}
    | "{" _ declaration_list _ "}" {% getN(2) %}

declaration_list -> Declaration {% idArr %}
    | declaration_list __ Declaration {% function(d){return d[0].concat(d[2])} %}

################################################################################
#
# Expressions
#

expression -> exp_conditional {% id %}

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
    | Map {% id %}
    | RegExp {% id %}
    | DoubleQuote {% id %}
    | Function {% id %}
    | CallExpression {% id %}
    | "(" _ expression _ ")" {% getN(2) %}

expression_list -> null {% noopArr %}
    | expression {% idArr %}
    | expression_list _ "," _ expression {% function(d){return d[0].concat([d[4]])} %}

# Later we may add destructuring
left_side_of_declaration -> Identifier {% id %}

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
    null {% noopArr %}
    | Identifier {% idArr %}
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

Map -> "{" _ map_kv_pairs _ loc_close_curly {%
  function(data, loc){
    return {
      loc: {start: loc, end: last(data)},
      type: 'Map',
      value: data[2]
    };
  }
%}

map_kv_pairs -> null {% noopArr %}
    | map_kv_pair {% idArr %}
    | map_kv_pairs _ "," _ map_kv_pair {% function(d){return d[0].concat(d[4])} %}

map_kv_pair -> String _ ":" _ expression {%
  function(data, start){
    return {
      loc: {start: start, end: data[4].loc.end},
      type: 'MapKeyValuePair',
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

PositiveInteger -> [0-9]:+ {%
  function(data, loc){
    var src = flatten(data).join('');
    return {
      loc: {start: loc, end: loc + src.length},
      type: 'Number',
      value: parseInt(src, 10) || 0// or 0 to avoid NaN
    };
  }
%}

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
    _double_quote_string_node {% idArr %}
    | _double_quote_body _beesting _double_quote_string_node {% function(d){return d[0].concat([d[1], d[2]])} %}

_beesting -> "#{" _ expression _ "}" {% getN(2) %}

_double_quote_string_node -> _double_quote_string {%
  function(data, loc){
    var src = data[0];
    return {
      loc: {start: loc, end: loc + src.length},
      type: 'String',
      value: src.replace(/>\\>/g, '>>')
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
