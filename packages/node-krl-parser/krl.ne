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
    "(" _ comma_separated_expressions _ ")" {% getN(2) %}

comma_separated_expressions ->
    expression {% function(d){return [d[0]]} %}
    | comma_separated_expressions _ "," _ expression {% function(d){return d[0].concat([d[4]])} %}

with_expression ->
    "with" __ symbol_value_pairs {%
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
    var src = data[0].join('');
    return {
      loc: {start: loc, end: loc + src.length},
      type: 'int',
      src: src
    };
  }
%}

string -> "\"" _string "\"" {%
  function(data, loc){
    var src = data[1];
    return {
      loc: {start: loc, end: loc + src.length},
      type: 'string',
      value: src
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
