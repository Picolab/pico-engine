var _ = require("lodash");
var mkTree = require("estree-builder");
var callStdLibFn = require("./utils/callStdLibFn");
var callModuleFn = require("./utils/callModuleFn");

var comp_by_type = {
  "String": function(ast, comp, e){
    return e("string", ast.value);
  },
  "Number": function(ast, comp, e){
    if(ast.value < 0){
      return e("-", e("number", -ast.value));
    }
    return e("number", ast.value);
  },
  "Identifier": function(ast, comp, e, context){
    if(ast.value === "null"){
      //undefined is the true "null" in javascript
      //however, undefined can be re-assigned. So `void 0` returns undefined but can"t be re-assigned
      return e("void", e("number", 0));
    }
    if(context && context.identifiers_are_event_attributes){
      return callModuleFn(e, "event", "attr", [e("str", ast.value)], ast.loc);
    }
    return e("call", e("id", "ctx.scope.get"), [e("str", ast.value)]);
  },
  "Chevron": function(ast, comp, e){
    if(ast.value.length < 1){
      return e("string", "");
    }
    var compElm = function(elm){
      if(elm.type === "String"){
        return e("string", elm.value, elm.loc);
      }
      return callStdLibFn(e, "beesting", [comp(elm)], elm.loc);
    };
    var curr = compElm(ast.value[0]);
    var i = 1;
    while(i < ast.value.length){
      curr = e("+", curr, compElm(ast.value[i]));
      i++;
    }
    return curr;
  },
  "Boolean": function(ast, comp, e){
    return e(ast.value ? "true" : "false");
  },
  "RegExp": function(ast, comp, e){
    var flags = "";
    if(ast.value.global){
      flags += "g";
    }
    if(ast.value.ignoreCase){
      flags += "i";
    }
    return e("new", e("id", "RegExp"), [
      e("str", ast.value.source),
      e("str", flags)
    ]);
  },
  "DomainIdentifier": function(ast, comp, e){
    return e("call", e("id", "ctx.modules.get"), [
      e("id", "ctx"),
      e("str", ast.domain),
      e("str", ast.value)
    ]);
  },
  "MemberExpression": function(ast, comp, e){
    if(ast.method === "dot"){
      if(ast.property.type === "Identifier"){
        //using "get" rather than . b/c we don"t want to mess
        //with reserved javascript properties i.e. "prototype"
        return e("get", comp(ast.object), e("str", ast.property.value, ast.property.loc));
      }
      return e("get", comp(ast.object), comp(ast.property));
    }else if(ast.method === "path"){
      return callStdLibFn(e, "get", [
        comp(ast.object),
        comp(ast.property)
      ], ast.loc);
    }else if(ast.method === "index"){
      return callStdLibFn(e, "get", [
        comp(ast.object),
        e("array", [comp(ast.property)], ast.property.loc)
      ], ast.loc);
    }
    throw new Error("Unsupported MemberExpression method: " + ast.method);
  },
  "Array": function(ast, comp, e){
    return e("array", comp(ast.value));
  },
  "Map": function(ast, comp, e){
    return e("obj-raw", comp(ast.value));
  },
  "MapKeyValuePair": function(ast, comp, e){
    return e("obj-prop", e("string", ast.key.value + "", ast.key.loc), comp(ast.value));
  },
  "Application": function(ast, comp, e){
    if(ast.callee.type === "MemberExpression"
        && ast.callee.method === "dot"
        && ast.callee.property.type === "Identifier"
        ){
      //operator syntax is just sugar for stdlib functions
      var operator = ast.callee.property;
      var args = [comp(ast.callee.object)].concat(comp(ast.args));
      return callStdLibFn(e, operator.value, args, operator.loc);
    }
    return e("call", comp(ast.callee), [
      e("id", "ctx"),
      e("array", comp(ast.args))
    ]);
  },
  "UnaryOperator": function(ast, comp, e){
    if(ast.op === "not"){
      return e("!", comp(ast.arg));
    }
    return callStdLibFn(e, ast.op, [
      comp(ast.arg)
    ], ast.loc);
  },
  "InfixOperator": function(ast, comp, e){
    if((ast.op === "||") || (ast.op === "&&")){
      return e(ast.op, comp(ast.left), comp(ast.right));
    }
    return callStdLibFn(e, ast.op, [
      comp(ast.left),
      comp(ast.right)
    ], ast.loc);
  },
  "ConditionalExpression": function(ast, comp, e){
    return e("ternary",
      comp(ast.test),
      comp(ast.consequent),
      comp(ast.alternate)
    );
  },
  "Function": function(ast, comp, e){
    var body = _.map(ast.params, function(param, i){
      var loc = param.loc;
      return e(";", e("call", e("id", "ctx.scope.set", loc), [
        e("str", param.value, loc),
        e("call",
          e("id", "ctx.getArg", loc),
          [
            e("id", "ctx.args", loc),
            e("string", param.value, loc),
            e("number", i, loc)
          ],
          loc
        )
      ], loc), loc);
    });
    _.each(ast.body, function(part, i){
      if(i < (ast.body.length - 1)){
        return body.push(comp(part));
      }
      if(part.type === "ExpressionStatement"){
        part = part.expression;
      }
      return body.push(e("return", comp(part)));
    });
    return e("call", e("id", "ctx.KRLClosure"), [
      e("id", "ctx"),
      e("fn", ["ctx"], body)
    ]);
  },
  "PersistentVariableAssignment": function(ast, comp, e){
    if(ast.op !== ":="){
      throw new Error("Unsuported Declaration.op: " + ast.op);
    }
    if(ast.left.type !== "DomainIdentifier" || !/^(ent|app)$/.test(ast.left.domain)){
      throw new Error("PersistentVariableAssignment - only works on ent:* or app:* variables");
    }

    var value_to_store = comp(ast.right);

    if(ast.path_expression){
      value_to_store = callStdLibFn(e, "set", [
        e("call", e("id", "ctx.modules.get"), [
          e("id", "ctx"),
          e("str", ast.left.domain),
          e("str", ast.left.value)
        ]),
        comp(ast.path_expression),
        value_to_store
      ], ast.loc);
    }

    return e(";", e("call", e("id", "ctx.modules.set"), [
      e("id", "ctx"),
      e("str", ast.left.domain, ast.left.loc),
      e("str", ast.left.value, ast.left.loc),
      value_to_store
    ]));
  },
  "Declaration": function(ast, comp, e){
    if(ast.op === "="){
      if(ast.left.type === "DomainIdentifier"){
        throw new Error("It's invalid to Declare DomainIdentifiers");
      }else if(ast.left.type === "MemberExpression"){
        if(ast.left.method === "path"){
          return e(";", callStdLibFn(e, "set", [
            comp(ast.left.object),
            comp(ast.left.property),
            comp(ast.right)
          ], ast.left.loc));
        }else if(ast.left.method === "index"){
          return e(";", callStdLibFn(e, "set", [
            comp(ast.left.object),
            e("array", [comp(ast.left.property)], ast.left.property.loc),
            comp(ast.right)
          ], ast.left.loc));
        }
      }
      return e(";", e("call", e("id", "ctx.scope.set"), [
        e("str", ast.left.value, ast.left.loc),
        comp(ast.right)
      ]));
    }
    throw new Error("Unsuported Declaration.op: " + ast.op);
  },
  "ExpressionStatement": function(ast, comp, e){
    return e(";", comp(ast.expression));
  },
  "Ruleset": function(ast, comp, e){
    var rules_obj = {};
    _.each(ast.rules, function(rule){
      rules_obj[rule.name.value] = comp(rule);
    });
    var rs = {
      rid: comp(ast.rid)
    };
    if(ast.meta){
      rs.meta = comp(ast.meta);
    }
    if(!_.isEmpty(ast.global)){
      _.each(ast.global, function(g){
        if(!g || g.type !== "Declaration"){
          throw new Error("Ruleset.global should only be declarations");
        }
      });
      rs.global = e("fn", ["ctx"], comp(ast.global));
    }
    rs.rules = e("obj", rules_obj);
    return [
      e(";", e("=", e("id", "module.exports"), e("obj", rs)))
    ];
  },
  "RulesetID": function(ast, comp, e){
    return e("string", ast.value);
  },
  "RulesetMeta": require("./c/RulesetMeta"),
  "RulesetMetaProperty": require("./c/RulesetMetaProperty"),
  "Rule": function(ast, comp, e){
    var rule = {
      name: e("string", ast.name.value, ast.name.loc)
    };
    if(ast.rule_state !== "active"){
      rule.rule_state = e("string", ast.rule_state);
    }
    if(ast.select){
      rule.select = comp(ast.select);
    }
    if(!_.isEmpty(ast.prelude)){
      rule.prelude = e("fn", ["ctx"], comp(ast.prelude));
    }
    if(ast.action_block){
      rule.action_block = comp(ast.action_block);
    }
    if(ast.postlude){
      rule.postlude = comp(ast.postlude);
    }
    return e("obj", rule);
  },
  "RuleSelect": require("./c/RuleSelect"),
  "EventExpression": require("./c/EventExpression"),
  "RuleActionBlock": function(ast, comp, e){
    var block = {};
    if(_.isString(ast.block_type) && ast.block_type !== "every"){
      block.block_type = e("string", ast.block_type);
    }
    if(ast.condition){
      block.condition = e("fn", ["ctx"], [
        e("return", comp(ast.condition))
      ]);
    }
    block.actions = e("arr", _.map(ast.actions, function(action){
      return comp(action);
    }));
    return e("obj", block);
  },
  "RuleAction": require("./c/RuleAction"),
  "RulePostlude": require("./c/RulePostlude"),
  "RaiseEventStatement": require("./c/RaiseEventStatement"),
  "RaiseEventAttributes": require("./c/RaiseEventAttributes")
};

