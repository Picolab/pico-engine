var _ = require("lodash");
var mkTree = require("estree-builder");
var callStdLibFn = require("./utils/callStdLibFn");

var mkDbCall = function(e, method, args){
  return e("call", e("id", "ctx.persistent." + method), args);
};

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
      return e("call", e("id", "ctx.event.getAttr"), [e("str", ast.value)]);
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
    if(ast.domain === "ent"){
      return mkDbCall(e, "getEnt", [
        e("str", ast.value)
      ]);
    }else if(ast.domain === "app"){
      return mkDbCall(e, "getApp", [
        e("str", ast.value)
      ]);
    }
    return e("call", e("id", "ctx.modules.get"), [
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
      //operator syntax is just sugar
      var operator = ast.callee.property;
      var callee = e("get",
        e("id", "ctx.krl.stdlib", operator.loc),
        e("string", operator.value, operator.loc),
        operator.loc
      );
      return e("call", callee, [comp(ast.callee.object)].concat(comp(ast.args)));
    }
    //TODO rethink this
    if(ast.callee.type === "DomainIdentifier" && ast.callee.domain === "engine"){
      return e("call", e("id", "ctx.engine." + ast.callee.value), comp(ast.args));
    }
    //TODO undo this hack
    if(ast.callee.type === "DomainIdentifier"
        && ast.callee.domain === "event"
        && ast.callee.value === "attr"
        ){
      return e("call", e("id", "ctx.event.getAttr", ast.callee.loc), comp(ast.args));
    }
    return e("call", comp(ast.callee), [
      e("id", "ctx"),
      e("array", comp(ast.args))
    ]);
  },
  "InfixOperator": function(ast, comp, e){
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
    return e("call", e("id", "ctx.krl.Closure"), [
      e("id", "ctx"),
      e("fn", ["ctx"], body)
    ]);
  },
  "Declaration": function(ast, comp, e){
    if(ast.op === "="){
      if(ast.left
          && ast.left.type === "DomainIdentifier"
          && ast.left.domain === "ent"
        ){
        return e(";", mkDbCall(e, "putEnt", [
          e("str", ast.left.value, ast.left.loc),
          comp(ast.right)
        ]));
      }else if(ast.left
          && ast.left.type === "DomainIdentifier"
          && ast.left.domain === "app"
        ){
        return e(";", mkDbCall(e, "putApp", [
          e("str", ast.left.value, ast.left.loc),
          comp(ast.right)
        ]));
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
    var meta = {};
    _.each(comp(ast.meta), function(pair){
      meta[pair[0]] = pair[1];
    });
    var rs = {
      rid: comp(ast.rid),
      meta: e("obj", meta)
    };
    if(!_.isEmpty(ast.global)){
      _.each(ast.global, function(g){
        if(!g || g.type !== "Declaration"){
          throw new Error("Ruleset.global should only be declarations");
        }
        if(g.left && g.left.type === "DomainIdentifier"){
          if(g.left.domain === "ent"){
            throw new Error("Cannot set ent:* vars in the global scope");
          }
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
  "RulesetMetaProperty": function(ast, comp, e){
    var key = ast.key.value;
    var val = e("nil");
    if(key === "shares" || key === "provides"){
      val = e("arr", _.map(ast.value.ids, function(id){
        return e("str", id.value, id.loc);
      }));
    }else if(key === "use"){
      if(ast.value.kind === "module"){
        //TODO support multiple 'use'
        val = e("array", [
          e("fn", ["ctx"], [
            e(";", e("call", e("id", "ctx.modules.use", ast.value.loc), [
              ast.value.alias
                ? e("str", ast.value.alias.value, ast.value.alias.loc)
                : e("str", ast.value.rid.value, ast.value.rid.loc),
              e("str", ast.value.rid.value, ast.value.rid.loc)
            ], ast.value.loc), ast.value.loc)
          ], ast.value.loc)
        ], ast.value.loc);
        //TODO use -> ast.value.version
        //TODO use -> ast.value["with"]
      }
    }else if(ast.value.type === "String"){
      val = e("string", ast.value.value, ast.value.loc);
    }else if(ast.value.type === "Chevron"){
      val = e("string", ast.value.value[0].value, ast.value.value[0].loc);
    }else if(ast.value.type === "Boolean"){
      val = e(ast.value.value ? "true" : "false", ast.value.loc);
    }
    return [key, val];
  },
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
  "RuleAction": function(ast, comp, e){
    var fn_body = [];
    if(ast.action
        && ast.action.type === "Identifier"
        && ast.action.value === "send_directive"){
      fn_body.push(e("return", e("obj", {
        type: e("str", "directive"),
        name: e("str", ast.args[0].value),
        options: e("obj", _.fromPairs(_.map(ast["with"], function(dec){
          return [dec.left.value, comp(dec.right)];
        })))
      })));
    }else if(ast.action
        && ast.action.type === "Identifier"
        && ast.action.value === "noop"){
      fn_body.push(e("return", e("void", e("number", 0))));
    }else{
      throw new Error("Unsuported RuleAction.action");
    }
    var obj = {};
    if(ast.label && ast.label.type === "Identifier"){
      obj.label = e("str", ast.label.value, ast.label.loc);
    }
    obj.action = e("fn", ["ctx"], fn_body);
    return e("obj", obj);
  },
  "RulePostlude": require("./c/RulePostlude")
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
