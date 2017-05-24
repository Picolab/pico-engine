@{%

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
  "defaction": true,
  "function": true,
  "not": true,
  "setting": true,
  "true": true,
  "false": true
};

////////////////////////////////////////////////////////////////////////////////
// ast functions
var noop = function(){};
var noopArr = function(){return []};
var idArr = function(d){return [d[0]]};

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

var infixEventOp = function(data){
  return {
    loc: mkLoc(data),
    type: 'EventOperator',
    op: data[1].src,
    args: [data[0], data[2]]//not all event ops have left/right
  };
};

var complexEventOp = function(op){
  var arg_indices = Array.prototype.slice.call(arguments, 1);
  return function(data){
    return {
      loc: mkLoc(data),
      type: 'EventOperator',
      op: op,
      args: flatten(arg_indices.map(function(i){
        return data[i];
      }))
    };
  };
};

var eventGroupOp = function(op, i_n, i_ee, i_ag){
  return function(data){
    var event = data[i_ee];
    event.aggregator = data[i_ag];
    return {
      loc: mkLoc(data),
      type: 'EventGroupOperator',
      op: op,
      n: data[i_n],
      event: event
    };
  };
};

var actionBlock = function(condition_path, type_path, actions_path){
  return function(data){
    return {
      loc: mkLoc(data),
      type: "ActionBlock",
      condition: get(data, condition_path, null),
      block_type: get(data, type_path, "every"),
      actions: flatten([get(data, actions_path, null)]),
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

var unaryOp = function(data){
  return {
    loc: mkLoc(data),
    type: "UnaryOperator",
    op: data[0].src,
    arg: data[1]
  };
};

var infixOp = function(data){
  return {
    loc: mkLoc(data),
    type: 'InfixOperator',
    op: data[1].src,
    left: data[0],
    right: data[2]
  };
};

var RulePostlude_by_paths = function(fired_i, notfired_i, always_i){
  return function(data){
    return {
      loc: mkLoc(data),
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

var defEnum = function(vals){
  return {
    unparse_hint_enum: vals,//hint for "unparsing"
    test: function(x){
      if(!x || x.type !== "SYMBOL"){
        return false;
      }
      return vals.indexOf(x.src) >= 0;
    }
  };
};


var tok_TIME_PERIOD_ENUM = defEnum([
  "years",
  "months",
  "weeks",
  "days",
  "hours",
  "minutes",
  "seconds",
  "year",
  "month",
  "week",
  "day",
  "hour",
  "minute",
  "second",
]);

var tok_LOG_or_ERROR_LEVEL_ENUM = defEnum([
  "error",
  "warn",
  "info",
  "debug",
]);

var tok = function(type, value){
  return {
    unparse_hint_type: type,//hint for "unparsing"
    unparse_hint_value: value,//hint for "unparsing"
    test: function(x){
      if(!x || x.type !== type){
        return false;
      }
      if(value){
        return x.src === value;
      }
      return true;
    }
  };
};

var tok_RAW = tok("RAW");
var tok_STRING = tok("STRING");
var tok_NUMBER = tok("NUMBER");
var tok_REGEXP = tok("REGEXP");
var tok_SYMBOL = tok("SYMBOL");

var tok_CHEVRON_OPEN = tok("CHEVRON-OPEN");
var tok_CHEVRON_STRING = tok("CHEVRON-STRING");
var tok_BEESTING_OPEN = tok("CHEVRON-BEESTING-OPEN");
var tok_BEESTING_CLOSE = tok("CHEVRON-BEESTING-CLOSE");
var tok_CHEVRON_CLOSE = tok("CHEVRON-CLOSE");

var tok_OPEN_PAREN = tok("RAW", "(");
var tok_CLSE_PAREN = tok("RAW", ")");
var tok_OPEN_CURLY = tok("RAW", "{");
var tok_CLSE_CURLY = tok("RAW", "}");
var tok_OPEN_SQARE = tok("RAW", "[");
var tok_CLSE_SQARE = tok("RAW", "]");

var tok_AND = tok("RAW", "&&");
var tok_COMMA = tok("RAW", ",");
var tok_COLON = tok("RAW", ":");
var tok_COLON_EQ = tok("RAW", ":=");
var tok_DIVIDE = tok("RAW", "/");
var tok_DOT = tok("RAW", ".");
var tok_EQ = tok("RAW", "=");
var tok_EQEQ = tok("RAW", "==");
var tok_FAT_ARROW_DOUBLE = tok("RAW", "<=>");
var tok_FAT_ARROW_RIGHT = tok("RAW", "=>");
var tok_GT = tok("RAW", ">");
var tok_GTEQ = tok("RAW", ">=");
var tok_GTLT = tok("RAW", "><");
var tok_LT = tok("RAW", "<");
var tok_LTEQ = tok("RAW", "<=");
var tok_MINUS = tok("RAW", "-");
var tok_MODULO = tok("RAW", "%");
var tok_NOTEQ = tok("RAW", "!=");
var tok_OR = tok("RAW", "||");
var tok_PLUS = tok("RAW", "+");
var tok_PIPE = tok("RAW", "|");
var tok_SEMI = tok("RAW", ";");
var tok_STAR = tok("RAW", "*");

var tok_active = tok("SYMBOL", "active");
var tok_after = tok("SYMBOL", "after");
var tok_alias = tok("SYMBOL", "alias");
var tok_always = tok("SYMBOL", "always");
var tok_and = tok("SYMBOL", "and");
var tok_any = tok("SYMBOL", "any");
var tok_at = tok("SYMBOL", "at");
var tok_attributes = tok("SYMBOL", "attributes");
var tok_author = tok("SYMBOL", "author");
var tok_avg = tok("SYMBOL", "avg");
var tok_before = tok("SYMBOL", "before");
var tok_between = tok("SYMBOL", "between");
var tok_choose = tok("SYMBOL", "choose");
var tok_clear = tok("SYMBOL", "clear");
var tok_configure = tok("SYMBOL", "configure");
var tok_count = tok("SYMBOL", "count");
var tok_cmp = tok("SYMBOL", "cmp");
var tok_defaction = tok("SYMBOL", "defaction");
var tok_description = tok("SYMBOL", "description");
var tok_error = tok("SYMBOL", "error");
var tok_errors = tok("SYMBOL", "errors");
var tok_event = tok("SYMBOL", "event");
var tok_every = tok("SYMBOL", "every");
var tok_eq = tok("SYMBOL", "eq");
var tok_else = tok("SYMBOL", "else");
var tok_false = tok("SYMBOL", "false");
var tok_fired = tok("SYMBOL", "fired");
var tok_final = tok("SYMBOL", "final");
var tok_finally = tok("SYMBOL", "finally");
var tok_for = tok("SYMBOL", "for");
var tok_foreach = tok("SYMBOL", "foreach");
var tok_function = tok("SYMBOL", "function");
var tok_global = tok("SYMBOL", "global");
var tok_if = tok("SYMBOL", "if");
var tok_inactive = tok("SYMBOL", "inactive");
var tok_is = tok("SYMBOL", "is");
var tok_key = tok("SYMBOL", "key");
var tok_keys = tok("SYMBOL", "keys");
var tok_like = tok("SYMBOL", "like");
var tok_last = tok("SYMBOL", "last");
var tok_log = tok("SYMBOL", "log");
var tok_logging = tok("SYMBOL", "logging");
var tok_max = tok("SYMBOL", "max");
var tok_min = tok("SYMBOL", "min");
var tok_meta = tok("SYMBOL", "meta");
var tok_module = tok("SYMBOL", "module");
var tok_name = tok("SYMBOL", "name");
var tok_neq = tok("SYMBOL", "neq");
var tok_not = tok("SYMBOL", "not");
var tok_notfired = tok("SYMBOL", "notfired");
var tok_or = tok("SYMBOL", "or");
var tok_off = tok("SYMBOL", "off");
var tok_on = tok("SYMBOL", "on");
var tok_pre = tok("SYMBOL", "pre");
var tok_provide  = tok("SYMBOL", "provide");
var tok_provides = tok("SYMBOL", "provides");
var tok_push = tok("SYMBOL", "push");
var tok_raise = tok("SYMBOL", "raise");
var tok_repeat = tok("SYMBOL", "repeat");
var tok_ruleset = tok("SYMBOL", "ruleset");
var tok_rule = tok("SYMBOL", "rule");
var tok_sample = tok("SYMBOL", "sample");
var tok_schedule = tok("SYMBOL", "schedule");
var tok_share  = tok("SYMBOL", "share");
var tok_shares = tok("SYMBOL", "shares");
var tok_select = tok("SYMBOL", "select");
var tok_setting = tok("SYMBOL", "setting");
var tok_sum = tok("SYMBOL", "sum");
var tok_then = tok("SYMBOL", "then");
var tok_to = tok("SYMBOL", "to");
var tok_true = tok("SYMBOL", "true");
var tok_use = tok("SYMBOL", "use");
var tok_using = tok("SYMBOL", "using");
var tok_version = tok("SYMBOL", "version");
var tok_when = tok("SYMBOL", "when");
var tok_where = tok("SYMBOL", "where");
var tok_with = tok("SYMBOL", "with");
var tok_within = tok("SYMBOL", "within");

%}

main -> Ruleset {% id %}
    | Statement_list {% id %}

################################################################################
#
# Ruleset
#

Ruleset -> %tok_ruleset RulesetID %tok_OPEN_CURLY
  RulesetMeta:?
  RulesetGlobal:?
  rule:*
%tok_CLSE_CURLY {%
  function(data){
    return {
      loc: mkLoc(data),
      type: 'Ruleset',
      rid: data[1],
      meta: data[3] || void 0,
      global: data[4] || [],
      rules: data[5]
    };
  }
%}

RulesetID -> RulesetID_parts {%
  function(data, start, reject){
    var parts = flatten(data);
    var last_end = false;
    var i;
    var src = "";
    for(i=0; i < parts.length; i++){
      src += parts[i].src;
      if(last_end !== false && last_end !== parts[i].loc.start){
        return reject;
      }
      last_end = parts[i].loc.end;
    }
    if(!/^[a-z][a-z0-9_.\-]*/i.test(src)){
      return reject;
    }
    return {
      loc: mkLoc(data),
      type: 'RulesetID',
      value: src
    };
  }
%}

RulesetID_parts -> %tok_SYMBOL
    | RulesetID_parts %tok_DOT (%tok_SYMBOL | %tok_NUMBER)
    | RulesetID_parts %tok_MINUS (%tok_SYMBOL | %tok_NUMBER)

RulesetMeta -> %tok_meta %tok_OPEN_CURLY ruleset_meta_prop:* %tok_CLSE_CURLY {%
  function(data){
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
    | KEYs Keyword (String | Map)
      {% metaProp(function(data){return [data[1], data[2][0]]}) %}
    | %tok_use %tok_module RulesetID
        (%tok_version String):?
        (%tok_alias Identifier):?
        WithArguments:?
      {% metaProp(function(data){return {
        kind: data[1].src,
        rid: data[2],
        version: data[3] && data[3][1],
        alias:   data[4] && data[4][1],
        'with':  data[5]
      }}, true) %}
    | %tok_errors %tok_to RulesetID (%tok_version String):?
      {% metaProp(function(data){return {
        rid: data[2],
        version: data[3] && data[3][1]
      }}, true) %}
    | %tok_configure %tok_using declaration_list_body
      {% metaProp(function(data){return {
        declarations: data[2]
      }}, true) %}
    | PROVIDEs Identifier_list_body
      {% metaProp(function(d){return {
        ids: d[1]
      }}, true) %}
    | PROVIDEs ProvidesOperator Identifier_list_body %tok_to RulesetID_list
      {% metaProp(function(d){return {
        operator: d[1],
        ids: d[2],
        rulesets: d[4]
      }}, true) %}
    | SHAREs Identifier_list_body
      {% metaProp(function(d){return {
        ids: d[1]
      }}, true) %}

ProvidesOperator -> %tok_keys {%
  function(data){
    var d = data[0];
    return {
      loc: d.loc,
      type: 'Keyword',
      value: d.src
    };
  }
%}

Keyword -> %tok_SYMBOL {%
  function(data){
    var d = data[0];
    return {
      loc: d.loc,
      type: 'Keyword',
      value: d.src
    };
  }
%}

KEYs -> (%tok_key | %tok_keys) {%
  function(data){
    var d = data[0][0];
    return {
      loc: d.loc,
      type: "Keyword",
      value: "keys"
    };
  }
%}
PROVIDEs -> (%tok_provides | %tok_provide) {%
  function(data){
    var d = data[0][0];
    return {
      loc: d.loc,
      type: 'Keyword',
      value: "provides"
    };
  }
%}
SHAREs -> (%tok_shares | %tok_share) {%
  function(data){
    var d = data[0][0];
    return {
      loc: d.loc,
      type: 'Keyword',
      value: "shares"
    };
  }
%}

RulesetID_list -> RulesetID {% idArr %}
    | RulesetID_list %tok_COMMA RulesetID {% concatArr(2) %}

OnOrOff -> %tok_on  {% booleanAST(true ) %}
         | %tok_off {% booleanAST(false) %}

RulesetGlobal -> %tok_global %tok_OPEN_CURLY DeclarationOrDefActionList %tok_CLSE_CURLY {% getN(2) %}

################################################################################
#
# Rule
#

rule -> %tok_rule Identifier (%tok_is rule_state):? %tok_OPEN_CURLY

  (RuleSelect %tok_SEMI:?):?
  RuleForEach:*
  RulePrelude:?
  ActionBlock:?
  RulePostlude:?

%tok_CLSE_CURLY {%
  function(data){
    return {
      loc: mkLoc(data),
      type: 'Rule',
      name: data[1],
      rule_state: data[2] ? data[2][1].src : "active",
      select: data[4] && data[4][0],
      foreach: data[5] || [],
      prelude: data[6] || [],
      action_block: data[7],
      postlude: data[8]
    };
  }
%}

rule_state -> %tok_active {% id %} | %tok_inactive {% id %}

RuleSelect -> %tok_select %tok_when EventExpression EventWithin:? {%
  function(data){
    return {
      loc: mkLoc(data),
      type: 'RuleSelect',
      kind: 'when',
      event: data[2],
      within: data[3]
    };
  }
%}

RuleForEach -> %tok_foreach Expression %tok_setting %tok_OPEN_PAREN Identifier_list %tok_CLSE_PAREN {%
  function(data){
    return {
      loc: mkLoc(data),
      type: 'RuleForEach',
      expression: data[1],
      setting: data[4]
    };
  }
%}

RulePrelude -> %tok_pre %tok_OPEN_CURLY DeclarationOrDefActionList %tok_CLSE_CURLY {% getN(2) %}

################################################################################
#
# EventExpression
#

EventExpression -> event_exp_or {% id %}

event_exp_or -> event_exp_and {% id %}
    | event_exp_or %tok_or event_exp_and {% infixEventOp %}

event_exp_and -> event_exp_infix_op {% id %}
    | event_exp_and %tok_and event_exp_infix_op {% infixEventOp %}

event_exp_infix_op -> event_exp_fns {% id %}
    | event_exp_infix_op %tok_before event_exp_fns {% infixEventOp %}
    | event_exp_infix_op %tok_then   event_exp_fns {% infixEventOp %}
    | event_exp_infix_op %tok_after  event_exp_fns {% infixEventOp %}

event_exp_fns -> event_exp_base {% id %}
    | event_exp_fns %tok_between %tok_OPEN_PAREN EventExpression %tok_COMMA EventExpression %tok_CLSE_PAREN
      {% complexEventOp("between", 0, 3, 5) %}
    | event_exp_fns %tok_not %tok_between %tok_OPEN_PAREN EventExpression %tok_COMMA EventExpression %tok_CLSE_PAREN
      {% complexEventOp("not between", 0, 4, 6) %}
    | %tok_any PositiveInteger %tok_OPEN_PAREN EventExpression_list %tok_CLSE_PAREN
      {% complexEventOp("any", 1, 3) %}
    | %tok_and %tok_OPEN_PAREN EventExpression_list %tok_CLSE_PAREN
      {% complexEventOp("and", 2) %}
    | %tok_or %tok_OPEN_PAREN EventExpression_list %tok_CLSE_PAREN {% complexEventOp("or", 2) %}
    | %tok_before %tok_OPEN_PAREN EventExpression_list %tok_CLSE_PAREN
      {% complexEventOp("before", 2) %}
    | %tok_then %tok_OPEN_PAREN EventExpression_list %tok_CLSE_PAREN
      {% complexEventOp("then", 2) %}
    | %tok_after %tok_OPEN_PAREN EventExpression_list %tok_CLSE_PAREN
      {% complexEventOp("after", 2) %}
    | %tok_count PositiveInteger %tok_OPEN_PAREN IndividualEventExpression %tok_CLSE_PAREN EventAggregator:?
      {% eventGroupOp("count", 1, 3, 5) %}
    | %tok_repeat PositiveInteger %tok_OPEN_PAREN IndividualEventExpression %tok_CLSE_PAREN EventAggregator:?
      {% eventGroupOp("repeat", 1, 3, 5) %}

event_exp_base -> %tok_OPEN_PAREN EventExpression %tok_CLSE_PAREN {% getN(1) %}
    | IndividualEventExpression {% id %}

IndividualEventExpression -> Identifier Identifier
    event_exp_attribute_pair:*
    (%tok_where event_exp_where):?
    (%tok_setting %tok_OPEN_PAREN Identifier_list %tok_CLSE_PAREN):? {%
  function(data){
    return {
      type: 'EventExpression',
      loc: mkLoc(data),
      event_domain: data[0],
      event_type: data[1],
      event_attrs: data[2],
      where: data[3] && data[3][1],
      setting: (data[4] && data[4][2]) || [],
      aggregator: null//this is set by EventAggregator
    };
  }
%}

event_exp_attribute_pair -> Identifier RegExp {%
  function(data){
    return {
      loc: mkLoc(data),
      type: 'AttributeMatch',
      key: data[0],
      value: data[1]
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
    | EventExpression_list %tok_COMMA EventExpression {% concatArr(2) %}

EventAggregator -> EventAggregators_ops
  %tok_OPEN_PAREN Identifier_list %tok_CLSE_PAREN
{%
  function(data){
    return {
      loc: mkLoc(data),
      type: 'EventAggregator',
      op: data[0].src,
      args: data[2]
    };
  }
%}

EventAggregators_ops -> (%tok_max|%tok_min|%tok_sum|%tok_avg|%tok_push)
{%
  function(data){
    return data[0][0];
  }
%}

EventWithin -> %tok_within Expression %tok_TIME_PERIOD_ENUM {%
  function(data){
    return {
      loc: mkLoc(data),
      type: 'EventWithin',
      expression: data[1],
      time_period: data[2].src
    };
  }
%}

################################################################################
#
# ActionBlock
#

ActionBlock ->
      Action
      {% actionBlock(null, null, [0]) %}

    | %tok_if Expression %tok_then Action %tok_SEMI:?
      {% actionBlock([1], null, [3]) %}

    | %tok_if Expression %tok_then %tok_every Actions_in_curlies
      {% actionBlock([1], [3, "src"], [4]) %}

    | %tok_if Expression %tok_then %tok_sample Actions_in_curlies
      {% actionBlock([1], [3, "src"], [4]) %}

    | %tok_every Actions_in_curlies
      {% actionBlock(null, [0, "src"], [1]) %}

    | %tok_sample Actions_in_curlies
      {% actionBlock(null, [0, "src"], [1]) %}

    | %tok_choose Expression Actions_in_curlies
      {% actionBlock([1], [0, "src"], [2]) %}

Actions_in_curlies -> %tok_OPEN_CURLY (Action %tok_SEMI:?):+ %tok_CLSE_CURLY
{%
  function(data){
    return data[1].map(function(d){return d[0];})
  }
%}


Action ->
    (Identifier %tok_FAT_ARROW_RIGHT):?
    Identifier_or_DomainIdentifier Arguments
    (%tok_setting %tok_OPEN_PAREN Identifier_list %tok_CLSE_PAREN):?
{%
  function(data){
    return {
      loc: mkLoc(data),
      type: "Action",
      label: data[0] && data[0][0],
      action: data[1],
      args: data[2],
      setting: (data[3] && data[3][2]) || [],
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
      %tok_always %tok_OPEN_CURLY PostludeStatements %tok_CLSE_CURLY
      {% RulePostlude_by_paths(null, null, [2]) %}
    | %tok_fired %tok_OPEN_CURLY PostludeStatements %tok_CLSE_CURLY
      (%tok_else %tok_OPEN_CURLY PostludeStatements %tok_CLSE_CURLY):?
      (%tok_finally %tok_OPEN_CURLY PostludeStatements %tok_CLSE_CURLY):?
      {% RulePostlude_by_paths([2], [4, 2], [5, 2]) %}
    | %tok_notfired %tok_OPEN_CURLY PostludeStatements %tok_CLSE_CURLY
      (%tok_else %tok_OPEN_CURLY PostludeStatements %tok_CLSE_CURLY):?
      (%tok_finally %tok_OPEN_CURLY PostludeStatements %tok_CLSE_CURLY):?
      {% RulePostlude_by_paths([4, 2], [2], [5, 2]) %}

PostludeStatements ->
      null {% noopArr %}
    | PostludeStatements_body %tok_SEMI:? {% id %}

PostludeStatements_body ->
      PostludeStatement {% idArr %}
    | PostludeStatements_body %tok_SEMI PostludeStatement {% concatArr(2) %}

PostludeStatement ->
      PostludeStatement_core {% id %}
    | PostludeStatement_core %tok_on %tok_final {%
  function(data){
    return {
      loc: mkLoc(data),
      type: 'GuardCondition',
      condition: 'on final',
      statement: data[0]
    };
  }
%}
    | PostludeStatement_core %tok_if Expression {%
  function(data){
    return {
      loc: mkLoc(data),
      type: 'GuardCondition',
      condition: data[2],
      statement: data[0]
    };
  }
%}

PostludeStatement_core -> PostludeStatement_core_parts {%
  function(data, start, reject){
    if(true
      && data[0].type === "ExpressionStatement"
      && data[0].expression.type === "Identifier"
      && data[0].expression.value === "last"
    ){
      return reject;
    }
    return data[0];
  }
%}

PostludeStatement_core_parts ->
      Statement {% id %}
    | PersistentVariableAssignment {% id %}
    | ClearPersistentVariable {% id %}
    | RaiseEventStatement {% id %}
    | ScheduleEventStatement {% id %}
    | LogStatement {% id %}
    | ErrorStatement {% id %}
    | LastStatement {% id %}

PersistentVariableAssignment -> PersistentVariable (%tok_OPEN_CURLY Expression %tok_CLSE_CURLY):? %tok_COLON_EQ Expression {%
  function(data){
    return {
      loc: mkLoc(data),
      type: 'PersistentVariableAssignment',
      op: data[2].src,
      left: data[0],
      path_expression: data[1] ? data[1][1] : null,
      right: data[3]
    };
  }
%}

ClearPersistentVariable -> %tok_clear PersistentVariable {%
  function(data){
    return {
      loc: mkLoc(data),
      type: "ClearPersistentVariable",
      variable: data[1],
    };
  }
%}

PersistentVariable -> DomainIdentifier {%
  function(data, start, reject){
    if(data[0].domain === "ent" || data[0].domain === "app"){
      return data[0];
    }
    return reject;
  }
%}

RaiseEventStatement -> %tok_raise Identifier %tok_event Expression
  (%tok_for Expression):?
  (%tok_attributes Expression):?
{%
  function(data){
    return {
      loc: mkLoc(data),
      type: "RaiseEventStatement",
      event_domain: data[1],
      event_type: data[3],
      event_attrs: (data[5] && data[5][1]) || null,

      for_rid: data[4] ? data[4][1] : null,
    };
  }
%}

ScheduleEventStatement ->
      ScheduleEventStatement_at {% id %}
    | ScheduleEventStatement_repeat {% id %}

ScheduleEventStatement_at -> %tok_schedule Identifier %tok_event Expression
  %tok_at Expression
  (%tok_attributes Expression):?
  (%tok_setting %tok_OPEN_PAREN Identifier %tok_CLSE_PAREN):?
{%
  function(data){
    return {
      loc: mkLoc(data),
      type: "ScheduleEventStatement",

      at: data[5],

      event_domain: data[1],
      event_type: data[3],
      event_attrs: (data[6] && data[6][1]) || null,

      setting: (data[7] && data[7][2]) || null,
    };
  }
%}

ScheduleEventStatement_repeat -> %tok_schedule Identifier %tok_event Expression
  %tok_repeat Expression
  (%tok_attributes Expression):?
  (%tok_setting %tok_OPEN_PAREN Identifier %tok_CLSE_PAREN):?
{%
  function(data){
    return {
      loc: mkLoc(data),
      type: "ScheduleEventStatement",

      timespec: data[5],

      event_domain: data[1],
      event_type: data[3],
      event_attrs: (data[6] && data[6][1]) || null,

      setting: (data[7] && data[7][2]) || null,
    };
  }
%}

LogStatement -> %tok_log %tok_LOG_or_ERROR_LEVEL_ENUM Expression
{%
  function(data){
    return {
      loc: mkLoc(data),
      type: "LogStatement",
      level: data[1].src,
      expression: data[2]
    };
  }
%}

ErrorStatement -> %tok_error %tok_LOG_or_ERROR_LEVEL_ENUM Expression
{%
  function(data){
    return {
      loc: mkLoc(data),
      type: "ErrorStatement",
      level: data[1].src,
      expression: data[2]
    };
  }
%}

LastStatement -> %tok_last {%
  function(data){
    return {
      loc: mkLoc(data),
      type: 'LastStatement',
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

#Declaration that only allows Identifier on the left side
IdentifierDeclaration -> Identifier %tok_EQ Expression {%
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

DeclarationOrDefActionList -> (DeclarationOrDefAction %tok_SEMI:?):*
{% function(d){
    return d[0].map(function(dec){
        return dec[0];
    });
} %}

DeclarationList ->
      null {% noopArr %}
    | declaration_list_body {% id %}

declaration_list_body -> Declaration {% idArr %}
    | declaration_list_body %tok_SEMI:? Declaration %tok_SEMI:? {% concatArr(2) %}

DeclarationOrDefAction ->
      Declaration {% id %}
    | DefAction {% id %}

DefAction -> Identifier %tok_EQ %tok_defaction Parameters %tok_OPEN_CURLY
  DeclarationList
  ActionBlock
%tok_CLSE_CURLY
{%
  function(data){
    return {
      loc: mkLoc(data),
      type: 'DefAction',
      id: data[0],
      params: data[3],
      body: data[5],
      action_block: data[6]
    };
  }
%}


# Later we may add destructuring
left_side_of_declaration -> MemberExpression {% id %}

Statement_list ->
      null {% noopArr %}
    | Statement_list_body %tok_SEMI:? {% id %}

Statement_list_body ->
      Statement {% idArr %}
    | Statement_list_body %tok_SEMI Statement {% concatArr(2) %}

WithArguments -> %tok_with With_body {% getN(1) %}

With_body ->
      IdentifierDeclaration {% idArr %}
    | (IdentifierDeclaration) IdentifierDeclaration:+ {% concatArr(1) %}
    | (IdentifierDeclaration) %tok_and With_and_body {% concatArr(2) %}

With_and_body ->
      IdentifierDeclaration {% idArr %}
    | With_and_body %tok_and IdentifierDeclaration {% concatArr(2) %}

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
    | exp_or %tok_OR exp_and {% infixOp %}
 
exp_and -> exp_comp {% id %}
    | exp_and %tok_AND exp_comp {% infixOp %}

exp_comp -> exp_sum {% id %}
    | exp_comp %tok_LT exp_sum {% infixOp %}
    | exp_comp %tok_GT exp_sum {% infixOp %}
    | exp_comp %tok_LTEQ exp_sum {% infixOp %}
    | exp_comp %tok_GTEQ exp_sum {% infixOp %}
    | exp_comp %tok_EQEQ exp_sum {% infixOp %}
    | exp_comp %tok_NOTEQ exp_sum {% infixOp %}
    | exp_comp %tok_eq exp_sum {% infixOp %}
    | exp_comp %tok_neq exp_sum {% infixOp %}
    | exp_comp %tok_like exp_sum {% infixOp %}
    | exp_comp %tok_GTLT exp_sum {% infixOp %}
    | exp_comp %tok_FAT_ARROW_DOUBLE exp_sum {% infixOp %}
    | exp_comp %tok_cmp exp_sum {% infixOp %}

exp_sum -> exp_product {% id %}
    | exp_sum %tok_PLUS exp_product {% infixOp %}
    | exp_sum %tok_MINUS exp_product {% infixOp %}

exp_product -> UnaryOperator {% id %}
    | exp_product %tok_STAR UnaryOperator {% infixOp %}
    | exp_product %tok_DIVIDE UnaryOperator {% infixOp %}
    | exp_product %tok_MODULO UnaryOperator {% infixOp %}

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
    | %tok_OPEN_PAREN Expression %tok_CLSE_PAREN {% getN(1) %}
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

Expression_list ->
      null {% noopArr %}
    | Expression_list_body {% id %}

Expression_list_body ->
      Expression {% idArr %}
    | Expression_list_body %tok_COMMA Expression {% concatArr(2) %}

Identifier_list ->
      null {% noopArr %}
    | Identifier_list_body {% id %}

Identifier_list_body ->
      Identifier {% idArr %}
    | Identifier_list_body %tok_COMMA Identifier {% concatArr(2) %}

################################################################################
# Functions

Function -> %tok_function Parameters %tok_OPEN_CURLY Statement_list %tok_CLSE_CURLY {%
  function(data){
    return {
      loc: mkLoc(data),
      type: "Function",
      params: data[1],
      body: data[3]
    };
  }
%}

Parameter -> Identifier (%tok_EQ Expression):?
{%
  function(data){
    return {
      loc: mkLoc(data),
      type: "Parameter",
      id: data[0],
      default: data[1] && data[1][1],
    };
  }
%}

Parameters -> %tok_OPEN_PAREN Parameter_list %tok_CLSE_PAREN
{%
  function(data){
    return {
      loc: mkLoc(data),
      type: "Parameters",
      params: data[1],
    };
  }
%}

Parameter_list ->
      null {% noopArr %}
    | Parameter_list_body %tok_COMMA:? {% id %}

Parameter_list_body ->
      Parameter {% idArr %}
    | Parameter_list_body %tok_COMMA Parameter {% concatArr(2) %}

Application -> MemberExpression Arguments {%
  function(data){
    return {
      loc: mkLoc(data),
      type: "Application",
      callee: data[0],
      args: data[1],
    };
  }
%}

Arguments -> %tok_OPEN_PAREN Argument_list %tok_CLSE_PAREN
{%
  function(data){
    return {
      loc: mkLoc(data),
      type: "Arguments",
      args: data[1],
    };
  }
%}

Argument ->
      Expression {% id %}
    | Identifier %tok_EQ Expression
{%
  function(data){
    return {
      loc: mkLoc(data),
      type: "NamedArgument",
      id: data[0],
      value: data[2],
    };
  }
%}

Argument_list ->
      null {% noopArr %}
    | Argument_list_body %tok_COMMA:? {% id %}

Argument_list_body ->
      Argument {% idArr %}
    | Argument_list_body %tok_COMMA Argument {% concatArr(2) %}

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

Map -> %tok_OPEN_CURLY Map_body %tok_CLSE_CURLY {%
  function(data){
    return {
      loc: mkLoc(data),
      type: 'Map',
      value: data[1]
    };
  }
%}

Map_body -> null {% noopArr %}
    | map_kv_pairs {% id %}

map_kv_pairs -> map_kv_pair {% idArr %}
    | map_kv_pairs %tok_COMMA map_kv_pair {% concatArr(2) %}

map_kv_pair -> String %tok_COLON Expression {%
  function(data){
    return {
      loc: mkLoc(data),
      type: 'MapKeyValuePair',
      key: data[0],
      value: data[2]
    };
  }
%}

################################################################################
# Literals

DomainIdentifier -> Identifier %tok_COLON Identifier {%
  function(data, start, reject){
    return {
      loc: mkLoc(data),
      type: 'DomainIdentifier',
      value: data[2].value,
      domain: data[0].value
    };
  }
%}

Identifier -> %tok_SYMBOL {%
  function(data, start, reject){
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
  function(data, start, reject){
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

RegExp -> %tok_REGEXP {%
  function(data){
    var d = data[0];
    var pattern = d.src.substring(3, d.src.lastIndexOf("#")).replace(/\\#/g, "#");
    var modifiers = d.src.substring(d.src.lastIndexOf("#") + 1);
    return {
      loc: d.loc,
      type: 'RegExp',
      value: new RegExp(pattern, modifiers)
    };
  }
%}

Chevron -> %tok_CHEVRON_OPEN ChevronPart:* %tok_CHEVRON_CLOSE {%
  function(data){
    return {
      loc: mkLoc(data),
      type: 'Chevron',
      value: data[1]
    };
  }
%}

ChevronPart -> ChevronString {% id %}
    | %tok_BEESTING_OPEN Expression %tok_BEESTING_CLOSE {% getN(1) %}

ChevronString -> %tok_CHEVRON_STRING {%
  function(data){
    var d = data[0];
    return {
      loc: d.loc,
      type: 'String',
      value: d.src.replace(/>\\>/g, '>>')
    };
  }
%}

String -> %tok_STRING {%
  function(data){
    var d = data[0];
    var v = d.src.replace(/(^")|("$)/g, "").replace(/\\"/g, "\"");
    return {
      loc: d.loc,
      type: 'String',
      value: v
    };
  }
%}