var isKRL_loc = function(loc){
  return _.isPlainObject(loc) && _.has(loc, "start") && _.has(loc, "end");
};

module.exports = function(ast, options){
  options = options || {};

  var toLoc = options.toLoc || _.noop;

  var mkE = function(default_krl_loc){
    var default_loc = toLoc(default_krl_loc.start, default_krl_loc.end);

    return function(){
      var args = Array.prototype.slice.call(arguments);
      var last_i = args.length - 1;
      var last = args[last_i];
      if(isKRL_loc(last)){
        args[last_i] = toLoc(last.start, last.end);
      }else{
        args.push(default_loc);
      }
      return mkTree.apply(null, args);
    };
  };

  var compile = function compile(ast, context){
    if(_.isArray(ast)){
      return _.map(ast, function(a){
        return compile(a);
      });
    }else if(!_.has(ast, "type")){
      throw new Error("Invalid ast node: " + JSON.stringify(ast));
    }else if(!_.has(comp_by_type, ast.type)){
      throw new Error("Unsupported ast node type: " + ast.type);
    }
    var comp = compile;
    if(context){
      comp = function(ast, c){
        return compile(ast, c || context);
      };
    }
    return comp_by_type[ast.type](ast, comp, mkE(ast.loc), context);
  };

  return compile(ast);
};
