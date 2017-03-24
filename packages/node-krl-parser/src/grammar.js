// Generated automatically by nearley
// http://github.com/Hardmath123/nearley
(function () {
function id(x) {return x[0]; }


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


var time_period_enum = [
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
];
var tok_TIME_PERIOD_ENUM = {test: function(x){
  if(!x || x.type !== "SYMBOL"){
    return false;
  }
  return time_period_enum.indexOf(x.src) >= 0;
}};

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
var tok_attributes = tok("SYMBOL", "attributes");
var tok_author = tok("SYMBOL", "author");
var tok_avg = tok("SYMBOL", "avg");
var tok_before = tok("SYMBOL", "before");
var tok_between = tok("SYMBOL", "between");
var tok_choose = tok("SYMBOL", "choose");
var tok_configure = tok("SYMBOL", "configure");
var tok_count = tok("SYMBOL", "count");
var tok_cmp = tok("SYMBOL", "cmp");
var tok_defaction = tok("SYMBOL", "defaction");
var tok_description = tok("SYMBOL", "description");
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
var tok_logging = tok("SYMBOL", "logging");
var tok_max = tok("SYMBOL", "max");
var tok_min = tok("SYMBOL", "min");
var tok_meta = tok("SYMBOL", "meta");
var tok_module = tok("SYMBOL", "module");
var tok_name = tok("SYMBOL", "name");
var tok_neq = tok("SYMBOL", "neq");
var tok_not = tok("SYMBOL", "not");
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

var grammar = {
    ParserRules: [
    {"name": "main", "symbols": ["Ruleset"], "postprocess": id},
    {"name": "main", "symbols": ["Statement_list"], "postprocess": id},
    {"name": "Ruleset$ebnf$1", "symbols": ["RulesetMeta"], "postprocess": id},
    {"name": "Ruleset$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "Ruleset$ebnf$2", "symbols": ["RulesetGlobal"], "postprocess": id},
    {"name": "Ruleset$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "Ruleset$ebnf$3", "symbols": []},
    {"name": "Ruleset$ebnf$3", "symbols": ["rule", "Ruleset$ebnf$3"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "Ruleset", "symbols": [tok_ruleset, "RulesetID", tok_OPEN_CURLY, "Ruleset$ebnf$1", "Ruleset$ebnf$2", "Ruleset$ebnf$3", tok_CLSE_CURLY], "postprocess": 
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
        },
    {"name": "RulesetID", "symbols": ["RulesetID_parts"], "postprocess": 
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
        },
    {"name": "RulesetID_parts", "symbols": [tok_SYMBOL]},
    {"name": "RulesetID_parts$subexpression$1", "symbols": [tok_SYMBOL]},
    {"name": "RulesetID_parts$subexpression$1", "symbols": [tok_NUMBER]},
    {"name": "RulesetID_parts", "symbols": ["RulesetID_parts", tok_DOT, "RulesetID_parts$subexpression$1"]},
    {"name": "RulesetID_parts$subexpression$2", "symbols": [tok_SYMBOL]},
    {"name": "RulesetID_parts$subexpression$2", "symbols": [tok_NUMBER]},
    {"name": "RulesetID_parts", "symbols": ["RulesetID_parts", tok_MINUS, "RulesetID_parts$subexpression$2"]},
    {"name": "RulesetMeta$ebnf$1", "symbols": []},
    {"name": "RulesetMeta$ebnf$1", "symbols": ["ruleset_meta_prop", "RulesetMeta$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "RulesetMeta", "symbols": [tok_meta, tok_OPEN_CURLY, "RulesetMeta$ebnf$1", tok_CLSE_CURLY], "postprocess": 
        function(data){
          return {
            loc: mkLoc(data),
            type: "RulesetMeta",
            properties: data[2]
          };
        }
        },
    {"name": "ruleset_meta_prop", "symbols": [tok_name, "String"], "postprocess": metaProp2part},
    {"name": "ruleset_meta_prop", "symbols": [tok_description, "Chevron"], "postprocess": metaProp2part},
    {"name": "ruleset_meta_prop", "symbols": [tok_author, "String"], "postprocess": metaProp2part},
    {"name": "ruleset_meta_prop", "symbols": [tok_logging, "OnOrOff"], "postprocess": metaProp2part},
    {"name": "ruleset_meta_prop$subexpression$1", "symbols": ["String"]},
    {"name": "ruleset_meta_prop$subexpression$1", "symbols": ["Map"]},
    {"name": "ruleset_meta_prop", "symbols": ["KEYs", "Keyword", "ruleset_meta_prop$subexpression$1"], "postprocess": metaProp(function(data){return [data[1], data[2][0]]})},
    {"name": "ruleset_meta_prop$ebnf$1$subexpression$1", "symbols": [tok_version, "String"]},
    {"name": "ruleset_meta_prop$ebnf$1", "symbols": ["ruleset_meta_prop$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "ruleset_meta_prop$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "ruleset_meta_prop$ebnf$2$subexpression$1", "symbols": [tok_alias, "Identifier"]},
    {"name": "ruleset_meta_prop$ebnf$2", "symbols": ["ruleset_meta_prop$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "ruleset_meta_prop$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "ruleset_meta_prop$ebnf$3", "symbols": ["WithArguments"], "postprocess": id},
    {"name": "ruleset_meta_prop$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "ruleset_meta_prop", "symbols": [tok_use, tok_module, "RulesetID", "ruleset_meta_prop$ebnf$1", "ruleset_meta_prop$ebnf$2", "ruleset_meta_prop$ebnf$3"], "postprocess":  metaProp(function(data){return {
          kind: data[1].src,
          rid: data[2],
          version: data[3] && data[3][1],
          alias:   data[4] && data[4][1],
          'with':  data[5]
        }}, true) },
    {"name": "ruleset_meta_prop$ebnf$4$subexpression$1", "symbols": [tok_version, "String"]},
    {"name": "ruleset_meta_prop$ebnf$4", "symbols": ["ruleset_meta_prop$ebnf$4$subexpression$1"], "postprocess": id},
    {"name": "ruleset_meta_prop$ebnf$4", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "ruleset_meta_prop", "symbols": [tok_errors, tok_to, "RulesetID", "ruleset_meta_prop$ebnf$4"], "postprocess":  metaProp(function(data){return {
          rid: data[2],
          version: data[3] && data[3][1]
        }}, true) },
    {"name": "ruleset_meta_prop", "symbols": [tok_configure, tok_using, "declaration_list"], "postprocess":  metaProp(function(data){return {
          declarations: data[2]
        }}, true) },
    {"name": "ruleset_meta_prop", "symbols": ["PROVIDEs", "Identifier_list"], "postprocess":  metaProp(function(d){return {
          ids: d[1]
        }}, true) },
    {"name": "ruleset_meta_prop", "symbols": ["PROVIDEs", "ProvidesOperator", "Identifier_list", tok_to, "RulesetID_list"], "postprocess":  metaProp(function(d){return {
          operator: d[1],
          ids: d[2],
          rulesets: d[4]
        }}, true) },
    {"name": "ruleset_meta_prop", "symbols": ["SHAREs", "Identifier_list"], "postprocess":  metaProp(function(d){return {
          ids: d[1]
        }}, true) },
    {"name": "ProvidesOperator", "symbols": [tok_keys], "postprocess": 
        function(data){
          var d = data[0];
          return {
            loc: d.loc,
            type: 'Keyword',
            value: d.src
          };
        }
        },
    {"name": "Keyword", "symbols": [tok_SYMBOL], "postprocess": 
        function(data){
          var d = data[0];
          return {
            loc: d.loc,
            type: 'Keyword',
            value: d.src
          };
        }
        },
    {"name": "KEYs$subexpression$1", "symbols": [tok_key]},
    {"name": "KEYs$subexpression$1", "symbols": [tok_keys]},
    {"name": "KEYs", "symbols": ["KEYs$subexpression$1"], "postprocess": 
        function(data){
          var d = data[0][0];
          return {
            loc: d.loc,
            type: "Keyword",
            value: "keys"
          };
        }
        },
    {"name": "PROVIDEs$subexpression$1", "symbols": [tok_provides]},
    {"name": "PROVIDEs$subexpression$1", "symbols": [tok_provide]},
    {"name": "PROVIDEs", "symbols": ["PROVIDEs$subexpression$1"], "postprocess": 
        function(data){
          var d = data[0][0];
          return {
            loc: d.loc,
            type: 'Keyword',
            value: "provides"
          };
        }
        },
    {"name": "SHAREs$subexpression$1", "symbols": [tok_shares]},
    {"name": "SHAREs$subexpression$1", "symbols": [tok_share]},
    {"name": "SHAREs", "symbols": ["SHAREs$subexpression$1"], "postprocess": 
        function(data){
          var d = data[0][0];
          return {
            loc: d.loc,
            type: 'Keyword',
            value: "shares"
          };
        }
        },
    {"name": "Identifier_list", "symbols": ["Identifier"], "postprocess": idArr},
    {"name": "Identifier_list", "symbols": ["Identifier_list", tok_COMMA, "Identifier"], "postprocess": concatArr(2)},
    {"name": "RulesetID_list", "symbols": ["RulesetID"], "postprocess": idArr},
    {"name": "RulesetID_list", "symbols": ["RulesetID_list", tok_COMMA, "RulesetID"], "postprocess": concatArr(2)},
    {"name": "OnOrOff", "symbols": [tok_on], "postprocess": booleanAST(true )},
    {"name": "OnOrOff", "symbols": [tok_off], "postprocess": booleanAST(false)},
    {"name": "RulesetGlobal$ebnf$1", "symbols": []},
    {"name": "RulesetGlobal$ebnf$1", "symbols": ["DeclarationOrDefAction", "RulesetGlobal$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "RulesetGlobal", "symbols": [tok_global, tok_OPEN_CURLY, "RulesetGlobal$ebnf$1", tok_CLSE_CURLY], "postprocess": getN(2)},
    {"name": "rule$ebnf$1$subexpression$1", "symbols": [tok_is, "rule_state"]},
    {"name": "rule$ebnf$1", "symbols": ["rule$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "rule$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "rule$ebnf$2$subexpression$1$ebnf$1", "symbols": [tok_SEMI], "postprocess": id},
    {"name": "rule$ebnf$2$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "rule$ebnf$2$subexpression$1", "symbols": ["RuleSelect", "rule$ebnf$2$subexpression$1$ebnf$1"]},
    {"name": "rule$ebnf$2", "symbols": ["rule$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "rule$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "rule$ebnf$3", "symbols": []},
    {"name": "rule$ebnf$3", "symbols": ["RuleForEach", "rule$ebnf$3"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "rule$ebnf$4", "symbols": ["RulePrelude"], "postprocess": id},
    {"name": "rule$ebnf$4", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "rule$ebnf$5", "symbols": ["RuleActionBlock"], "postprocess": id},
    {"name": "rule$ebnf$5", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "rule$ebnf$6", "symbols": ["RulePostlude"], "postprocess": id},
    {"name": "rule$ebnf$6", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "rule", "symbols": [tok_rule, "Identifier", "rule$ebnf$1", tok_OPEN_CURLY, "rule$ebnf$2", "rule$ebnf$3", "rule$ebnf$4", "rule$ebnf$5", "rule$ebnf$6", tok_CLSE_CURLY], "postprocess": 
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
        },
    {"name": "rule_state", "symbols": [tok_active], "postprocess": id},
    {"name": "rule_state", "symbols": [tok_inactive], "postprocess": id},
    {"name": "RuleSelect$ebnf$1", "symbols": ["EventWithin"], "postprocess": id},
    {"name": "RuleSelect$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "RuleSelect", "symbols": [tok_select, tok_when, "EventExpression", "RuleSelect$ebnf$1"], "postprocess": 
        function(data){
          return {
            loc: mkLoc(data),
            type: 'RuleSelect',
            kind: 'when',
            event: data[2],
            within: data[3]
          };
        }
        },
    {"name": "RuleForEach", "symbols": [tok_foreach, "Expression", tok_setting, tok_OPEN_PAREN, "function_params", tok_CLSE_PAREN], "postprocess": 
        function(data){
          return {
            loc: mkLoc(data),
            type: 'RuleForEach',
            expression: data[1],
            setting: data[4]
          };
        }
        },
    {"name": "RulePrelude$ebnf$1", "symbols": []},
    {"name": "RulePrelude$ebnf$1", "symbols": ["DeclarationOrDefAction", "RulePrelude$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "RulePrelude", "symbols": [tok_pre, tok_OPEN_CURLY, "RulePrelude$ebnf$1", tok_CLSE_CURLY], "postprocess": getN(2)},
    {"name": "EventExpression", "symbols": ["event_exp_or"], "postprocess": id},
    {"name": "event_exp_or", "symbols": ["event_exp_and"], "postprocess": id},
    {"name": "event_exp_or", "symbols": ["event_exp_or", tok_or, "event_exp_and"], "postprocess": infixEventOp},
    {"name": "event_exp_and", "symbols": ["event_exp_infix_op"], "postprocess": id},
    {"name": "event_exp_and", "symbols": ["event_exp_and", tok_and, "event_exp_infix_op"], "postprocess": infixEventOp},
    {"name": "event_exp_infix_op", "symbols": ["event_exp_fns"], "postprocess": id},
    {"name": "event_exp_infix_op", "symbols": ["event_exp_infix_op", tok_before, "event_exp_fns"], "postprocess": infixEventOp},
    {"name": "event_exp_infix_op", "symbols": ["event_exp_infix_op", tok_then, "event_exp_fns"], "postprocess": infixEventOp},
    {"name": "event_exp_infix_op", "symbols": ["event_exp_infix_op", tok_after, "event_exp_fns"], "postprocess": infixEventOp},
    {"name": "event_exp_fns", "symbols": ["event_exp_base"], "postprocess": id},
    {"name": "event_exp_fns", "symbols": ["event_exp_fns", tok_between, tok_OPEN_PAREN, "EventExpression", tok_COMMA, "EventExpression", tok_CLSE_PAREN], "postprocess": complexEventOp("between", 0, 3, 5)},
    {"name": "event_exp_fns", "symbols": ["event_exp_fns", tok_not, tok_between, tok_OPEN_PAREN, "EventExpression", tok_COMMA, "EventExpression", tok_CLSE_PAREN], "postprocess": complexEventOp("not between", 0, 4, 6)},
    {"name": "event_exp_fns", "symbols": [tok_any, "PositiveInteger", tok_OPEN_PAREN, "EventExpression_list", tok_CLSE_PAREN], "postprocess": complexEventOp("any", 1, 3)},
    {"name": "event_exp_fns", "symbols": [tok_and, tok_OPEN_PAREN, "EventExpression_list", tok_CLSE_PAREN], "postprocess": complexEventOp("and", 2)},
    {"name": "event_exp_fns", "symbols": [tok_or, tok_OPEN_PAREN, "EventExpression_list", tok_CLSE_PAREN], "postprocess": complexEventOp("or", 2)},
    {"name": "event_exp_fns", "symbols": [tok_before, tok_OPEN_PAREN, "EventExpression_list", tok_CLSE_PAREN], "postprocess": complexEventOp("before", 2)},
    {"name": "event_exp_fns", "symbols": [tok_then, tok_OPEN_PAREN, "EventExpression_list", tok_CLSE_PAREN], "postprocess": complexEventOp("then", 2)},
    {"name": "event_exp_fns", "symbols": [tok_after, tok_OPEN_PAREN, "EventExpression_list", tok_CLSE_PAREN], "postprocess": complexEventOp("after", 2)},
    {"name": "event_exp_fns$ebnf$1", "symbols": ["EventAggregator"], "postprocess": id},
    {"name": "event_exp_fns$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "event_exp_fns", "symbols": [tok_count, "PositiveInteger", tok_OPEN_PAREN, "IndividualEventExpression", tok_CLSE_PAREN, "event_exp_fns$ebnf$1"], "postprocess": eventGroupOp("count", 1, 3, 5)},
    {"name": "event_exp_fns$ebnf$2", "symbols": ["EventAggregator"], "postprocess": id},
    {"name": "event_exp_fns$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "event_exp_fns", "symbols": [tok_repeat, "PositiveInteger", tok_OPEN_PAREN, "IndividualEventExpression", tok_CLSE_PAREN, "event_exp_fns$ebnf$2"], "postprocess": eventGroupOp("repeat", 1, 3, 5)},
    {"name": "event_exp_base", "symbols": [tok_OPEN_PAREN, "EventExpression", tok_CLSE_PAREN], "postprocess": getN(1)},
    {"name": "event_exp_base", "symbols": ["IndividualEventExpression"], "postprocess": id},
    {"name": "IndividualEventExpression$ebnf$1", "symbols": []},
    {"name": "IndividualEventExpression$ebnf$1", "symbols": ["event_exp_attribute_pair", "IndividualEventExpression$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "IndividualEventExpression$ebnf$2$subexpression$1", "symbols": [tok_where, "event_exp_where"]},
    {"name": "IndividualEventExpression$ebnf$2", "symbols": ["IndividualEventExpression$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "IndividualEventExpression$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "IndividualEventExpression$ebnf$3$subexpression$1", "symbols": [tok_setting, tok_OPEN_PAREN, "function_params", tok_CLSE_PAREN]},
    {"name": "IndividualEventExpression$ebnf$3", "symbols": ["IndividualEventExpression$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "IndividualEventExpression$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "IndividualEventExpression", "symbols": ["Identifier", "Identifier", "IndividualEventExpression$ebnf$1", "IndividualEventExpression$ebnf$2", "IndividualEventExpression$ebnf$3"], "postprocess": 
        function(data){
          return {
            type: 'EventExpression',
            loc: mkLoc(data),
            event_domain: data[0],
            event_type: data[1],
            attributes: data[2],
            where: data[3] && data[3][1],
            setting: (data[4] && data[4][2]) || [],
            aggregator: null//this is set by EventAggregator
          };
        }
        },
    {"name": "event_exp_attribute_pair", "symbols": ["Identifier", "RegExp"], "postprocess": 
        function(data){
          return {
            loc: mkLoc(data),
            type: 'AttributeMatch',
            key: data[0],
            value: data[1]
          };
        }
        },
    {"name": "event_exp_where", "symbols": ["Expression"], "postprocess": 
        function(data, start, reject){
          return data[0].type === 'RegExp'
            ? reject//it must be an attribute pair, not a where expression
            : data[0];
        }
        },
    {"name": "EventExpression_list", "symbols": ["EventExpression"], "postprocess": idArr},
    {"name": "EventExpression_list", "symbols": ["EventExpression_list", tok_COMMA, "EventExpression"], "postprocess": concatArr(2)},
    {"name": "EventAggregator", "symbols": ["EventAggregators_ops", tok_OPEN_PAREN, "function_params", tok_CLSE_PAREN], "postprocess": 
        function(data){
          return {
            loc: mkLoc(data),
            type: 'EventAggregator',
            op: data[0].src,
            args: data[2]
          };
        }
        },
    {"name": "EventAggregators_ops$subexpression$1", "symbols": [tok_max]},
    {"name": "EventAggregators_ops$subexpression$1", "symbols": [tok_min]},
    {"name": "EventAggregators_ops$subexpression$1", "symbols": [tok_sum]},
    {"name": "EventAggregators_ops$subexpression$1", "symbols": [tok_avg]},
    {"name": "EventAggregators_ops$subexpression$1", "symbols": [tok_push]},
    {"name": "EventAggregators_ops", "symbols": ["EventAggregators_ops$subexpression$1"], "postprocess": 
        function(data){
          return data[0][0];
        }
        },
    {"name": "EventWithin", "symbols": [tok_within, "Expression", tok_TIME_PERIOD_ENUM], "postprocess": 
        function(data){
          return {
            loc: mkLoc(data),
            type: 'EventWithin',
            expression: data[1],
            time_period: data[2].src
          };
        }
        },
    {"name": "RuleActionBlock$ebnf$1$subexpression$1$ebnf$1", "symbols": ["action_block_type"], "postprocess": id},
    {"name": "RuleActionBlock$ebnf$1$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "RuleActionBlock$ebnf$1$subexpression$1", "symbols": [tok_if, "Expression", tok_then, "RuleActionBlock$ebnf$1$subexpression$1$ebnf$1"]},
    {"name": "RuleActionBlock$ebnf$1", "symbols": ["RuleActionBlock$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "RuleActionBlock$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "RuleActionBlock$ebnf$2", "symbols": ["RuleAction"]},
    {"name": "RuleActionBlock$ebnf$2", "symbols": ["RuleAction", "RuleActionBlock$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "RuleActionBlock", "symbols": ["RuleActionBlock$ebnf$1", "RuleActionBlock$ebnf$2"], "postprocess": 
        function(data){
          return {
            loc: mkLoc(data),
            type: 'RuleActionBlock',
            condition: data[0] && data[0][1],
            block_type: (data[0] && data[0][3] && data[0][3].src) || "every",
            actions: data[1]
          };
        }
        },
    {"name": "action_block_type", "symbols": [tok_choose], "postprocess": id},
    {"name": "action_block_type", "symbols": [tok_every], "postprocess": id},
    {"name": "RuleAction$ebnf$1$subexpression$1", "symbols": ["Identifier", tok_FAT_ARROW_RIGHT]},
    {"name": "RuleAction$ebnf$1", "symbols": ["RuleAction$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "RuleAction$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "RuleAction$ebnf$2", "symbols": ["WithArguments"], "postprocess": id},
    {"name": "RuleAction$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "RuleAction", "symbols": ["RuleAction$ebnf$1", "Identifier_or_DomainIdentifier", tok_OPEN_PAREN, "Expression_list", tok_CLSE_PAREN, "RuleAction$ebnf$2"], "postprocess": 
        function(data){
          return {
            loc: mkLoc(data),
            type: 'RuleAction',
            label: data[0] && data[0][0],
            action: data[1],
            args: data[3],
            "with": data[5] || []
          };
        }
        },
    {"name": "Identifier_or_DomainIdentifier", "symbols": ["Identifier"], "postprocess": id},
    {"name": "Identifier_or_DomainIdentifier", "symbols": ["DomainIdentifier"], "postprocess": id},
    {"name": "RulePostlude", "symbols": [tok_always, tok_OPEN_CURLY, "PostludeStatements", tok_CLSE_CURLY], "postprocess": RulePostlude_by_paths(null, null, [2])},
    {"name": "RulePostlude$ebnf$1$subexpression$1", "symbols": [tok_else, tok_OPEN_CURLY, "PostludeStatements", tok_CLSE_CURLY]},
    {"name": "RulePostlude$ebnf$1", "symbols": ["RulePostlude$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "RulePostlude$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "RulePostlude$ebnf$2$subexpression$1", "symbols": [tok_finally, tok_OPEN_CURLY, "PostludeStatements", tok_CLSE_CURLY]},
    {"name": "RulePostlude$ebnf$2", "symbols": ["RulePostlude$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "RulePostlude$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "RulePostlude", "symbols": [tok_fired, tok_OPEN_CURLY, "PostludeStatements", tok_CLSE_CURLY, "RulePostlude$ebnf$1", "RulePostlude$ebnf$2"], "postprocess": RulePostlude_by_paths([2], [4, 2], [5, 2])},
    {"name": "PostludeStatements", "symbols": [], "postprocess": noopArr},
    {"name": "PostludeStatements", "symbols": ["PostludeStatements_body"], "postprocess": id},
    {"name": "PostludeStatements_body", "symbols": ["PostludeStatement"], "postprocess": idArr},
    {"name": "PostludeStatements_body", "symbols": ["PostludeStatements_body", tok_SEMI, "PostludeStatement"], "postprocess": concatArr(2)},
    {"name": "PostludeStatement", "symbols": ["PostludeStatement_core"], "postprocess": id},
    {"name": "PostludeStatement", "symbols": ["PostludeStatement_core", tok_on, tok_final], "postprocess": 
        function(data){
          return {
            loc: mkLoc(data),
            type: 'GuardCondition',
            condition: 'on final',
            statement: data[0]
          };
        }
        },
    {"name": "PostludeStatement", "symbols": ["PostludeStatement_core", tok_if, "Expression"], "postprocess": 
        function(data){
          return {
            loc: mkLoc(data),
            type: 'GuardCondition',
            condition: data[2],
            statement: data[0]
          };
        }
        },
    {"name": "PostludeStatement_core", "symbols": ["Statement"], "postprocess": id},
    {"name": "PostludeStatement_core", "symbols": ["PersistentVariableAssignment"], "postprocess": id},
    {"name": "PostludeStatement_core", "symbols": ["RaiseEventStatement"], "postprocess": id},
    {"name": "PersistentVariableAssignment$ebnf$1$subexpression$1", "symbols": [tok_OPEN_CURLY, "Expression", tok_CLSE_CURLY]},
    {"name": "PersistentVariableAssignment$ebnf$1", "symbols": ["PersistentVariableAssignment$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "PersistentVariableAssignment$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "PersistentVariableAssignment", "symbols": ["DomainIdentifier", "PersistentVariableAssignment$ebnf$1", tok_COLON_EQ, "Expression"], "postprocess": 
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
        },
    {"name": "RaiseEventStatement$ebnf$1$subexpression$1", "symbols": [tok_for, "Expression"]},
    {"name": "RaiseEventStatement$ebnf$1", "symbols": ["RaiseEventStatement$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "RaiseEventStatement$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "RaiseEventStatement$ebnf$2", "symbols": ["RaiseEventAttributes"], "postprocess": id},
    {"name": "RaiseEventStatement$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "RaiseEventStatement", "symbols": [tok_raise, "Identifier", tok_event, "Expression", "RaiseEventStatement$ebnf$1", "RaiseEventStatement$ebnf$2"], "postprocess": 
        function(data){
          return {
            loc: mkLoc(data),
            type: 'RaiseEventStatement',
            event_domain: data[1],
            event_type: data[3],
            for_rid: data[4] ? data[4][1] : null,
            attributes: data[5]
          };
        }
        },
    {"name": "RaiseEventAttributes", "symbols": ["WithArguments"], "postprocess": 
        function(data){
          return {
            loc: mkLoc(data),
            type: "RaiseEventAttributes",
            with: data[0]
          };
        }
        },
    {"name": "RaiseEventAttributes", "symbols": [tok_attributes, "Expression"], "postprocess": 
        function(data){
          return {
            loc: mkLoc(data),
            type: "RaiseEventAttributes",
            expression: data[1]
          };
        }
        },
    {"name": "Statement", "symbols": ["ExpressionStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["Declaration"], "postprocess": id},
    {"name": "ExpressionStatement", "symbols": ["Expression"], "postprocess": 
        function(data){
          return {
            loc: data[0].loc,
            type: 'ExpressionStatement',
            expression: data[0]
          };
        }
        },
    {"name": "Declaration", "symbols": ["left_side_of_declaration", tok_EQ, "Expression"], "postprocess": 
        function(data){
          return {
            loc: mkLoc(data),
            type: 'Declaration',
            op: "=",
            left: data[0],
            right: data[2]
          };
        }
        },
    {"name": "IdentifierDeclaration", "symbols": ["Identifier", tok_EQ, "Expression"], "postprocess": 
        function(data){
          return {
            loc: mkLoc(data),
            type: 'Declaration',
            op: "=",
            left: data[0],
            right: data[2]
          };
        }
        },
    {"name": "DeclarationOrDefAction", "symbols": ["Declaration"], "postprocess": id},
    {"name": "DeclarationOrDefAction", "symbols": ["DefAction"], "postprocess": id},
    {"name": "DefAction$ebnf$1", "symbols": []},
    {"name": "DefAction$ebnf$1", "symbols": ["Declaration", "DefAction$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "DefAction$ebnf$2", "symbols": ["RuleAction"]},
    {"name": "DefAction$ebnf$2", "symbols": ["RuleAction", "DefAction$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "DefAction", "symbols": ["Identifier", tok_EQ, tok_defaction, tok_OPEN_PAREN, "function_params", tok_CLSE_PAREN, tok_OPEN_CURLY, "DefAction$ebnf$1", "DefAction$ebnf$2", tok_CLSE_CURLY], "postprocess": 
        function(data){
          return {
            loc: mkLoc(data),
            type: 'DefAction',
            id: data[0],
            params: data[4],
            body: data[7],
            actions: data[8]
          };
        }
        },
    {"name": "left_side_of_declaration", "symbols": ["MemberExpression"], "postprocess": id},
    {"name": "Statement_list", "symbols": ["Statement_list_body"], "postprocess": id},
    {"name": "Statement_list_body", "symbols": ["Statement"], "postprocess": idArr},
    {"name": "Statement_list_body", "symbols": ["Statement_list_body", tok_SEMI, "Statement"], "postprocess": concatArr(2)},
    {"name": "declaration_list", "symbols": ["Declaration"], "postprocess": idArr},
    {"name": "declaration_list", "symbols": ["declaration_list", "Declaration"], "postprocess": concatArr(1)},
    {"name": "WithArguments", "symbols": [tok_with, "With_body"], "postprocess": getN(1)},
    {"name": "With_body", "symbols": ["IdentifierDeclaration"], "postprocess": idArr},
    {"name": "With_body$subexpression$1", "symbols": ["IdentifierDeclaration"]},
    {"name": "With_body$ebnf$1", "symbols": ["IdentifierDeclaration"]},
    {"name": "With_body$ebnf$1", "symbols": ["IdentifierDeclaration", "With_body$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "With_body", "symbols": ["With_body$subexpression$1", "With_body$ebnf$1"], "postprocess": concatArr(1)},
    {"name": "With_body$subexpression$2", "symbols": ["IdentifierDeclaration"]},
    {"name": "With_body", "symbols": ["With_body$subexpression$2", tok_and, "With_and_body"], "postprocess": concatArr(2)},
    {"name": "With_and_body", "symbols": ["IdentifierDeclaration"], "postprocess": idArr},
    {"name": "With_and_body", "symbols": ["With_and_body", tok_and, "IdentifierDeclaration"], "postprocess": concatArr(2)},
    {"name": "Expression", "symbols": ["exp_conditional"], "postprocess": id},
    {"name": "exp_conditional", "symbols": ["exp_or"], "postprocess": id},
    {"name": "exp_conditional", "symbols": ["exp_or", tok_FAT_ARROW_RIGHT, "exp_or", tok_PIPE, "exp_conditional"], "postprocess": 
        function(data){
          return {
            loc: mkLoc(data),
            type: 'ConditionalExpression',
            test: data[0],
            consequent: data[2],
            alternate: data[4]
          };
        }
        },
    {"name": "exp_or", "symbols": ["exp_and"], "postprocess": id},
    {"name": "exp_or", "symbols": ["exp_or", tok_OR, "exp_and"], "postprocess": infixOp},
    {"name": "exp_and", "symbols": ["exp_comp"], "postprocess": id},
    {"name": "exp_and", "symbols": ["exp_and", tok_AND, "exp_comp"], "postprocess": infixOp},
    {"name": "exp_comp", "symbols": ["exp_sum"], "postprocess": id},
    {"name": "exp_comp", "symbols": ["exp_comp", tok_LT, "exp_sum"], "postprocess": infixOp},
    {"name": "exp_comp", "symbols": ["exp_comp", tok_GT, "exp_sum"], "postprocess": infixOp},
    {"name": "exp_comp", "symbols": ["exp_comp", tok_LTEQ, "exp_sum"], "postprocess": infixOp},
    {"name": "exp_comp", "symbols": ["exp_comp", tok_GTEQ, "exp_sum"], "postprocess": infixOp},
    {"name": "exp_comp", "symbols": ["exp_comp", tok_EQEQ, "exp_sum"], "postprocess": infixOp},
    {"name": "exp_comp", "symbols": ["exp_comp", tok_NOTEQ, "exp_sum"], "postprocess": infixOp},
    {"name": "exp_comp", "symbols": ["exp_comp", tok_eq, "exp_sum"], "postprocess": infixOp},
    {"name": "exp_comp", "symbols": ["exp_comp", tok_neq, "exp_sum"], "postprocess": infixOp},
    {"name": "exp_comp", "symbols": ["exp_comp", tok_like, "exp_sum"], "postprocess": infixOp},
    {"name": "exp_comp", "symbols": ["exp_comp", tok_GTLT, "exp_sum"], "postprocess": infixOp},
    {"name": "exp_comp", "symbols": ["exp_comp", tok_FAT_ARROW_DOUBLE, "exp_sum"], "postprocess": infixOp},
    {"name": "exp_comp", "symbols": ["exp_comp", tok_cmp, "exp_sum"], "postprocess": infixOp},
    {"name": "exp_sum", "symbols": ["exp_product"], "postprocess": id},
    {"name": "exp_sum", "symbols": ["exp_sum", tok_PLUS, "exp_product"], "postprocess": infixOp},
    {"name": "exp_sum", "symbols": ["exp_sum", tok_MINUS, "exp_product"], "postprocess": infixOp},
    {"name": "exp_product", "symbols": ["UnaryOperator"], "postprocess": id},
    {"name": "exp_product", "symbols": ["exp_product", tok_STAR, "UnaryOperator"], "postprocess": infixOp},
    {"name": "exp_product", "symbols": ["exp_product", tok_DIVIDE, "UnaryOperator"], "postprocess": infixOp},
    {"name": "exp_product", "symbols": ["exp_product", tok_MODULO, "UnaryOperator"], "postprocess": infixOp},
    {"name": "UnaryOperator", "symbols": ["MemberExpression"], "postprocess": id},
    {"name": "UnaryOperator", "symbols": [tok_PLUS, "UnaryOperator"], "postprocess": unaryOp},
    {"name": "UnaryOperator", "symbols": [tok_MINUS, "UnaryOperator"], "postprocess": unaryOp},
    {"name": "UnaryOperator", "symbols": [tok_not, "UnaryOperator"], "postprocess": unaryOp},
    {"name": "MemberExpression", "symbols": ["PrimaryExpression"], "postprocess": id},
    {"name": "MemberExpression", "symbols": ["MemberExpression", tok_OPEN_SQARE, "Expression", tok_CLSE_SQARE], "postprocess": MemberExpression_method('index')},
    {"name": "MemberExpression", "symbols": ["MemberExpression", tok_OPEN_CURLY, "Expression", tok_CLSE_CURLY], "postprocess": MemberExpression_method('path')},
    {"name": "MemberExpression", "symbols": ["MemberExpression", tok_DOT, "Identifier"], "postprocess": MemberExpression_method('dot')},
    {"name": "PrimaryExpression", "symbols": ["Identifier"], "postprocess": id},
    {"name": "PrimaryExpression", "symbols": ["DomainIdentifier"], "postprocess": id},
    {"name": "PrimaryExpression", "symbols": ["Literal"], "postprocess": id},
    {"name": "PrimaryExpression", "symbols": [tok_OPEN_PAREN, "Expression", tok_CLSE_PAREN], "postprocess": getN(1)},
    {"name": "PrimaryExpression", "symbols": ["Function"], "postprocess": id},
    {"name": "PrimaryExpression", "symbols": ["Application"], "postprocess": id},
    {"name": "Literal", "symbols": ["String"], "postprocess": id},
    {"name": "Literal", "symbols": ["Number"], "postprocess": id},
    {"name": "Literal", "symbols": ["Boolean"], "postprocess": id},
    {"name": "Literal", "symbols": ["RegExp"], "postprocess": id},
    {"name": "Literal", "symbols": ["Chevron"], "postprocess": id},
    {"name": "Literal", "symbols": ["Array"], "postprocess": id},
    {"name": "Literal", "symbols": ["Map"], "postprocess": id},
    {"name": "Expression_list", "symbols": [], "postprocess": noopArr},
    {"name": "Expression_list", "symbols": ["Expression_list_body"], "postprocess": id},
    {"name": "Expression_list_body", "symbols": ["Expression"], "postprocess": idArr},
    {"name": "Expression_list_body", "symbols": ["Expression_list_body", tok_COMMA, "Expression"], "postprocess": concatArr(2)},
    {"name": "Function$ebnf$1", "symbols": ["Statement_list"], "postprocess": id},
    {"name": "Function$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "Function", "symbols": [tok_function, tok_OPEN_PAREN, "function_params", tok_CLSE_PAREN, tok_OPEN_CURLY, "Function$ebnf$1", tok_CLSE_CURLY], "postprocess": 
        function(data){
          return {
            loc: mkLoc(data),
            type: 'Function',
            params: data[2],
            body: data[5] || []
          };
        }
        },
    {"name": "function_params", "symbols": [], "postprocess": noopArr},
    {"name": "function_params", "symbols": ["Identifier"], "postprocess": idArr},
    {"name": "function_params", "symbols": ["function_params", tok_COMMA, "Identifier"], "postprocess": concatArr(2)},
    {"name": "Application$ebnf$1", "symbols": ["WithArguments"], "postprocess": id},
    {"name": "Application$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "Application", "symbols": ["MemberExpression", tok_OPEN_PAREN, "Expression_list", tok_CLSE_PAREN, "Application$ebnf$1"], "postprocess": 
        function(data){
          return {
            loc: mkLoc(data),
            type: 'Application',
            callee: data[0],
            args: data[2],
            "with": data[4] || []
          };
        }
        },
    {"name": "Array", "symbols": [tok_OPEN_SQARE, "Expression_list", tok_CLSE_SQARE], "postprocess": 
        function(data){
          return {
            loc: mkLoc(data),
            type: 'Array',
            value: data[1]
          };
        }
        },
    {"name": "Map", "symbols": [tok_OPEN_CURLY, "Map_body", tok_CLSE_CURLY], "postprocess": 
        function(data){
          return {
            loc: mkLoc(data),
            type: 'Map',
            value: data[1]
          };
        }
        },
    {"name": "Map_body", "symbols": [], "postprocess": noopArr},
    {"name": "Map_body", "symbols": ["map_kv_pairs"], "postprocess": id},
    {"name": "map_kv_pairs", "symbols": ["map_kv_pair"], "postprocess": idArr},
    {"name": "map_kv_pairs", "symbols": ["map_kv_pairs", tok_COMMA, "map_kv_pair"], "postprocess": concatArr(2)},
    {"name": "map_kv_pair", "symbols": ["String", tok_COLON, "Expression"], "postprocess": 
        function(data){
          return {
            loc: mkLoc(data),
            type: 'MapKeyValuePair',
            key: data[0],
            value: data[2]
          };
        }
        },
    {"name": "DomainIdentifier", "symbols": ["Identifier", tok_COLON, "Identifier"], "postprocess": 
        function(data, start, reject){
          return {
            loc: mkLoc(data),
            type: 'DomainIdentifier',
            value: data[2].value,
            domain: data[0].value
          };
        }
        },
    {"name": "Identifier", "symbols": [tok_SYMBOL], "postprocess": 
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
        },
    {"name": "Boolean", "symbols": [tok_true], "postprocess": booleanAST(true )},
    {"name": "Boolean", "symbols": [tok_false], "postprocess": booleanAST(false)},
    {"name": "PositiveInteger", "symbols": ["Number"], "postprocess": 
        function(data, start, reject){
          var n = data[0];
          if(n.value >= 0 && (n.value === parseInt(n.value, 10))){
            return n;
          }
          return reject;
        }
        },
    {"name": "Number", "symbols": [tok_NUMBER], "postprocess": 
        function(data){
          var d = data[0];
          return {
            loc: d.loc,
            type: 'Number',
            value: parseFloat(d.src) || 0// or 0 to avoid NaN
          };
        }
        },
    {"name": "RegExp", "symbols": [tok_REGEXP], "postprocess": 
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
        },
    {"name": "Chevron$ebnf$1", "symbols": []},
    {"name": "Chevron$ebnf$1", "symbols": ["ChevronPart", "Chevron$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "Chevron", "symbols": [tok_CHEVRON_OPEN, "Chevron$ebnf$1", tok_CHEVRON_CLOSE], "postprocess": 
        function(data){
          return {
            loc: mkLoc(data),
            type: 'Chevron',
            value: data[1]
          };
        }
        },
    {"name": "ChevronPart", "symbols": ["ChevronString"], "postprocess": id},
    {"name": "ChevronPart", "symbols": [tok_BEESTING_OPEN, "Expression", tok_BEESTING_CLOSE], "postprocess": getN(1)},
    {"name": "ChevronString", "symbols": [tok_CHEVRON_STRING], "postprocess": 
        function(data){
          var d = data[0];
          return {
            loc: d.loc,
            type: 'String',
            value: d.src.replace(/>\\>/g, '>>')
          };
        }
        },
    {"name": "String", "symbols": [tok_STRING], "postprocess": 
        function(data){
          var d = data[0];
          var v = d.src.replace(/(^")|("$)/g, "").replace(/\\"/g, "\"");
          return {
            loc: d.loc,
            type: 'String',
            value: v
          };
        }
        }
]
  , ParserStart: "main"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
