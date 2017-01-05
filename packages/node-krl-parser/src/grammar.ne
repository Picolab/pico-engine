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
  "not": true,
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
    loc: mkLoc(data),
    type: 'EventOperator',
    op: data[1].src,
    args: [data[0], data[2]]//not all event ops have left/right
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
  return function(data){
    return {
      loc: data[0].loc,
      type: 'Boolean',
      value: value
    };
  };
};

var unaryOp = function(data, start){
  return {
    loc: mkLoc(data),
    type: "UnaryOperator",
    op: data[0].src,
    arg: data[1]
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
  return function(data){
    return {
      loc: mkLoc(data),
      type: 'MemberExpression',
      object: data[0],
      property: data[2],
      method: method
    };
  };
};

var mkRulesetMetaProperty = function(data, value, is_obj_value){
  var key = data[0];
  if(key.type === "SYMBOL"){
    key = {
      loc: key.loc,
      type: 'Keyword',
      value: key.src
    };
  }
  return {
    loc: mkLoc(data),
    type: 'RulesetMetaProperty',
    key: key,
    value: value
  };
};

var metaProp = function(fn, is_obj_value){
  return function(data){
    return mkRulesetMetaProperty(data, fn(data), is_obj_value);
  };
};

var metaProp2part = metaProp(function(data){
  return data[1];
});

var mkLoc = function(d){
  var loc = {};
  var elms = flatten(d);
  var i = 0;
  while(i < elms.length){
    if(elms[i] && elms[i].loc){
      if(!loc.hasOwnProperty("start")){
        loc.start = elms[i].loc.start;
      }
      loc.end = elms[i].loc.end;
    }
    i++;
  }
  return loc;
};

var tok = function(type, value){
  return {test: function(x){
    if(!x || x.type !== type){
      return false;
    }
    if(value){
      return x.src === value;
    }
    return true;
  }};
};

var tok_RAW = tok("RAW");
var tok_STRING = tok("STRING");
var tok_NUMBER = tok("NUMBER");
var tok_SYMBOL = tok("SYMBOL");

var tok_OPEN_PAREN = tok("RAW", "(");
var tok_CLSE_PAREN = tok("RAW", ")");
var tok_OPEN_CURLY = tok("RAW", "{");
var tok_CLSE_CURLY = tok("RAW", "}");
var tok_OPEN_SQARE = tok("RAW", "[");
var tok_CLSE_SQARE = tok("RAW", "]");

var tok_COMMA = tok("RAW", ",");
var tok_DOT = tok("RAW", ".");
var tok_EQ = tok("RAW", "=");
var tok_PLUS = tok("RAW", "+");
var tok_MINUS = tok("RAW", "-");
var tok_FAT_ARROW_RIGHT = tok("RAW", "=>");
var tok_PIPE = tok("RAW", "|");
var tok_SEMI = tok("RAW", ";");


var tok_after = tok("SYMBOL", "after");
var tok_alias = tok("SYMBOL", "alias");
var tok_and = tok("SYMBOL", "and");
var tok_author = tok("SYMBOL", "author");
var tok_before = tok("SYMBOL", "before");
var tok_choose = tok("SYMBOL", "choose");
var tok_configure = tok("SYMBOL", "configure");
var tok_description = tok("SYMBOL", "description");
var tok_errors = tok("SYMBOL", "errors");
var tok_every = tok("SYMBOL", "every");
var tok_false = tok("SYMBOL", "false");
var tok_function = tok("SYMBOL", "function");
var tok_if = tok("SYMBOL", "if");
var tok_keys = tok("SYMBOL", "keys");
var tok_logging = tok("SYMBOL", "logging");
var tok_meta = tok("SYMBOL", "meta");
var tok_module = tok("SYMBOL", "module");
var tok_name = tok("SYMBOL", "name");
var tok_not = tok("SYMBOL", "not");
var tok_or = tok("SYMBOL", "or");
var tok_provide  = tok("SYMBOL", "provide");
var tok_provides = tok("SYMBOL", "provides");
var tok_ruleset = tok("SYMBOL", "ruleset");
var tok_rule = tok("SYMBOL", "rule");
var tok_share  = tok("SYMBOL", "share");
var tok_shares = tok("SYMBOL", "shares");
var tok_select = tok("SYMBOL", "select");
var tok_then = tok("SYMBOL", "then");
var tok_to = tok("SYMBOL", "to");
var tok_true = tok("SYMBOL", "true");
var tok_use = tok("SYMBOL", "use");
var tok_using = tok("SYMBOL", "using");
var tok_version = tok("SYMBOL", "version");
var tok_when = tok("SYMBOL", "when");
var tok_with = tok("SYMBOL", "with");

%}

