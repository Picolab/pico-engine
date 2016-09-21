@{%

var last = function(arr){
  return arr[arr.length - 1];
};

var values = function(obj){
  var v = [];
  var key;
  for(key in obj){
    if(obj.hasOwnProperty(key)){
      v.push(obj[key]);
    }
  }
  return v;
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
  "function": true,
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
var idEndLoc = function(data, start){return start + flatten(data).join('').length};

var idIndecies = function(){
  var indices = Array.prototype.slice.call(arguments, 0);
  return function(data){
    var r = [];
    var i, j;
    for(i = 0; i < indices.length; i++){
      j = indices[i];
      r.push(j >= 0 ? data[j] : null);
    }
    return r;
  };
};

var concatArr = function(index){
  return function(data){
    return data[0].concat(data[index]);
  };
};

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

var MemberExpression_method = function(method){
  return function(data, start){
    return {
      loc: {start: start, end: lastEndLoc(data)},
      type: 'MemberExpression',
      object: data[0],
      property: data[4],
      method: method
    };
  };
};

var mkKeyword = function(src, start, normalized_value){
  return {
    loc: {start: start, end: start + src.length},
    type: 'Keyword',
    value: normalized_value || src
  };
};

var mkRulesetMetaProperty = function(key, value, start, is_obj_value){
  return {
    loc: {start: start, end: lastEndLoc(is_obj_value ? values(value) : value)},
    type: 'RulesetMetaProperty',
    key: typeof key === 'string' ? mkKeyword(key, start) : key,
    value: value
  };
};

var metaProp = function(fn, is_obj_value){
  return function(data, start){
    return mkRulesetMetaProperty(data[0], fn(data), start, is_obj_value);
  };
};

var metaProp2part = metaProp(function(data){
  return data[2];
});

%}

main -> _ Ruleset _ {% getN(1) %}
    | Statement_list {% id %}

################################################################################
#
# Ruleset
#

Ruleset -> "ruleset" __ RulesetID _ "{" _
  (RulesetMeta _):?
  ("global" _ declaration_block _):?
  (rule _):*
loc_close_curly {%
  function(data, loc){
    return {
      loc: {start: loc, end: last(data)},
      type: 'Ruleset',
      rid: data[2],
      meta: data[6] ? data[6][0] : void 0,
      global: data[7] ? data[7][2] : [],
      rules: data[8].map(function(pair){
        return pair[0];
      })
    };
  }
%}

RulesetID -> [a-zA-Z] [a-zA-Z0-9_.\-]:* {%
  function(data, start){
    var src = flatten(data).join('');
    return {
      loc: {start: start, end: start + src.length},
      type: 'RulesetID',
      value: src
    };
  }
%}

RulesetMeta -> "meta" _ ruleset_meta_block {%
  function(data, start){
    var props = data[2];
    return {
      loc: {start: start, end: lastEndLoc(props)},
      type: "RulesetMeta",
      properties: props
    };
  }
%}

ruleset_meta_block -> "{" _ "}" {% noopArr %}
    | "{" _ ruleset_meta_prop_list _ "}" {% getN(2) %}

ruleset_meta_prop_list -> ruleset_meta_prop {% idArr %}
    | ruleset_meta_prop_list __ ruleset_meta_prop {% concatArr(2) %}

ruleset_meta_prop ->
      "name"        __ String {% metaProp2part %}
    | "description" __ Chevron {% metaProp2part %}
    | "author"      __ String {% metaProp2part %}
    | "logging"     __ OnOrOff {% metaProp2part %}
    | "keys" __ Keyword __ (String | Map)
      {% metaProp(function(data){return [data[2], data[4][0]]}) %}
    | "use" __ "module" __ RulesetID
        (__ "version" __ String):?
        (__ "alias" __ Identifier):?
        (__ "with" __ declaration_list):?
      {% metaProp(function(data){return {
        kind: data[2],
        rid: data[4],
        version: data[5] && data[5][3],
        alias:   data[6] && data[6][3],
        'with':  data[7] && data[7][3]
      }}, true) %}
    | "errors" __ "to" __ RulesetID (__ "version" __ String):?
      {% metaProp(function(data){return {
        rid: data[4],
        version: data[5] && data[5][3]
      }}, true) %}
    | "configure" __ "using" __ declaration_list
      {% metaProp(function(data){return {
        declarations: data[4]
      }}, true) %}
    | PROVIDEs __ Identifier_list
      {% metaProp(function(d){return {
        ids: d[2]
      }}, true) %}
    | PROVIDEs __ ProvidesOperator __ Identifier_list __ "to" __ RulesetID_list
      {% metaProp(function(d){return {
        operator: d[2],
        ids: d[4],
        rulesets: d[8]
      }}, true) %}
    | SHAREs __ Identifier_list
      {% metaProp(function(d){return {
        ids: d[2]
      }}, true) %}

ProvidesOperator -> "keys" {%
  function(data, start){
    var src = flatten(data).join('');
    return mkKeyword(src, start);
  }
%}

Keyword -> [a-zA-Z_$] [a-zA-Z0-9_$]:* {%
  function(data, start){
    var src = flatten(data).join('');
    return mkKeyword(src, start);
  }
%}

PROVIDEs -> ("provides" | "provide") {%
  function(data, start){
    var src = data[0][0];
    return mkKeyword(src, start, "provides");
  }
%}
SHAREs -> ("shares" | "share") {%
  function(data, start){
    var src = data[0][0];
    return mkKeyword(src, start, "shares");
  }
%}

Identifier_list -> Identifier {% idArr %}
    | Identifier_list _ "," _ Identifier {% concatArr(4) %}

RulesetID_list -> RulesetID {% idArr %}
    | RulesetID_list _ "," _ RulesetID {% concatArr(4) %}

OnOrOff -> "on"  {% booleanAST(true ) %}
         | "off" {% booleanAST(false) %}

################################################################################
#
# Rule
#

rule -> "rule" __ Identifier (__ "is" __ rule_state):? _ "{" _
  (RuleSelect _semi):?

  RuleBody

loc_close_curly {%
  function(data, loc){
    return {
      loc: {start: loc, end: last(data)},
      type: 'Rule',
      name: data[2],
      rule_state: data[3] ? data[3][3] : "active",
      select: data[7] && data[7][0],
      prelude: data[8][1] || [],
      action_block: data[8][2],
      postlude: data[8][3]
    };
  }
%}

rule_state -> "active" {% id %} | "inactive" {% id %}

RuleSelect -> "select" __ "when" __ EventExpression {%
  function(data, start){
    var ee =  data[4];
    return {
      loc: {start: start, end: ee.loc.end},
      type: 'RuleSelect',
      kind: 'when',
      event: ee
    };
  }
%}

RuleBody -> null {% idIndecies(-1, -1, -1, -1) %}
    | RulePrelude _
      {% idIndecies(-1, 0, -1, -1) %}
    | RuleActionBlock _
      {% idIndecies(-1, -1, 0, -1) %}
    | RulePrelude _ RuleActionBlock _
      {% idIndecies(-1, 0, 2, -1) %}
    | RulePostlude _
      {% idIndecies(-1, -1, -1, 0) %}
    | RulePrelude _ RulePostlude _
      {% idIndecies(-1, 0, -1, 2) %}
    | RuleActionBlock __ RulePostlude _
      {% idIndecies(-1, -1, 0, 2) %}
    | RulePrelude _ RuleActionBlock __ RulePostlude _
      {% idIndecies(-1, 0, 2, 4) %}

RulePrelude -> "pre" _ declaration_block {% getN(2) %}

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
    | event_exp_fns __  "max" _ "(" function_params loc_close_paren
      {% complexEventOp("max", 0, 5) %}
    | event_exp_fns __  "min" _ "(" function_params loc_close_paren
      {% complexEventOp("min", 0, 5) %}
    | event_exp_fns __  "sum" _ "(" function_params loc_close_paren
      {% complexEventOp("sum", 0, 5) %}
    | event_exp_fns __  "avg" _ "(" function_params loc_close_paren
      {% complexEventOp("avg", 0, 5) %}
    | event_exp_fns __  "push" _ "(" function_params loc_close_paren
      {% complexEventOp("push", 0, 5) %}

event_exp_base -> "(" _ EventExpression _ ")" {% getN(2) %}
  | Identifier __ Identifier
    (__ event_exp_attribute_pairs):?
    (__ "where" __ event_exp_where):?
    (__ "setting" _ "(" function_params loc_close_paren):? {%
  function(data, start){
    return {
      type: 'EventExpression',
      loc: {start: start, end: lastEndLoc(data)},
      event_domain: data[0],
      event_type: data[2],
      attributes: (data[3] && data[3][1]) || [],
      where: data[4] && data[4][3],
      setting: (data[5] && data[5][4]) || []
    };
  }
%}

event_exp_attribute_pairs -> event_exp_attribute_pair {% idArr %}
    | event_exp_attribute_pairs __ event_exp_attribute_pair {% concatArr(2) %}

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

event_exp_where -> Expression {%
  function(data, start, reject){
    return data[0].type === 'RegExp'
      ? reject//it must be an attribute pair, not a where expression
      : data[0];
  }
%}

EventExpression_list -> EventExpression {% idArr %}
    | EventExpression_list _ "," _ EventExpression {% concatArr(4) %}

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

RuleActionBlock -> ("if" __ Expression __ "then" __ (action_block_type __):?):? RuleActions {%
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
    | RuleActions __ RuleAction {% concatArr(2) %}

RuleAction ->
    (Identifier _ "=>" _):?
    Identifier _ "(" Expression_list loc_close_paren
    (_ "with" __ declaration_list):? {%
  function(data, start){
    return {
      loc: {start: start, end: lastEndLoc(data)},
      type: 'RuleAction',
      label: data[0] && data[0][0],
      action: data[1],
      args: data[4],
      "with": data[6] ? data[6][3] : []
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

postlude_clause -> "{" PostludeStatements loc_close_curly {%
  function(d){
    //we need to keep the location of the close curly
    return [d[1],d[2]];
  }
%}

PostludeStatements ->
      _ {% noopArr %}
    | _ PostludeStatements_body _ {% getN(1) %}

PostludeStatements_body ->
      PostludeStatement {% idArr %}
    | PostludeStatements_body _ ";" _ PostludeStatement {% concatArr(4) %}

PostludeStatement ->
      Statement {% id %}
    | PersistentVariableAssignment {% id %}

PersistentVariableAssignment -> DomainIdentifier _ ":=" _ Expression {%
  function(data, start){
    return {
      loc: {start: start, end: data[4].loc.end},
      type: 'PersistentVariableAssignment',
      op: data[2],
      left: data[0],
      right: data[4]
    };
  }
%}

################################################################################
#
# Statements
#

Statement ->
      ExpressionStatement {% id %}
    | Declaration {% id %}

ExpressionStatement -> Expression {%
  function(data){
    return {
      loc: data[0].loc,
      type: 'ExpressionStatement',
      expression: data[0]
    };
  }
%}

Declaration -> left_side_of_declaration _ "=" _ Expression {%
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

# Later we may add destructuring
left_side_of_declaration -> MemberExpression {% id %}

Statement_list -> _ {% noopArr %}
    | _ Statement_list_body _ {% getN(1) %}

Statement_list_body ->
      Statement {% idArr %}
    | Statement_list_body _ ";" _ Statement {% concatArr(4) %}

declaration_block -> "{" _ "}" {% noopArr %}
    | "{" _ declaration_list _ "}" {% getN(2) %}

declaration_list -> Declaration {% idArr %}
    | declaration_list __ Declaration {% concatArr(2) %}

################################################################################
#
# Expressions
#

Expression -> exp_conditional {% id %}

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
    | exp_comp _  "<"    _ exp_sum {% infixOp %}
    | exp_comp _  ">"    _ exp_sum {% infixOp %}
    | exp_comp _  "<="   _ exp_sum {% infixOp %}
    | exp_comp _  ">="   _ exp_sum {% infixOp %}
    | exp_comp _  "=="   _ exp_sum {% infixOp %}
    | exp_comp _  "!="   _ exp_sum {% infixOp %}
    | exp_comp __ "eq"   __ exp_sum {% infixOp %}
    | exp_comp __ "neq"  __ exp_sum {% infixOp %}
    | exp_comp __ "like" __ exp_sum {% infixOp %}
    | exp_comp __ "><"   __ exp_sum {% infixOp %}
    | exp_comp __ "<=>"  __ exp_sum {% infixOp %}
    | exp_comp __ "cmp"  __ exp_sum {% infixOp %}

exp_sum -> exp_product {% id %}
    | exp_sum _ "+" _ exp_product {% infixOp %}
    | exp_sum _ "-" _ exp_product {% infixOp %}

exp_product -> MemberExpression {% id %}
    | exp_product _ "*" _ MemberExpression {% infixOp %}
    | exp_product _ "/" _ MemberExpression {% infixOp %}
    | exp_product _ "%" _ MemberExpression {% infixOp %}

MemberExpression -> PrimaryExpression {% id %}
    | MemberExpression _ "[" _ Expression _ loc_close_square
      {% MemberExpression_method('index') %}
    | MemberExpression _ "{" _ Expression _ loc_close_curly
      {% MemberExpression_method('path') %}
    | MemberExpression _ "." _ Identifier
      {% MemberExpression_method('dot') %}

PrimaryExpression ->
      Identifier {% id %}
    | DomainIdentifier {% id %}
    | Literal {% id %}
    | "(" _ Expression _ ")" {% getN(2) %}
    | Function {% id %}
    | Application {% id %}

Literal ->
      String {% id %}
    | Number {% id %}
    | Boolean {% id %}
    | RegExp {% id %}
    | Chevron {% id %}
    | Array {% id %}
    | Map {% id %}

Expression_list -> _ {% noopArr %}
    | _ Expression_list_body _ {% getN(1) %}

Expression_list_body ->
      Expression {% idArr %}
    | Expression_list_body _ "," _ Expression {% concatArr(4) %}

################################################################################
# Functions

Function -> "function" _ "(" function_params ")" _ "{" Statement_list loc_close_curly {%
  function(data, start){
    return {
      loc: {start: start, end: last(data)},
      type: 'Function',
      params: data[3],
      body: data[7]
    };
  }
%}

function_params -> _ {% noopArr %}
    | _ function_params_body _ {% getN(1) %}

function_params_body ->
      Identifier {% idArr %}
    | function_params_body _ "," _ Identifier {% concatArr(4) %}

Application -> MemberExpression _ "(" Expression_list loc_close_paren {%
  function(data, start){
    return {
      loc: {start: start, end: last(data)},
      type: 'Application',
      callee: data[0],
      args: data[3]
    };
  }
%}

################################################################################
# Literal Datastructures

Array -> "[" Expression_list loc_close_square {%
  function(data, loc){
    return {
      type: 'Array',
      loc: {start: loc, end: last(data)},
      value: data[1]
    };
  }
%}

Map -> "{" Map_body loc_close_curly {%
  function(data, loc){
    return {
      loc: {start: loc, end: last(data)},
      type: 'Map',
      value: data[1]
    };
  }
%}

Map_body -> _ {% noopArr %}
    | _ map_kv_pairs _ {% getN(1) %}

map_kv_pairs -> map_kv_pair {% idArr %}
    | map_kv_pairs _ "," _ map_kv_pair {% concatArr(4) %}

map_kv_pair -> String _ ":" _ Expression {%
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

DomainIdentifier -> Identifier _ ":" _ Identifier {%
  function(data, start, reject){
    var id = data[4];
    return {
      type: 'DomainIdentifier',
      loc: {start: start, end: id.loc.end},
      value: id.value,
      domain: data[0].value
    };
  }
%}

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

Number -> number {%
  function(data, loc){
    var src = flatten(data).join('');
    return {
      loc: {start: loc, end: loc + src.length},
      type: 'Number',
      value: parseFloat(src) || 0// or 0 to avoid NaN
    };
  }
%}

number ->
    float
    | "+" float
    | "-" float

float ->
    int
    | "." int
    | int "." int

int -> [0-9]:+ {% idAll %}

RegExp -> "re#" regexp_pattern "#" regexp_modifiers {%
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

regexp_pattern ->
    null {% noopStr %}
    | regexp_pattern regexp_pattern_char {% function(d){return d[0] + d[1]} %}

regexp_pattern_char ->
  [^\\#] {% id %}
  | "\\" [^] {% function(d){return d[1] === '#' ? '#' : '\\\\'} %}

regexp_modifiers -> regexp_modifiers_chars {%
  function(data, loc){
    var src = flatten(data).join('');
    return [src, loc + src.length];
  }
%}

regexp_modifiers_chars -> null {% noopStr %}
    | "i" | "g" | "ig" | "gi"

Chevron -> "<<" chevron_body loc_close_chevron {%
  function(data, loc){
    return {
      loc: {start: loc - 2, end: last(data)},
      type: 'Chevron',
      value: data[1]
    };
  }
%}

chevron_body ->
    chevron_string_node {% idArr %}
    | chevron_body beesting chevron_string_node {% function(d){return d[0].concat([d[1], d[2]])} %}

beesting -> "#{" _ Expression _ "}" {% getN(2) %}

chevron_string_node -> chevron_string {%
  function(data, loc){
    var src = data[0];
    return {
      loc: {start: loc, end: loc + src.length},
      type: 'String',
      value: src.replace(/>\\>/g, '>>')
    };
  }
%}

chevron_string ->
    null {% noopStr %}
    | chevron_string chevron_char {% function(d){return d[0] + d[1]} %}

chevron_char ->
    [^>#] {% id %}
    | "#" [^{] {% idAll %}
    | ">" [^>] {% idAll %}

String -> "\"" string "\"" {%
  function(data, loc){
    var src = data[1];
    return {
      loc: {start: loc, end: loc + src.length + 2},
      type: 'String',
      value: src
    };
  }
%}

string -> null {% noopStr %}
    | string stringchar {% function(d){return d[0] + d[1]} %}

stringchar ->
      [^\\"] {% id %}
    | "\\" [^] {% function(d){return JSON.parse('"' + d[0] + d[1] + '"')} %}

################################################################################
# Utils

# Chars that return their end location
loc_close_curly -> "}" {% idEndLoc %}
loc_close_square -> "]" {% idEndLoc %}
loc_close_paren -> ")" {% idEndLoc %}
loc_close_chevron -> ">>" {% idEndLoc %}

# Whitespace and Semi-colons
_  -> [\s]:* {% noop %}
__ -> [\s]:+ {% noop %}

##optional space and/or semi-colon
_semi -> [\s;]:* {% noop %}

##required space and/or semi-colon
__semi -> [\s;]:+ {% noop %}
#if you must have semi-colon, use ";" directly
