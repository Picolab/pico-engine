@{%
var echo = function(data, location, reject){
  return {data: data, location: location};
};
%}

main -> _ expression _ {% echo %}

expression ->
    expression _ "+" _ int  {% echo %}
    | int                   {% echo %}


int ->
    [0-9]:+    {% echo %}

# Whitespace. The important thing here is that the postprocessor
# is a null-returning function. This is a memory efficiency trick.
_ -> [\s]:* {% function(){return null;} %}