main -> Ruleset {% id %}
    | Statement_list {% id %}

################################################################################
#
# Ruleset
#

Ruleset -> %tok_ruleset RulesetID %tok_OPEN_CURLY
  (RulesetMeta _):?
  ("global" _ declaration_block _):?
  rule:*
%tok_CLSE_CURLY {%
  function(data, loc){
    return {
      loc: mkLoc(data),
      type: 'Ruleset',
      rid: data[1],
      meta: data[3] ? data[3][0] : void 0,
      global: data[4] ? data[4][2] : [],
      rules: data[5]
    };
  }
%}

RulesetID -> %tok_SYMBOL {%
  function(data, start, reject){
    var d = data[0];
    if(!/^[a-z][a-z0-9_.\-]*/i.test(d.src)){
      return reject;
    }
    return {
      loc: d.loc,
      type: 'RulesetID',
      value: d.src
    };
  }
%}

RulesetMeta -> %tok_meta %tok_OPEN_CURLY ruleset_meta_prop:* %tok_CLSE_CURLY {%
  function(data, start){
    return {
      loc: mkLoc(data),
      type: "RulesetMeta",
      properties: data[2]
    };
  }
%}

ruleset_meta_prop ->
      %tok_name        String {% metaProp2part %}
    | %tok_description Chevron {% metaProp2part %}
    | %tok_author      String {% metaProp2part %}
    | %tok_logging     OnOrOff {% metaProp2part %}
    | %tok_keys Keyword (String | Map)
      {% metaProp(function(data){return [data[1], data[2][0]]}) %}
    | %tok_use %tok_module RulesetID
        (%tok_version String):?
        (%tok_alias Identifier):?
        (%tok_with declaration_list):?
      {% metaProp(function(data){return {
        kind: data[1],
        rid: data[2],
        version: data[3] && data[3][1],
        alias:   data[4] && data[4][1],
        'with':  data[5] && data[5][1]
      }}, true) %}
    | %tok_errors %tok_to RulesetID (%tok_version String):?
      {% metaProp(function(data){return {
        rid: data[2],
        version: data[3] && data[3][1]
      }}, true) %}
    | %tok_configure %tok_using declaration_list
      {% metaProp(function(data){return {
        declarations: data[2]
      }}, true) %}
    | PROVIDEs Identifier_list
      {% metaProp(function(d){return {
        ids: d[1]
      }}, true) %}
    | PROVIDEs ProvidesOperator Identifier_list %tok_to RulesetID_list
      {% metaProp(function(d){return {
        operator: d[1],
        ids: d[2],
        rulesets: d[4]
      }}, true) %}
    | SHAREs Identifier_list
      {% metaProp(function(d){return {
        ids: d[1]
      }}, true) %}

ProvidesOperator -> %tok_keys {%
  function(data, start){
    var d = data[0];
    return {
      loc: d.loc,
      type: 'Keyword',
      value: d.src
    };
  }
%}

Keyword -> %tok_SYMBOL {%
  function(data, start){
    var d = data[0];
    return {
      loc: d.loc,
      type: 'Keyword',
      value: d.src
    };
  }
%}

