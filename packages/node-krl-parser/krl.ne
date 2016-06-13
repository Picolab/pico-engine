@{%

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
      args: [],
      expressions: [data[0], data[4]]
    };
  };
};

var noop = function(){};

var last = function(arr){
  return arr[arr.length - 1];
};

%}

main -> _ ruleset _ {% getN(1) %}

curly_close_loc -> "}" {% function(data, loc){return loc + 1;} %}

ruleset -> "ruleset" __ symbol _ "{" _ (rule _):* curly_close_loc {%
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
%}

rule -> "rule" __ symbol _ "{" _ rule_body _ curly_close_loc {%
  function(data, loc){
    var ast = data[6] || {};
    ast.type = 'rule';
    ast.loc = {start: loc, end: last(data)};
    ast.name = data[2].src;
    return ast;
  }
%}

rule_body ->
    _ {% noop %}
    | select_when {%
  function(data, loc){
    return {
      select: data[0]
    };
  }
%}
    | select_when __ event_action {%
  function(data, loc){
    return {
      select: data[0],
      actions: [data[2]]
    };
  }
%}


select_when ->
    "select" __ "when" __ event_exprs {%
  function(data, loc){
    return {
      type: 'select_when',
      loc: {start: loc, end: data[4].loc.end},
      event_expressions: data[4]
    };
  }
%}

event_exprs ->
    event_expression {% id %}
    | "(" _ event_exprs _ ")" {% getN(2) %}
    | event_exprs __ "or" __ event_exprs {% infixEventOp('or') %}
    | event_exprs __ "and" __ event_exprs {% infixEventOp('and') %}

event_expression ->
  event_domain __ event_type {%
  function(data, loc){
    return {
      type: 'event_expression',
      loc: {start: loc, end: data[2].loc.end},
      event_domain: data[0],
      event_type: data[2]
    };
  }
%}

event_domain ->
    symbol {% id %}

event_type ->
    symbol {% id %}

event_action ->
    "send_directive" _ function_call_args _ with_expression:? {%
  function(data, loc){
    var ast = {
      type: 'send_directive',
      loc: loc,
      args: data[2]
    };
    if(data[4]){
      ast.with = data[4];
    }
    return ast;
  }
%}

function_call_args ->
    "(" _ comma_separated_expressions _ ")" {% getN(2) %}

comma_separated_expressions ->
    expression {% function(d){return [d[0]]} %}
    | comma_separated_expressions _ "," _ expression {% function(d){return d[0].concat([d[4]])} %}

with_expression ->
    "with" __ symbol_value_pairs {%
  function(data, loc){
    return {
      type: 'with_expression',
      loc: loc,
      pairs: data[2]
    };
  }
%}

symbol_value_pairs ->
    symbol_value_pair {% function(d){return [d[0]]} %}
    | symbol_value_pairs __ "and" __ symbol_value_pair {% function(d){return d[0].concat([d[4]])} %}

symbol_value_pair ->
    symbol _ "=" _ expression {%
  function(data, loc){
    return [data[0], data[4]];
  }
%}

expression ->
    string {% id %}
    | int {% id %}

symbol -> [\w]:+  {%
  function(data, loc){
    var src = data[0].join('');
    return {
      type: 'symbol',
      loc: {start: loc, end: loc + src.length},
      src: src
    };
  }
%}

int -> [0-9]:+ {%
  function(data, loc){
    return {
      type: 'int',
      loc: loc,
      src: data[0].join('')
    };
  }
%}

string -> "\"" _string "\"" {%
  function(data, loc){
    return {
      type: 'string',
      loc: loc,
      value: data[1]
    };
  }
%}

_string ->
  null {% function(){return ""} %}
  | _string _stringchar {% function(d){return d[0] + d[1]} %}

_stringchar ->
  [^\\"] {% id %}
  | "\\" [^] {% function(d){return JSON.parse("\"" + d[0] + d[1] + "\"")} %}

# Whitespace
_  -> [\s]:* {% noop %}
__ -> [\s]:+ {% noop %}
