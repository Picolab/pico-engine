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
      args: undefined,
      expressions: [data[0], data[4]]
    };
  };
};

%}

main -> _ ruleset _ {% getN(1) %}

ruleset -> "ruleset" __ symbol _ "{" _ (rule _):* "}" {%
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
%}

rule -> "rule" __ symbol _ "{" _ rule_body _ "}" {%
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
%}

rule_body ->
    _ {% id %}
    | select_when


select_when ->
    "select" __ "when" __ event_expressions {%
  function(data, loc){
    return {
      type: 'select_when',
      loc: loc,
      event_expressions: data[4]
    };
  }
%}

event_expressions ->
    event_expression {% id %}
    | event_expression __ "or" __ event_expression {% infixEventOp('or') %}
    | event_expression __ "and" __ event_expression {% infixEventOp('and') %}

event_expression ->
  event_domain __ event_type {%
  function(data, loc){
    return {
      type: 'event_expression',
      loc: loc,
      event_domain: data[0],
      event_type: data[2]
    };
  }
%}

event_domain ->
    symbol {% id %}

event_type ->
    symbol {% id %}

symbol -> [\w]:+  {%
  function(data, loc){
    return {
      type: 'symbol',
      loc: loc,
      src: data[0].join('')
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

# Whitespace. The important thing here is that the postprocessor
# is a null-returning function. This is a memory efficiency trick.
_  -> [\s]:* {% function(){return null;} %}
__ -> [\s]:+ {% function(){return null;} %}