PROVIDEs -> (%tok_provides | %tok_provide) {%
  function(data, start){
    var d = data[0][0];
    return {
      loc: d.loc,
      type: 'Keyword',
      value: "provides"
    };
  }
%}
SHAREs -> (%tok_shares | %tok_share) {%
  function(data, start){
    var d = data[0][0];
    return {
      loc: d.loc,
      type: 'Keyword',
      value: "shares"
    };
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

rule -> %tok_rule Identifier (__ "is" __ rule_state):? %tok_OPEN_CURLY
  (RuleSelect %tok_SEMI:?):?

  RuleBody

%tok_CLSE_CURLY {%
  function(data, loc){
    return {
      loc: mkLoc(data),
      type: 'Rule',
      name: data[1],
      rule_state: data[2] ? data[2][3] : "active",
      select: data[4] && data[4][0],
      prelude: data[5][1] || [],
      action_block: data[5][2],
      postlude: data[5][3]
    };
  }
%}

rule_state -> "active" {% id %} | "inactive" {% id %}

RuleSelect -> %tok_select %tok_when EventExpression {%
  function(data, start){
    return {
      loc: mkLoc(data),
      type: 'RuleSelect',
      kind: 'when',
      event: data[2]
    };
  }
%}

RuleBody -> null {% idIndecies(-1, -1, -1, -1) %}
    | RulePrelude
      {% idIndecies(-1, 0, -1, -1) %}
    | RuleActionBlock
      {% idIndecies(-1, -1, 0, -1) %}
    | RulePrelude RuleActionBlock
      {% idIndecies(-1, 0, 1, -1) %}
    | RulePostlude
      {% idIndecies(-1, -1, -1, 0) %}
    | RulePrelude RulePostlude
      {% idIndecies(-1, 0, -1, 1) %}
    | RuleActionBlock RulePostlude
      {% idIndecies(-1, -1, 0, 1) %}
    | RulePrelude RuleActionBlock RulePostlude
      {% idIndecies(-1, 0, 1, 2) %}

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
    | event_exp_or %tok_or event_exp_and {% infixEventOp %}

event_exp_and -> event_exp_infix_op {% id %}
    | event_exp_and %tok_and event_exp_infix_op {% infixEventOp %}

event_exp_infix_op -> event_exp_fns {% id %}
    | event_exp_infix_op %tok_before event_exp_fns {% infixEventOp %}
    | event_exp_infix_op %tok_then   event_exp_fns {% infixEventOp %}
    | event_exp_infix_op %tok_after  event_exp_fns {% infixEventOp %}

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

event_exp_base -> %tok_OPEN_PAREN EventExpression %tok_CLSE_PAREN {% getN(1) %}
  | Identifier Identifier
    (__ event_exp_attribute_pairs):?
    (__ "where" __ event_exp_where):?
    (__ "setting" _ "(" function_params loc_close_paren):? {%
  function(data, start){
    return {
      type: 'EventExpression',
      loc: mkLoc(data),
      event_domain: data[0],
      event_type: data[1],
      attributes: (data[2] && data[2][1]) || [],
      where: data[3] && data[3][3],
      setting: (data[4] && data[4][4]) || []
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

RuleActionBlock -> (%tok_if Expression %tok_then action_block_type:?):? RuleAction:+ {%
  function(data){
    return {
      loc: mkLoc(data),
      type: 'RuleActionBlock',
      condition: data[0] && data[0][1],
      block_type: (data[0] && data[0][3] && data[0][3].src) || "every",
      actions: data[1]
    };
  }
%}

action_block_type -> %tok_choose {% id %}
    | %tok_every {% id %}

RuleAction ->
    (Identifier %tok_FAT_ARROW_RIGHT):?
    Identifier_or_DomainIdentifier %tok_OPEN_PAREN Expression_list %tok_CLSE_PAREN
    (%tok_with declaration_list):? {%
  function(data, start){
    return {
      loc: mkLoc(data),
      type: 'RuleAction',
      label: data[0] && data[0][0],
      action: data[1],
      args: data[3],
      "with": data[5] ? data[5][1] : []
    };
  }
%}

Identifier_or_DomainIdentifier ->
      Identifier {% id %}
    | DomainIdentifier {% id %}

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
    | RaiseEventStatement {% id %}

PersistentVariableAssignment -> DomainIdentifier _ ("{" _ Expression _ "}" _):? ":=" _ Expression {%
  function(data, start){
    return {
      loc: {start: start, end: data[5].loc.end},
      type: 'PersistentVariableAssignment',
      op: data[3],
      left: data[0],
      path_expression: data[2] ? data[2][2] : null,
      right: data[5]
    };
  }
%}

RaiseEventStatement -> "raise" __ Identifier __ "event" __ Expression
  (__ "for" __ Expression):?
  (__ RaiseEventAttributes):?
{%
  function(data, start){
    return {
      loc: {start: start, end: lastEndLoc(data)},
      type: 'RaiseEventStatement',
      event_domain: data[2],
      event_type: data[6],
      for_rid: data[7] ? data[7][3] : null,
      attributes: data[8] ? data[8][1] : null,
    };
  }
%}

RaiseEventAttributes -> "with" __ declaration_list
{%
  function(data, start){
    return {
      loc: {start: start, end: lastEndLoc(data)},
      type: "RaiseEventAttributes",
      with: data[2]
    };
  }
%}
    | "attributes" __ Expression
{%
  function(data, start){
    return {
      loc: {start: start, end: lastEndLoc(data)},
      type: "RaiseEventAttributes",
      expression: data[2]
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

Declaration -> left_side_of_declaration %tok_EQ Expression {%
  function(data){
    return {
      loc: mkLoc(data),
      type: 'Declaration',
      op: "=",
      left: data[0],
      right: data[2]
    };
  }
%}

# Later we may add destructuring
left_side_of_declaration -> MemberExpression {% id %}

Statement_list -> Statement_list_body {% id %}

Statement_list_body ->
      Statement {% idArr %}
    | Statement_list_body _ ";" _ Statement {% concatArr(4) %}

declaration_block -> "{" _ "}" {% noopArr %}
    | "{" _ declaration_list _ "}" {% getN(2) %}

declaration_list -> Declaration {% idArr %}
    | declaration_list Declaration {% concatArr(1) %}

################################################################################
#
# Expressions
#

Expression -> exp_conditional {% id %}

exp_conditional -> exp_or {% id %}
    | exp_or %tok_FAT_ARROW_RIGHT exp_or %tok_PIPE exp_conditional {%
  function(data){
    return {
      loc: mkLoc(data),
      type: 'ConditionalExpression',
      test: data[0],
      consequent: data[2],
      alternate: data[4]
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

exp_product -> UnaryOperator {% id %}
    | exp_product _ "*" _ UnaryOperator {% infixOp %}
    | exp_product _ "/" _ UnaryOperator {% infixOp %}
    | exp_product _ "%" _ UnaryOperator {% infixOp %}

UnaryOperator -> MemberExpression {% id %}
    | %tok_PLUS UnaryOperator {% unaryOp %}
    | %tok_MINUS UnaryOperator {% unaryOp %}
    | %tok_not UnaryOperator {% unaryOp %}

MemberExpression -> PrimaryExpression {% id %}
    | MemberExpression %tok_OPEN_SQARE Expression %tok_CLSE_SQARE
      {% MemberExpression_method('index') %}
    | MemberExpression %tok_OPEN_CURLY Expression %tok_CLSE_CURLY
      {% MemberExpression_method('path') %}
    | MemberExpression %tok_DOT Identifier
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

Expression_list -> null {% noopArr %}
    | Expression_list_body {% id %}

Expression_list_body ->
      Expression {% idArr %}
    | Expression_list_body %tok_COMMA Expression {% concatArr(2) %}

################################################################################
# Functions

Function -> %tok_function %tok_OPEN_PAREN function_params %tok_CLSE_PAREN %tok_OPEN_CURLY Statement_list %tok_CLSE_CURLY {%
  function(data){
    return {
      loc: mkLoc(data),
      type: 'Function',
      params: data[2],
      body: data[5]
    };
  }
%}

function_params -> null {% noopArr %}
    | Identifier {% idArr %}
    | function_params %tok_COMMA Identifier {% concatArr(2) %}

Application -> MemberExpression %tok_OPEN_PAREN Expression_list %tok_CLSE_PAREN {%
  function(data, start){
    return {
      loc: mkLoc(data),
      type: 'Application',
      callee: data[0],
      args: data[2]
    };
  }
%}

################################################################################
# Literal Datastructures

Array -> %tok_OPEN_SQARE Expression_list %tok_CLSE_SQARE {%
  function(data){
    return {
      loc: mkLoc(data),
      type: 'Array',
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

Identifier -> %tok_SYMBOL {%
  function(data, loc, reject){
    var d = data[0];
    if(reserved_identifiers.hasOwnProperty(d.src)){
      return reject;
    }
    return {
      type: 'Identifier',
      loc: d.loc,
      value: d.src
    };
  }
%}

Boolean -> %tok_true  {% booleanAST(true ) %}
         | %tok_false {% booleanAST(false) %}

PositiveInteger -> Number {%
  function(data, loc, reject){
    var n = data[0];
    if(n.value >= 0 && (n.value === parseInt(n.value, 10))){
      return n;
    }
    return reject;
  }
%}

Number -> %tok_NUMBER {%
  function(data){
    var d = data[0];
    return {
      loc: d.loc,
      type: 'Number',
      value: parseFloat(d.src) || 0// or 0 to avoid NaN
    };
  }
%}

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

String -> %tok_STRING {%
  function(data, loc){
    var d = data[0];
    return {
      loc: d.loc,
      type: 'String',
      value: JSON.parse(d.src)
    };
  }
%}

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
